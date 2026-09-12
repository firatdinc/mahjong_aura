import Foundation

/// Oyuncu ilerlemesinin kalıcı kaydı.
///
/// ════════════════════════════════════════════════════════════════════
/// 🚨 ÇÖZÜLMEMİŞ: Yayındaki 2.0.1'in UserDefaults anahtarları BİLİNMİYOR.
///
/// 2.0.1 kaynağı kayıp ve ikili FairPlay ile şifreli olduğu için anahtar
/// adları okunamıyor. Aşağıdaki `Key` değerleri TAHMİN — doğrulanmadı.
///
/// Bu dosya, bir iPhone'un şifreli Finder yedeğinden `com.mahjongaura.app`
/// kabının `Library/Preferences/com.mahjongaura.app.plist` dosyası
/// çıkarılıp anahtarlar birebir okunmadan CANLIYA GÖNDERİLEMEZ.
///
/// Yanlış anahtarla yayınlanırsa: güncellemeyi alan her oyuncunun bölüm
/// ilerlemesi, Aura puanı ve satın aldığı booster bakiyesi sıfırlanır.
///
/// Doğrulandığında: `keysVerified` true yapılacak ve bu blok silinecek.
/// ════════════════════════════════════════════════════════════════════
final class PlayerStore: ObservableObject {

    /// Yedekten anahtarlar teyit edilene kadar false kalır.
    /// Release derlemesi bu bayrak false iken hata verir (aşağıdaki assert).
    static let keysVerified = false

    enum Key {
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
    }

    private let defaults: UserDefaults

    @Published private(set) var highestLevel: Int
    @Published private(set) var currentLevel: Int
    @Published private(set) var totalAura: Double
    @Published var zenModeEnabled: Bool { didSet { defaults.set(zenModeEnabled, forKey: Key.zenModeEnabled) } }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults

        // 2.0.1 hiç oynanmamışsa ilk bölümden başla.
        self.highestLevel = max(1, defaults.integer(forKey: Key.highestLevel))
        self.currentLevel = max(1, defaults.integer(forKey: Key.currentLevel))
        self.totalAura = defaults.double(forKey: Key.totalAura)
        self.zenModeEnabled = defaults.bool(forKey: Key.zenModeEnabled)

        assert(
            Self.keysVerified,
            """
            PlayerStore anahtarları henüz doğrulanmadı. Şifreli iPhone yedeğinden \
            com.mahjongaura.app.plist çıkarılıp Key sabitleri birebir eşlenmeden \
            yayına çıkılamaz — yoksa tüm oyuncu ilerlemesi sıfırlanır.
            """
        )
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
