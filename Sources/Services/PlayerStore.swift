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
        static let reviewRequested = "v21.reviewRequested"
    }

    private let defaults: UserDefaults

    @Published private(set) var highestLevel: Int
    @Published private(set) var currentLevel: Int
    @Published private(set) var totalAura: Double
    @Published var zenModeEnabled: Bool { didSet { defaults.set(zenModeEnabled, forKey: Key.zenModeEnabled) } }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        Self.snapshotLegacyDefaultsIfNeeded(defaults)

        // Yeni sürüm sıfırdan başlar; kayıt yoksa 1. bölüm.
        self.highestLevel = max(1, defaults.integer(forKey: Key.highestLevel))
        self.currentLevel = max(1, defaults.integer(forKey: Key.currentLevel))
        self.totalAura = defaults.double(forKey: Key.totalAura)
        self.zenModeEnabled = defaults.bool(forKey: Key.zenModeEnabled)
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
        switch booster {
        case .hint:   return defaults.integer(forKey: Key.hintCount)
        case .undo:   return defaults.integer(forKey: Key.undoCount)
        case .revive: return defaults.integer(forKey: Key.reviveCount)
        case .shuffle: return 0 // shuffle sayaçla değil, bölüm kilidiyle yönetiliyor
        }
    }

    func credit(_ booster: Booster, _ amount: Int) {
        let key: String
        switch booster {
        case .hint:   key = Key.hintCount
        case .undo:   key = Key.undoCount
        case .revive: key = Key.reviveCount
        case .shuffle: return
        }
        defaults.set(defaults.integer(forKey: key) + amount, forKey: key)
    }

    /// removeAds satın alındıysa booster'lar sınırsız sayılır.
    var hasRemoveAds: Bool { defaults.bool(forKey: Key.removeAds) }

    // MARK: - Puan istemi (App Store değerlendirmesi)

    /// ASO analizi: rakiplerin 55–62 bin puanı var, bizde puan ortalaması
    /// gösterilemeyecek kadar az. Puan sayısı hem sıralamayı hem dönüşümü
    /// belirliyor — metin optimizasyonundan daha belirleyici.
    ///
    /// İstem yalnızca olumlu bir anda (bölüm kazanıldıktan hemen sonra) ve
    /// oyuncu oyunu tanıdıktan sonra gösterilir. Apple zaten yılda 3 istemle
    /// sınırlıyor; biz bir kez soruyoruz ki rahatsız etmesin.
    func shouldRequestReview(afterLevel level: Int) -> Bool {
        guard !defaults.bool(forKey: Key.reviewRequested) else { return false }
        return level == 3 || level == 5
    }

    func markReviewRequested() {
        defaults.set(true, forKey: Key.reviewRequested)
    }

    // MARK: - İlerleme

    func completeLevel(_ level: Int, aura: Double) {
        currentLevel = level + 1
        highestLevel = max(highestLevel, currentLevel)
        totalAura += aura
        defaults.set(currentLevel, forKey: Key.currentLevel)
        defaults.set(highestLevel, forKey: Key.highestLevel)
        defaults.set(totalAura, forKey: Key.totalAura)
    }
}
