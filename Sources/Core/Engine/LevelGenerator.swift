import Foundation

/// Bölüm üretimi.
///
/// Yayındaki 2.0.1 paketinde hiç bölüm veri dosyası yok — 2000 bölüm
/// **bölüm numarasından deterministik olarak** üretiliyor olmalı. Aynı
/// yaklaşımı kuruyoruz: `seed = level` → her cihazda aynı tahta.
///
/// **Çözülebilirlik garantisi:** tahta, her adımda ikisi de serbest olan taş
/// çiftleri sökülerek kurulur. Sökme sırası zaten geçerli bir çözümdür ve
/// hiçbir anda tepside 2'den fazla taş gerekmez — yani 4 yuvalı tepsiyle
/// (Zen'de 5) her bölüm bitirilebilir.
enum LevelGenerator {

    static let totalLevels = 2000

    struct Level: Sendable {
        let number: Int
        let tiles: [Tile]
        /// Üretim sırasında bulunan çözüm — ipucu (hint) booster'ı bunu kullanır.
        let solution: [(UUID, UUID)]
    }

    // MARK: - Zorluk eğrisi

    /// Bölüm başına çift sayısı. 6 çiftten (12 taş) başlar, 72 çifte (144 taş)
    /// doğru yumuşak bir eğriyle çıkar — "gentle difficulty curve".
    static func pairCount(for level: Int) -> Int {
        let eased = 6.0 + 66.0 * pow(min(1.0, Double(level - 1) / 900.0), 0.75)
        return max(6, min(72, Int(eased.rounded())))
    }

    /// Katman sayısı — ilk bölümler tek katman, sonra derinleşir.
    static func layerCount(for level: Int) -> Int {
        switch level {
        case ..<8:    return 1
        case ..<25:   return 2
        case ..<80:   return 3
        case ..<300:  return 4
        default:      return 5
        }
    }

    // MARK: - Üretim

    static func make(level: Int) -> Level {
        let pairs = pairCount(for: level)
        let layers = layerCount(for: level)

        // Farklı tohumlarla birkaç deneme; şekil elverişsizse yenisini dener.
        for attempt in 0..<12 {
            var rng = SplitMix64(seed: UInt64(level) &* 0x9E37_79B9 &+ UInt64(attempt))
            let positions = layout(pairs: pairs, layers: layers, rng: &rng)
            guard positions.count == pairs * 2 else { continue }
            if let level = assemble(number: level, positions: positions, rng: &rng) {
                return level
            }
        }

        // Hiçbir deneme tutmazsa tek katmanlı, kesin çözülebilir yedeğe düş.
        var rng = SplitMix64(seed: UInt64(level))
        let flat = flatLayout(pairs: pairs)
        return assemble(number: level, positions: flat, rng: &rng)
            ?? Level(number: level, tiles: [], solution: [])
    }

    /// Taşları yerleştirip çözülebilirliği garanti eder.
    /// Her adımda serbest olan iki konum seçilir; ikisine aynı tür atanır.
    private static func assemble(number: Int,
                                 positions: [TilePosition],
                                 rng: inout SplitMix64) -> Level? {
        var remaining = positions
        var removalOrder: [(TilePosition, TilePosition)] = []

        while !remaining.isEmpty {
            let free = remaining.filter { isFree($0, among: remaining) }
            guard free.count >= 2 else { return nil }

            let freeCount: UInt64 = UInt64(free.count)
            let indexA: Int = Int(rng.next(upperBound: freeCount))
            let a: TilePosition = free[indexA]

            let rest: [TilePosition] = free.filter { $0 != a }
            let restCount: UInt64 = UInt64(rest.count)
            let indexB: Int = Int(rng.next(upperBound: restCount))
            let b: TilePosition = rest[indexB]

            remaining.removeAll { (p: TilePosition) -> Bool in
                p == a || p == b
            }
            removalOrder.append((a, b))
        }

        // Tür havuzu: her çifte bir tür. Havuz karıştırılır ki dağılım değişsin.
        var pool = tileKindPool(count: removalOrder.count, rng: &rng)

        var tiles: [Tile] = []
        var solution: [(UUID, UUID)] = []
        for (a, b) in removalOrder {
            let kind = pool.removeLast()
            let first = Tile(kind: kind, position: a)
            let second = Tile(kind: kind, position: b)
            tiles.append(first)
            tiles.append(second)
            solution.append((first.id, second.id))
        }
        return Level(number: number, tiles: tiles, solution: solution)
    }

