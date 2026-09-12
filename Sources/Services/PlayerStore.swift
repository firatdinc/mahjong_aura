import Foundation

/// Oyuncu ilerlemesinin kalıcı kaydı.
///
/// **Bilinçli karar (2026-09-12):** Yayındaki 2.0.1'in UserDefaults anahtar
/// adları bilinmiyor (kaynak kayıp, ikili şifreli) ve telefon yedeğinden
/// çıkarılmayacak. Yeni sürüm kendi anahtarlarıyla **sıfırdan** başlıyor.
///
/// Kabul edilen sonuç: güncellemeyi alan mevcut oyuncuların bölüm ilerlemesi,
/// Aura puanı ve tüketilebilir booster bakiyeleri sıfırlanır.
///
/// Etkilenmeyen: `removeAds` non-consumable olduğu için Apple sunucusunda
/// tutuluyor; StoreKit `currentEntitlements` ile otomatik geri yüklenir.
///
/// Geri alınabilirlik: farklı anahtar adları kullandığımız için eski kayıtlar
/// silinmiyor, cihazda duruyor. `legacySnapshot` ilk açılışta hepsinin bir
/// kopyasını da alıyor. Anahtar adları ileride öğrenilirse bir güncellemeyle
/// ilerleme geri getirilebilir.
final class PlayerStore: ObservableObject {

    enum Key {
        /// İlk açılışta alınan, önceki sürüme ait tüm kayıtların kopyası.
        static let legacySnapshot = "v21.legacySnapshot"
        static let highestLevel   = "highestLevel"
        static let currentLevel   = "currentLevel"
        static let totalAura      = "totalAura"
        static let bestCombo      = "bestCombo"
        static let starsByLevel   = "starsByLevel"
        static let zenModeEnabled = "zenModeEnabled"
        static let removeAds      = "removeAdsPurchased"
        static let hintCount      = "hintCount"
        static let undoCount      = "undoCount"
        static let reviveCount    = "reviveCount"
        static let schemaVersion  = "schemaVersion"
        static let reviewMilestones = "v21.reviewMilestones"
        static let bestAura = "v21.bestAura"
    }

    private let defaults: UserDefaults

    @Published private(set) var highestLevel: Int
    @Published private(set) var currentLevel: Int
    @Published private(set) var totalAura: Double
    /// Tek bölümde elde edilen en yüksek Aura — Game Center `bestiq` tablosuna gider.
    @Published private(set) var bestAura: Double
    @Published var zenModeEnabled: Bool { didSet { defaults.set(zenModeEnabled, forKey: Key.zenModeEnabled) } }

    /// Booster bakiyeleri. Yayımlanan durum olmalı, yoksa satın alma sonrası
    /// arayüz kendini yenilemez.
    @Published private(set) var balances: [Booster: Int] = [:]

    /// `removeAds` satın alındıysa booster'lar sınırsız sayılır.
    /// Doğruluk kaynağı StoreKit; bu yalnızca önbellek.
    @Published private(set) var hasRemoveAds: Bool

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        Self.snapshotLegacyDefaultsIfNeeded(defaults)

        // Yeni sürüm sıfırdan başlar; kayıt yoksa 1. bölüm.
        self.highestLevel = max(1, defaults.integer(forKey: Key.highestLevel))
        self.currentLevel = max(1, defaults.integer(forKey: Key.currentLevel))
        self.totalAura = defaults.double(forKey: Key.totalAura)
        self.bestAura = defaults.double(forKey: Key.bestAura)
        self.zenModeEnabled = defaults.bool(forKey: Key.zenModeEnabled)
        self.hasRemoveAds = defaults.bool(forKey: Key.removeAds)

