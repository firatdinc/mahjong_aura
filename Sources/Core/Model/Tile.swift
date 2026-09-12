import Foundation

/// Taş türü. Eşleşme bu değerin eşitliğiyle belirlenir.
enum TileKind: Hashable, Sendable {
    case bamboo(Int)     // 1...9  — dikey çubuklar
    case dot(Int)        // 1...9  — iç içe halkalar
    case character(Int)  // 1...9  — Çince rakam
    case wind(Wind)      // doğu/güney/batı/kuzey
    case dragon(Dragon)  // 中 kırmızı · 發 yeşil · beyaz
    case flower(Int)     // çiçek — ileri bölümlerde
    case season(Int)     // mevsim — ileri bölümlerde

    enum Wind: Int, CaseIterable, Sendable { case east, south, west, north }
    enum Dragon: Int, CaseIterable, Sendable { case red, green, white }

    /// Klasik mahjong'da çiçek ve mevsimler grup içinde birbiriyle eşleşir.
    /// Diğer tüm taşlar birebir aynı olmak zorunda.
    func matches(_ other: TileKind) -> Bool {
        switch (self, other) {
        case (.flower, .flower): return true
        case (.season, .season): return true
        default: return self == other
        }
    }
}

/// Tahtadaki konum. Mahjong yerleşimleri yarım adım kaydırma kullandığı için
/// `row` ve `col` yarım birim cinsindendir (1 taş = 2×2 yarım birim).
struct TilePosition: Hashable, Sendable {
    var layer: Int
    var row: Int
    var col: Int

    /// İki taş üst üste biniyor mu (aynı katmanda 2×2 alan çakışması).
    func overlaps(_ other: TilePosition) -> Bool {
        abs(row - other.row) < 2 && abs(col - other.col) < 2
    }
}

struct Tile: Identifiable, Hashable, Sendable {
    let id: UUID
    let kind: TileKind
    var position: TilePosition

    init(id: UUID = UUID(), kind: TileKind, position: TilePosition) {
        self.id = id
        self.kind = kind
        self.position = position
    }
}
