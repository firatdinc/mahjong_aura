import SwiftUI

/// Oyun ekranı — şartname § 2.4
struct GameView: View {
    @StateObject private var model: GameViewModel
    @EnvironmentObject private var player: PlayerStore
    @EnvironmentObject private var store: StoreService
    @EnvironmentObject private var ads: AdService
    @Environment(\.dismiss) private var dismiss

    @State private var showMenu = false
    @State private var showShop = false

    init(level: Int, player: PlayerStore) {
        _model = StateObject(wrappedValue: GameViewModel(level: level, player: player))
    }

    var body: some View {
        ZStack {
            Rectangle().fill(Theme.feltBackground).ignoresSafeArea()

            VStack(spacing: 12) {
                topBar
                TrayView(tiles: model.board.tray, capacity: model.board.trayCapacity)
                    .padding(.horizontal, 20)
                boardArea
                BoosterBar(model: model, player: player)
                    .padding(.bottom, 8)
            }

            if let toast = model.toast { ToastView(toast: toast) }
            if model.combo >= 1 { comboBurst }

            switch model.phase {
            case .won(let outcome):
                ResultView(outcome: outcome, model: model) { dismiss() }
            case .lost:
                LoseView(model: model, onShop: { showShop = true }, onQuit: { dismiss() })
            case .playing:
                EmptyView()
            }
        }
        .sheet(isPresented: $showMenu) {
            MenuSheet(onShop: { showMenu = false; showShop = true },
                      onRestart: { showMenu = false },
                      onQuit: { showMenu = false; dismiss() })
                .environmentObject(player)
                .environmentObject(store)
        }
        .sheet(isPresented: $showShop) {
            ShopSheet().environmentObject(player).environmentObject(store)
        }
    }

    private var topBar: some View {
        ZStack {
            VStack(spacing: 2) {
                if let gain = model.lastGain {
                    Text(String(format: "+%.1f", gain))
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(Theme.actionGreen)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .id(model.aura)
                }
                Text(String(format: NSLocalizedString("game.aura", comment: ""),
                            String(format: "%.1f", model.aura)))
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundStyle(Theme.amber)
            }
            .animation(.easeOut(duration: 0.25), value: model.aura)

            HStack {
                CircleButton(system: "arrow.left") { dismiss() }
                Spacer()
                CircleButton(system: "line.3.horizontal") { showMenu = true }
            }
            .padding(.horizontal, 20)
        }
    }

    private var boardArea: some View {
        GeometryReader { geo in
            let tiles = model.board.tiles
            let bounds = Self.bounds(of: tiles)
            let unit = Self.unitSize(for: bounds, in: geo.size)
            // Tahtayı alana ortala.
            let boardW = CGFloat(bounds.cols) * unit
            let boardH = CGFloat(bounds.rows) * unit
            let dx = (geo.size.width - boardW) / 2
            let dy = (geo.size.height - boardH) / 2

            ZStack {
                ForEach(tiles.sorted { $0.position.layer < $1.position.layer }) { tile in
                    let free = model.board.isFree(tile)
                    TileFace(kind: tile.kind, isBlocked: !free)
                        .frame(width: unit * 2, height: unit * 2.6)
                        .overlay {
                            if model.hintedTiles.contains(tile.id) {
                                RoundedRectangle(cornerRadius: Theme.Metric.tileCorner)
                                    .strokeBorder(Theme.amberBright, lineWidth: 3)
                            }
                        }
                        .position(
                            x: dx + CGFloat(tile.position.col - bounds.minCol) * unit + unit,
                            y: dy + CGFloat(tile.position.row - bounds.minRow) * unit + unit * 1.3
                                - CGFloat(tile.position.layer) * 5
                        )
                        .shadow(color: .black.opacity(0.3), radius: 3, y: 2)
                        .onTapGesture { model.tap(tile) }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var comboBurst: some View {
        VStack(spacing: 4) {
            Text(NSLocalizedString("game.praise.good", comment: ""))
                .font(.system(size: 38, weight: .heavy, design: .rounded))
                .foregroundStyle(Theme.actionGreen)
            Text(String(format: NSLocalizedString("game.combo", comment: ""), model.combo + 1))
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(Theme.actionGreen.opacity(0.9))
        }
        .shadow(color: .black.opacity(0.5), radius: 4)
        .transition(.scale.combined(with: .opacity))
        .allowsHitTesting(false)
    }

    // MARK: - Yerleşim hesabı

    struct Bounds { let minRow: Int; let minCol: Int; let rows: Int; let cols: Int }

    static func bounds(of tiles: [Tile]) -> Bounds {
        guard !tiles.isEmpty else { return Bounds(minRow: 0, minCol: 0, rows: 1, cols: 1) }
        let rows = tiles.map(\.position.row)
        let cols = tiles.map(\.position.col)
        let minRow = rows.min() ?? 0
        let minCol = cols.min() ?? 0
        return Bounds(minRow: minRow, minCol: minCol,
                      rows: (rows.max() ?? 0) - minRow + 2,
                      cols: (cols.max() ?? 0) - minCol + 2)
    }

    static func unitSize(for bounds: Bounds, in size: CGSize) -> CGFloat {
        let byWidth = size.width / CGFloat(bounds.cols + 1)
        let byHeight = size.height / (CGFloat(bounds.rows) * 1.3 + 1)
        return max(6, min(byWidth, byHeight))
    }
}

// MARK: - Tepsi

struct TrayView: View {
    let tiles: [Tile]
    let capacity: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<capacity, id: \.self) { slot in
                ZStack {
                    RoundedRectangle(cornerRadius: 8).fill(.black.opacity(0.25))
                    if slot < tiles.count {
                        TileFace(kind: tiles[slot].kind)
                            .padding(3)
                            .transition(.scale)
                    }
                }
                .aspectRatio(0.78, contentMode: .fit)
            }
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: Theme.Metric.trayCorner)
                .fill(Theme.trayFill)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Metric.trayCorner)
                        .strokeBorder(Theme.trayStroke, lineWidth: Theme.Metric.trayStrokeWidth)
                        .shadow(color: Theme.trayStroke.opacity(0.7), radius: 6)
                )
        )
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: tiles.count)
    }
}