    // MARK: - Serbestlik (BoardEngine ile aynı kural, konum düzeyinde)

    private static func isFree(_ p: TilePosition, among all: [TilePosition]) -> Bool {
        for q in all where q != p {
            if q.layer > p.layer && q.overlaps(p) { return false }
        }
        var left = false, right = false
        for q in all where q != p && q.layer == p.layer {
            guard abs(q.row - p.row) < 2 else { continue }
            if q.col == p.col - 2 { left = true }
            if q.col == p.col + 2 { right = true }
        }
        return !(left && right)
    }

    // MARK: - Yerleşim şekilleri

    /// Katmanlı, ortaya doğru daralan piramit benzeri yerleşim.
    private static func layout(pairs: Int, layers: Int, rng: inout SplitMix64) -> [TilePosition] {
        let total = pairs * 2
        var positions: [TilePosition] = []
        var placed = 0
        var layer = 0

        // Taban genişliği, toplam taşı katmanlara dağıtacak şekilde seçilir.
        let baseCols = max(4, Int((Double(total) / Double(max(1, layers)) / 1.4).squareRootRounded()) + 2)

        while placed < total && layer < layers {
            let shrink = layer
            let cols = max(2, baseCols - shrink)
            let rows = max(2, baseCols - shrink - 1)

            var layerPositions: [TilePosition] = []
            for r in 0..<rows {
                for c in 0..<cols {
                    layerPositions.append(
                        TilePosition(layer: layer, row: (r + shrink) * 2, col: (c + shrink) * 2)
                    )
                }
            }

            let capacity = min(layerPositions.count, total - placed)
            positions.append(contentsOf: layerPositions.prefix(capacity))
            placed += capacity
            layer += 1
        }

        // Katmanlar yetmediyse kalanı tabana yay.
        var extraCol = 0
        while placed < total {
            positions.append(TilePosition(layer: 0, row: -2, col: extraCol * 2))
            extraCol += 1
            placed += 1
        }

        // Tek sayıya düşmemesi için kırp.
        if positions.count % 2 != 0 { positions.removeLast() }
        return positions
    }

    /// Tek sıra/tek katman — her zaman çözülebilir yedek plan.
    private static func flatLayout(pairs: Int) -> [TilePosition] {
        (0..<(pairs * 2)).map { i in
            TilePosition(layer: 0, row: (i / 8) * 2, col: (i % 8) * 2)
        }
    }

    // MARK: - Tür havuzu

    private static func tileKindPool(count: Int, rng: inout SplitMix64) -> [TileKind] {
        var all: [TileKind] = []
        for n in 1...9 { all.append(.bamboo(n)); all.append(.dot(n)); all.append(.character(n)) }
        for w in TileKind.Wind.allCases { all.append(.wind(w)) }
        for d in TileKind.Dragon.allCases { all.append(.dragon(d)) }

        var pool: [TileKind] = []
        while pool.count < count {
            var shuffled = all
            // Fisher–Yates, tohumlanmış
            for i in stride(from: shuffled.count - 1, to: 0, by: -1) {
                let j = Int(rng.next(upperBound: UInt64(i + 1)))
                shuffled.swapAt(i, j)
            }
            pool.append(contentsOf: shuffled)
        }
        return Array(pool.prefix(count))
    }
}

// MARK: - Tohumlanmış rastgelelik

/// Deterministik üretici — aynı bölüm her cihazda aynı tahtayı verir.
struct SplitMix64 {
    private var state: UInt64
    init(seed: UInt64) { state = seed &+ 0x9E37_79B9_7F4A_7C15 }

    mutating func next() -> UInt64 {
        state = state &+ 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }

    mutating func next(upperBound: UInt64) -> UInt64 {
        guard upperBound > 1 else { return 0 }
        return next() % upperBound
    }
}

private extension Double {
    func squareRootRounded() -> Double { Foundation.sqrt(self).rounded() }
}