        self.balances = [
            .hint:   defaults.integer(forKey: Key.hintCount),
            .undo:   defaults.integer(forKey: Key.undoCount),
            .revive: defaults.integer(forKey: Key.reviveCount),
        ]
    }

    /// Önceki sürümden kalan tüm kayıtların bir kopyasını saklar.
    ///
    /// Yeni sürüm kendi anahtarlarını kullandığı için eski değerler zaten
    /// silinmiyor, ama bu kopya onları tek bir yerde toplar: anahtar adları
    /// ileride çözülürse ilerleme buradan geri getirilebilir. Bir kez çalışır.
    private static func snapshotLegacyDefaultsIfNeeded(_ defaults: UserDefaults) {
        guard defaults.object(forKey: Key.legacySnapshot) == nil else { return }

        let systemPrefixes = ["Apple", "NS", "com.apple", "AK", "PK", "WebKit", "INNext"]
        var legacy: [String: String] = [:]

        for (key, value) in defaults.dictionaryRepresentation() {
            if systemPrefixes.contains(where: { key.hasPrefix($0) }) { continue }
            if key.hasPrefix("v21.") { continue }          // bu sürümün kendi kayıtları
            legacy[key] = String(describing: value)
        }

        // Hiç eski kayıt yoksa da boş bir kopya yazıyoruz ki bir daha taranmasın.
        defaults.set(legacy, forKey: Key.legacySnapshot)
    }

    /// Önceki sürümden devralınan ham kayıtlar (varsa). Tanı amaçlı.
    var legacySnapshot: [String: String] {
        defaults.dictionary(forKey: Key.legacySnapshot) as? [String: String] ?? [:]
    }

    // MARK: - Booster bakiyeleri

    func balance(of booster: Booster) -> Int {
        // Shuffle sayaçla değil, bölüm kilidiyle yönetiliyor.
        guard booster != .shuffle else { return 0 }
        return balances[booster] ?? 0
    }

    func credit(_ booster: Booster, _ amount: Int) {
        guard booster != .shuffle else { return }
        let updated = max(0, (balances[booster] ?? 0) + amount)
        balances[booster] = updated
        defaults.set(updated, forKey: Self.defaultsKey(for: booster))
    }

    private static func defaultsKey(for booster: Booster) -> String {
        switch booster {
        case .hint:    return Key.hintCount
        case .undo:    return Key.undoCount
        case .revive:  return Key.reviveCount
        case .shuffle: return Key.hintCount // ulaşılmaz
        }
    }

    /// StoreKit'ten gelen hak durumunu yansıtır.
    func setRemoveAds(_ owned: Bool) {
        guard hasRemoveAds != owned else { return }
        hasRemoveAds = owned
        defaults.set(owned, forKey: Key.removeAds)
    }

    // MARK: - Puan istemi (App Store değerlendirmesi)

    /// ASO: rakiplerin 55–62 bin puanı var, bizde ortalama gösterilemiyor.
    /// Puan sayısı sıralamayı ve dönüşümü metin optimizasyonundan çok belirliyor.
    ///
    /// Eşikler: 3., 10. ve 25. bölüm — her biri bir kez.
    /// Ömür boyu tek sefer sınırı kaldırıldı; Apple zaten yılda 3 gösterimle
    /// sınırlıyor ve asıl sorun puan azlığı. İstem yalnızca bölüm kazanıldıktan
    /// sonra tetiklenir; kaybedilen bölümden veya reklamdan sonra asla.
    static let reviewMilestones = [3, 10, 25]

    func shouldRequestReview(afterLevel level: Int) -> Bool {
        guard Self.reviewMilestones.contains(level) else { return false }
        return !requestedMilestones.contains(level)
    }

    private var requestedMilestones: [Int] {
        defaults.array(forKey: Key.reviewMilestones) as? [Int] ?? []
    }

    func markReviewRequested(atLevel level: Int) {
        var done = requestedMilestones
        guard !done.contains(level) else { return }
        done.append(level)
        defaults.set(done, forKey: Key.reviewMilestones)
    }

    // MARK: - İlerleme

    func completeLevel(_ level: Int, aura: Double) {
        currentLevel = level + 1
        highestLevel = max(highestLevel, currentLevel)
        totalAura += aura
        if aura > bestAura {
            bestAura = aura
            defaults.set(bestAura, forKey: Key.bestAura)
        }
        defaults.set(currentLevel, forKey: Key.currentLevel)
        defaults.set(highestLevel, forKey: Key.highestLevel)
        defaults.set(totalAura, forKey: Key.totalAura)
    }
}