// MARK: - Booster çubuğu

struct BoosterBar: View {
    @ObservedObject var model: GameViewModel
    @ObservedObject var player: PlayerStore

    var body: some View {
        HStack(spacing: 44) {
            boosterButton(.shuffle, system: "shuffle",
                          count: nil,
                          locked: !model.isShuffleUnlocked) { model.useShuffle() }
            boosterButton(.hint, system: "lightbulb.fill",
                          count: player.balance(of: .hint),
                          locked: false) { _ = model.useHint() }
            boosterButton(.undo, system: "arrow.uturn.backward",
                          count: player.balance(of: .undo),
                          locked: false) { _ = model.useUndo() }
        }
    }

    @ViewBuilder
    private func boosterButton(_ booster: Booster, system: String, count: Int?,
                               locked: Bool, action: @escaping () -> Void) -> some View {
        VStack(spacing: 4) {
            Button(action: action) {
                ZStack {
                    Circle()
                        .fill(Theme.boosterFill)
                        .overlay(Circle().strokeBorder(Theme.boosterStroke, lineWidth: 2))
                    Image(systemName: system)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(locked ? .white.opacity(0.3) : Theme.amberBright)
                }
                .frame(width: Theme.Metric.boosterDiameter, height: Theme.Metric.boosterDiameter)
                .overlay(alignment: .topTrailing) { badge(count: count, locked: locked) }
            }
            .buttonStyle(.plain)
            .disabled(locked)

            if locked {
                Text(String(format: NSLocalizedString("booster.lockedUntil", comment: ""),
                            booster.unlocksAtLevel))
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }

    @ViewBuilder
    private func badge(count: Int?, locked: Bool) -> some View {
        if locked {
            Image(systemName: "lock.fill")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.amberBright)
                .padding(4)
                .background(Circle().fill(Theme.boosterFill))
        } else if player.hasRemoveAds {
            Image(systemName: "infinity")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .padding(4)
                .background(Circle().fill(Theme.badgeRed))
        } else if let count {
            Text("\(count)")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 5).padding(.vertical, 2)
                .background(Capsule().fill(Theme.badgeRed))
        }
    }
}

// MARK: - Yardımcılar

struct CircleButton: View {
    let system: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(Theme.boosterFill)
                    .overlay(Circle().strokeBorder(Theme.boosterStroke, lineWidth: 2))
                Image(systemName: system)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(Theme.amberBright)
            }
            .frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
    }
}

struct ToastView: View {
    let toast: GameViewModel.Toast

    var body: some View {
        VStack {
            Spacer()
            Text(NSLocalizedString(key, comment: ""))
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(Capsule().fill(background))
            Spacer().frame(height: 160)
        }
        .allowsHitTesting(false)
        .transition(.opacity)
    }

    private var key: String {
        switch toast {
        case .blocked: return "game.blocked"
        case .trayAlmostFull: return "game.trayAlmostFull"
        }
    }

    private var background: Color {
        switch toast {
        case .blocked: return Theme.symbolRed.opacity(0.92)
        case .trayAlmostFull: return .black.opacity(0.75)
        }
    }
}
