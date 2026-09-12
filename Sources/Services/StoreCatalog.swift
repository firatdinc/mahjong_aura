import Foundation

/// App Store Connect'ten kurtarılan CANLI kimlikler (2026-09-12).
///
/// ⚠️ Bu değerlerin hiçbiri değiştirilemez. Yayındaki 2.0.1 sürümü bunları
/// kullanıyor; farklı bir değer yazılırsa:
///   • satın almalar çalışmaz, `removeAds` almış kullanıcılar hakkını kaybeder
///   • Game Center'daki tüm mevcut skorlar sıfırlanır
///
/// Kaynak: KURTARMA-KITI/asc/ASC-TAM-DOKUM.md
enum StoreCatalog {

    static let bundleID = "com.mahjongaura.app"

    /// AdMob uygulama kimliği (Info.plist'teki GADApplicationIdentifier ile aynı olmalı)
    static let adMobAppID = "ca-app-pub-8571533711927103~6034352154"

    // MARK: - Uygulama içi satın almalar

    enum Product: String, CaseIterable, Sendable {
        /// Kalıcı. Reklamları kaldırır VE ipucu/geri alma/devam haklarını
        /// sonsuza dek ücretsiz yeniler. Ekonominin merkezi bu ürün.
        case removeAds = "com.mahjongaura.app.removeads"

        case boosterBundle = "com.mahjongaura.app.bundle"
        case hints20       = "com.mahjongaura.app.hints20"
        case undos30       = "com.mahjongaura.app.undos30"
        case revives10     = "com.mahjongaura.app.revives10"

        var isConsumable: Bool { self != .removeAds }

        /// Tüketilebilir ürünün kullanıcıya verdiği miktarlar.
        var grants: [Booster: Int] {
            switch self {
            case .removeAds:     return [:]
            case .hints20:       return [.hint: 20]
            case .undos30:       return [.undo: 30]
            case .revives10:     return [.revive: 10]
            case .boosterBundle: return [.hint: 20, .undo: 30, .revive: 10]
            }
        }
    }

    // MARK: - Game Center

    enum Leaderboard: String, CaseIterable, Sendable {
        case highestLevel = "com.mahjongaura.app.levels"
        case bestIQ       = "com.mahjongaura.app.bestiq"
    }

    /// ASC'de tanımlı başarım yok.
    static let achievements: [String] = []
}

/// Oyun içi güçlendiriciler.
enum Booster: String, CaseIterable, Sendable {
    case shuffle, hint, undo, revive

    /// Shuffle 6. bölümde açılıyor (oyun ekranında butonun altında "Lv. 6" yazıyor).
    var unlocksAtLevel: Int {
        switch self {
        case .shuffle: return 6
        default:       return 1
        }
    }
}
