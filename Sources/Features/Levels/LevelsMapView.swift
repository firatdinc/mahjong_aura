import SwiftUI

/// Bölüm haritası — şartname § 2.3
/// Yılankavi dikey yol; tamamlanan yeşil + yıldız, mevcut turuncu ve haleli,
/// kilitli koyu + asma kilit. Üstte "LEVELS" ve "tamamlanan / 2.000".
struct LevelsMapView: View {
    @EnvironmentObject private var player: PlayerStore
    @EnvironmentObject private var store: StoreService
    @EnvironmentObject private var ads: AdService
    @EnvironmentObject private var gameCenter: GameCenterService
    @Environment(\.dismiss) private var dismiss

    @State private var showShop = false
    @State private var playingLevel: Int?

    /// Haritada bir seferde gösterilen pencere — 2000 düğümü birden çizmiyoruz.
    private var window: [Int] {
        let top = min(LevelGenerator.totalLevels, player.currentLevel + 12)
        let bottom = max(1, top - 24)
        return Array(bottom...top).reversed()
    }

    var body: some View {
        ZStack {
            Rectangle().fill(Theme.feltBackground).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 26) {
                    ForEach(window, id: \.self) { level in
                        node(level)
                            .frame(maxWidth: .infinity, alignment: offset(for: level))
                            .padding(.horizontal, 60)
                    }
                }
                .padding(.vertical, 90)
            }

            header
        }
        .fullScreenCover(item: Binding(
            get: { playingLevel.map(LevelBox.init) },
            set: { playingLevel = $0?.value }
        )) { box in
            GameView(level: box.value, player: player)
                .environmentObject(player)
                .environmentObject(store)
                .environmentObject(ads)
                .environmentObject(gameCenter)
        }
        .sheet(isPresented: $showShop) {
            ShopSheet().environmentObject(player).environmentObject(store)
        }
    }

    private struct LevelBox: Identifiable { let value: Int; var id: Int { value } }

    private var header: some View {
        VStack {
            ZStack {
                VStack(spacing: 2) {
                    Text(NSLocalizedString("levels.title", comment: ""))
                        .font(.system(size: 20, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                        .tracking(2)
                    Text(String(format: NSLocalizedString("levels.progress", comment: ""),
                                player.highestLevel - 1, LevelGenerator.totalLevels))
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(Theme.amber)
                }
                HStack {
                    CircleButton(system: "arrow.left") { dismiss() }
                    Spacer()
                    CircleButton(system: "cart.fill") { showShop = true }
                }
                .padding(.horizontal, 20)
            }
            .padding(.top, 8)
            Spacer()
        }
    }

    /// Yılankavi yerleşim: bölüm numarasına göre sola/ortaya/sağa kayar.
    private func offset(for level: Int) -> Alignment {
        switch level % 4 {
        case 0: return .center
        case 1: return .trailing
        case 2: return .center
        default: return .leading
        }
    }

    private enum NodeState { case completed, current, locked }

    private func state(of level: Int) -> NodeState {
        if level < player.currentLevel { return .completed }
        if level == player.currentLevel { return .current }
        return .locked
    }

    @ViewBuilder
    private func node(_ level: Int) -> some View {
        let nodeState = state(of: level)
        Button {
            guard nodeState != .locked else { return }
            playingLevel = level
        } label: {
            ZStack {
                if nodeState == .current {
                    Circle().fill(Theme.amber.opacity(0.25)).frame(width: 92, height: 92)
                }
                Circle()
                    .fill(fill(for: nodeState))
                    .overlay(Circle().strokeBorder(.black.opacity(0.2), lineWidth: 3))
                    .frame(width: nodeState == .current ? 66 : 54,
                           height: nodeState == .current ? 66 : 54)

                switch nodeState {
                case .locked:
                    Image(systemName: "lock.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white.opacity(0.35))
                case .completed:
                    VStack(spacing: -2) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.amber)
                        Text("\(level)")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                case .current:
                    Text("\(level)")
                        .font(.system(size: 22, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                }
            }
        }
        .buttonStyle(.plain)
        .disabled(nodeState == .locked)
    }

    private func fill(for state: NodeState) -> Color {
        switch state {
        case .completed: return Theme.actionGreen
        case .current:   return Theme.amber
        case .locked:    return Color.white.opacity(0.08)
        }
    }
}
