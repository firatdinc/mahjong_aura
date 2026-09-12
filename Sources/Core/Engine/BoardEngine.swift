import Foundation

/// Tahta ve tepsi kuralları.
///
/// Mekanik, 2.0.1 ekran kaydından birebir çıkarıldı
/// (KURTARMA-KITI/V2-SARTNAME.md § 1):
///
///  • Serbest taş = üstü kapalı DEĞİL **ve** sağ ya da sol kenarı açık
///    (klasik mahjong solitaire kuralı; oyun kapalı taşa dokununca
///    "Blocked on both sides" uyarısı veriyor)
///  • Dokunulan serbest taş tepsiye gider
///  • Tepside **2 aynı** taş buluşunca ikisi birden temizlenir (çift, üçlü değil)
///  • Tepsi kapasitesi 4 — Zen Modu açıkken 5
///  • Tepsi dolar ve eşleşme yoksa bölüm kaybedilir (Revive ile devam)
struct BoardEngine: Sendable {

    enum TrayCapacity {
        static let normal = 4
        static let zen = 5
    }

    private(set) var tiles: [Tile]
    private(set) var tray: [Tile] = []
    let trayCapacity: Int

    init(tiles: [Tile], zenMode: Bool) {
        self.tiles = tiles
        self.trayCapacity = zenMode ? TrayCapacity.zen : TrayCapacity.normal
    }

    // MARK: - Serbest taş kuralı

    /// Taşın üstü, bir üst katmandaki herhangi bir taşla örtülü mü?
    func isCovered(_ tile: Tile) -> Bool {
        tiles.contains { other in
            other.id != tile.id
                && other.position.layer > tile.position.layer
                && other.position.overlaps(tile.position)
        }
    }

    /// Aynı katmanda, taşın `columnOffset` kadar yanında komşu var mı?
    private func hasNeighbour(_ tile: Tile, columnOffset: Int) -> Bool {
        let target: Int = tile.position.col + columnOffset
        for other in tiles {
            if other.id == tile.id { continue }
            if other.position.layer != tile.position.layer { continue }
            if other.position.col != target { continue }
            let rowGap: Int = abs(other.position.row - tile.position.row)
            if rowGap < 2 { return true }
        }
        return false
    }

    private func hasLeftNeighbour(_ tile: Tile) -> Bool {
        hasNeighbour(tile, columnOffset: -2)
    }

    private func hasRightNeighbour(_ tile: Tile) -> Bool {
        hasNeighbour(tile, columnOffset: 2)
    }

    /// Taş oynanabilir mi?
    func isFree(_ tile: Tile) -> Bool {
        guard !isCovered(tile) else { return false }
        return !(hasLeftNeighbour(tile) && hasRightNeighbour(tile))
    }

    var freeTiles: [Tile] { tiles.filter(isFree) }

    // MARK: - Tepsi

    enum TapOutcome: Equatable, Sendable {
        case blocked            // "Blocked on both sides"
        case moved              // taş tepsiye gitti
        case matched            // tepside çift oluştu, ikisi temizlendi
        case trayFull           // tepsi doldu, eşleşme yok → kayıp
    }

    /// Tepside eşleşme yapmadan kalan yer.
    var remainingTraySlots: Int { trayCapacity - tray.count }

    /// Tepsi dolmak üzere mi ("Careful — tray almost full!" uyarısı için).
    var isTrayNearlyFull: Bool { remainingTraySlots <= 1 }

    mutating func tap(_ tile: Tile) -> TapOutcome {
        guard isFree(tile) else { return .blocked }
        guard remainingTraySlots > 0 else { return .trayFull }

        tiles.removeAll { $0.id == tile.id }
        tray.append(tile)

        // Tepside aynı türden ikinci taş var mı?
        if let partnerIndex = tray.firstIndex(where: { $0.id != tile.id && $0.kind.matches(tile.kind) }) {
            let partnerID = tray[partnerIndex].id
            tray.removeAll { $0.id == tile.id || $0.id == partnerID }
            return .matched
        }

        return remainingTraySlots == 0 ? .trayFull : .moved
    }

    /// Tahtada hâlâ oynanabilir bir eşleşme var mı?
    /// (Shuffle booster'ının gerekip gerekmediğini belirler.)
    var hasAvailableMatch: Bool {
        let free = freeTiles
        for i in free.indices {
            for j in (i + 1)..<free.count where free[i].kind.matches(free[j].kind) {
                return true
            }
        }
        // Tepsidekilerle eşleşen serbest taş da sayılır.
        return free.contains { tile in tray.contains { $0.kind.matches(tile.kind) } }
    }

    var isCleared: Bool { tiles.isEmpty && tray.isEmpty }

    /// Bölüm kaybedildi mi: tepsi dolu ve içinde eşleşme yok.
    var isLost: Bool {
        remainingTraySlots == 0 && !trayHasPair
    }

    private var trayHasPair: Bool {
        for i in tray.indices {
            for j in (i + 1)..<tray.count where tray[i].kind.matches(tray[j].kind) {
                return true
            }
        }
        return false
    }

    // MARK: - Boosterlar

    /// **Undo** — tepsiye en son giren taşı tahtadaki yerine geri koyar.
    /// Taşlar özgün konumlarını taşıdığı için yerleştirme kayıpsız.
    @discardableResult
    mutating func undo() -> Bool {
        guard let last = tray.popLast() else { return false }
        tiles.append(last)
        return true
    }

    /// **Revive** — "Full tray? No problem". Tepsideki en eski `count` taşı
    /// tahtadaki özgün yerlerine iade eder, böylece oyun sürebilir.
    @discardableResult
    mutating func revive(returning count: Int = 2) -> Int {
        let moving = min(count, tray.count)
        guard moving > 0 else { return 0 }
        let returned = tray.prefix(moving)
        tray.removeFirst(moving)
        tiles.append(contentsOf: returned)
        return moving
    }

    /// **Shuffle** — kalan taşların türlerini kendi aralarında karıştırır.
    /// Çift sayıları korunur; taş sayısı ve yerleşim değişmez.
    mutating func shuffle(using rng: inout SplitMix64) {
        var kinds = tiles.map(\.kind)
        for i in stride(from: kinds.count - 1, to: 0, by: -1) {
            let j = Int(rng.next(upperBound: UInt64(i + 1)))
            kinds.swapAt(i, j)
        }
        for i in tiles.indices {
            tiles[i] = Tile(id: tiles[i].id, kind: kinds[i], position: tiles[i].position)
        }
    }

    /// **Hint** — tahtada şu an eşleştirilebilecek bir çift döndürür.
    func hintPair() -> (Tile, Tile)? {
        let free = freeTiles
        // Önce tepsidekiyle eşleşen serbest taş (tek dokunuşla temizlenir).
        for tile in free {
            if let inTray = tray.first(where: { $0.kind.matches(tile.kind) }) {
                return (tile, inTray)
            }
        }
        for i in free.indices {
            for j in (i + 1)..<free.count where free[i].kind.matches(free[j].kind) {
                return (free[i], free[j])
            }
        }
        return nil
    }
}
