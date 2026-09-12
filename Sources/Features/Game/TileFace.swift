import SwiftUI

/// Tek bir taşın çizimi. Krem yüz + yeşil 3B alt kenar; kapalıysa gri.
/// Görseller kodla çiziliyor — yayındaki 2.0.1'de de öyleydi
/// (pakette AppIcon dışında hiç görsel varlık yok).
struct TileFace: View {
    let kind: TileKind
    var isBlocked: Bool = false

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let depth = Theme.Metric.tileEdgeDepth

            ZStack(alignment: .top) {
                // 3B yan/alt kenar
                RoundedRectangle(cornerRadius: Theme.Metric.tileCorner)
                    .fill(isBlocked ? Theme.tileBlocked.opacity(0.6) : Theme.tileEdge)
                    .frame(width: w, height: h)

                // Ön yüz
                RoundedRectangle(cornerRadius: Theme.Metric.tileCorner)
                    .fill(isBlocked ? Theme.tileBlocked : Theme.tileFace)
                    .frame(width: w, height: h - depth)
                    .overlay {
                        symbol
                            .padding(w * 0.18)
                            .opacity(isBlocked ? 0.45 : 1)
                    }
            }
        }
    }

    @ViewBuilder
    private var symbol: some View {
        switch kind {
        case .bamboo(let n):
            BambooGlyph(count: n)
        case .dot(let n):
            DotGlyph(count: n)
        case .character(let n):
            Text(Self.chineseNumerals[max(0, min(8, n - 1))])
                .font(.system(size: 200, weight: .bold))
                .minimumScaleFactor(0.01)
                .foregroundStyle(Theme.symbolNavy)
        case .dragon(let d):
            Text(d == .red ? "中" : (d == .green ? "發" : "口"))
                .font(.system(size: 200, weight: .bold))
                .minimumScaleFactor(0.01)
                .foregroundStyle(d == .red ? Theme.symbolRed : Theme.symbolGreen)
        case .wind(let w):
            Text(Self.windGlyphs[w.rawValue])
                .font(.system(size: 200, weight: .bold))
                .minimumScaleFactor(0.01)
                .foregroundStyle(Theme.symbolNavy)
        case .flower(let n), .season(let n):
            Text("❀\(n)")
                .font(.system(size: 200, weight: .bold))
                .minimumScaleFactor(0.01)
                .foregroundStyle(Theme.symbolGreen)
        }
    }

    private static let chineseNumerals = ["一", "二", "三", "四", "五", "六", "七", "八", "九"]
    private static let windGlyphs = ["東", "南", "西", "北"]
}

/// Bambu: dikey çubuklar.
private struct BambooGlyph: View {
    let count: Int

    var body: some View {
        let columns = count <= 3 ? count : 3
        let rows = Int(ceil(Double(count) / Double(columns)))
        VStack(spacing: 4) {
            ForEach(0..<rows, id: \.self) { row in
                HStack(spacing: 4) {
                    ForEach(0..<barsInRow(row, columns: columns), id: \.self) { _ in
                        Capsule().fill(Theme.symbolGreen)
                    }
                }
            }
        }
    }

    private func barsInRow(_ row: Int, columns: Int) -> Int {
        let remaining = count - row * columns
        return max(1, min(columns, remaining))
    }
}

/// Tong: iç içe halkalar.
private struct DotGlyph: View {
    let count: Int

    var body: some View {
        let columns = count <= 3 ? count : (count <= 4 ? 2 : 3)
        let rows = Int(ceil(Double(count) / Double(columns)))
        VStack(spacing: 4) {
            ForEach(0..<rows, id: \.self) { row in
                HStack(spacing: 4) {
                    ForEach(0..<dotsInRow(row, columns: columns), id: \.self) { index in
                        Circle()
                            .strokeBorder(
                                index.isMultiple(of: 2) ? Theme.symbolNavy : Theme.symbolTeal,
                                lineWidth: 4
                            )
                    }
                }
            }
        }
    }

    private func dotsInRow(_ row: Int, columns: Int) -> Int {
        let remaining = count - row * columns
        return max(1, min(columns, remaining))
    }
}
