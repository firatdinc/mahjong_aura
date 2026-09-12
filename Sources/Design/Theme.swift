import SwiftUI

/// Görsel dil — 2.0.1 ekran kaydından çıkarıldı.
/// Kaynak: ~/Desktop/MahjongAura-YEDEK/KURTARMA-KITI/V2-SARTNAME.md § 3
enum Theme {

    // MARK: - Renkler

    /// Oyun ekranı arka planı: koyu yeşil radyal gradyan (merkez açık, kenar koyu)
    static let feltCenter = Color(red: 0.13, green: 0.36, blue: 0.22)
    static let feltEdge   = Color(red: 0.05, green: 0.16, blue: 0.10)

    /// Lobi: sıcak ahşap
    static let woodLight = Color(red: 0.45, green: 0.31, blue: 0.19)
    static let woodDark  = Color(red: 0.27, green: 0.18, blue: 0.11)

    /// Vurgu — Aura puanı, mevcut bölüm düğümü, kart başlıkları
    static let amber       = Color(red: 0.91, green: 0.57, blue: 0.24)
    static let amberBright = Color(red: 0.98, green: 0.72, blue: 0.30)

    /// Birincil aksiyon butonu (hap şeklinde, alt kenarı koyu)
    static let actionGreen     = Color(red: 0.42, green: 0.78, blue: 0.24)
    static let actionGreenDeep = Color(red: 0.28, green: 0.58, blue: 0.14)

    /// Taş yüzeyleri
    static let tileFace    = Color(red: 0.96, green: 0.95, blue: 0.90)
    static let tileEdge    = Color(red: 0.42, green: 0.76, blue: 0.29)
    static let tileBlocked = Color(red: 0.66, green: 0.67, blue: 0.65)

    /// Taş sembolleri
    static let symbolNavy  = Color(red: 0.14, green: 0.22, blue: 0.36)
    static let symbolTeal  = Color(red: 0.10, green: 0.50, blue: 0.44)
    static let symbolRed   = Color(red: 0.75, green: 0.18, blue: 0.15)
    static let symbolGreen = Color(red: 0.16, green: 0.52, blue: 0.24)

    /// Tepsi: koyu kahve dolgu + parlak yeşil neon kenarlık
    static let trayFill   = Color(red: 0.16, green: 0.10, blue: 0.05)
    static let trayStroke = Color(red: 0.50, green: 0.88, blue: 0.25)

    /// Booster butonu
    static let boosterFill   = Color(red: 0.22, green: 0.14, blue: 0.08)
    static let boosterStroke = Color(red: 0.80, green: 0.48, blue: 0.20)
    static let badgeRed      = Color(red: 0.85, green: 0.18, blue: 0.16)

    // MARK: - Gradyanlar

    static var feltBackground: some ShapeStyle {
        RadialGradient(
            colors: [feltCenter, feltEdge],
            center: .init(x: 0.5, y: 0.38),
            startRadius: 40,
            endRadius: 620
        )
    }

    static var woodBackground: some ShapeStyle {
        LinearGradient(
            colors: [woodLight, woodDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Ölçüler

    enum Metric {
        /// Taşın 3B alt kenar kalınlığı
        static let tileEdgeDepth: CGFloat = 6
        static let tileCorner: CGFloat = 10
        static let trayCorner: CGFloat = 14
        static let trayStrokeWidth: CGFloat = 3
        static let actionButtonHeight: CGFloat = 58
        static let boosterDiameter: CGFloat = 62
    }
}
