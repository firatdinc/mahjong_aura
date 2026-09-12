import SwiftUI

/// Lobi — 2.0.1 şartnamesi § 2.2
/// Ahşap zemin · logo · madalyon içinde taş · "Level N" hap butonu
struct LobbyView: View {
    @EnvironmentObject private var player: PlayerStore
    @State private var showLevels = false

    var body: some View {
        ZStack {
            Rectangle()
                .fill(Theme.woodBackground)
                .overlay(PlankTexture())
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 40)
                logo
                Spacer()
                medallion
                Spacer()
                continueButton
                Spacer(minLength: 48)
            }
            .padding(.horizontal, 32)
        }
        .fullScreenCover(isPresented: $showLevels) {
            LevelsMapView().environmentObject(player)
        }
    }

    private var logo: some View {
        VStack(spacing: -4) {
            Text("Mahjong")
                .font(.system(size: 34, weight: .semibold, design: .rounded))
                .foregroundStyle(Theme.actionGreen)
            Text("AURA")
                .font(.system(size: 48, weight: .heavy, design: .rounded))
                .foregroundStyle(Theme.amberBright)
        }
    }

    private var medallion: some View {
        ZStack {
            Circle()
                .fill(Theme.woodDark)
                .overlay(Circle().strokeBorder(.black.opacity(0.25), lineWidth: 6))
                .shadow(color: .black.opacity(0.45), radius: 12, y: 6)
                .frame(width: 220, height: 220)

            TileFace(kind: .dragon(.red))
                .frame(width: 86, height: 112)
        }
    }

    private var continueButton: some View {
        Button {
            showLevels = true
        } label: {
            Text(String(format: NSLocalizedString("lobby.continue", comment: "Continue at level N"),
                        player.currentLevel))
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: Theme.Metric.actionButtonHeight)
                .background(
                    Capsule().fill(Theme.actionGreen)
                        .shadow(color: Theme.actionGreenDeep, radius: 0, y: 4)
                )
        }
        .buttonStyle(.plain)
    }
}

/// Dikey ahşap tahta çizgileri.
private struct PlankTexture: View {
    var body: some View {
        GeometryReader { geo in
            let plankWidth: CGFloat = 46
            let count = Int(geo.size.width / plankWidth) + 1
            HStack(spacing: 0) {
                ForEach(0..<count, id: \.self) { _ in
                    Rectangle()
                        .fill(.black.opacity(0.06))
                        .frame(width: plankWidth)
                        .overlay(alignment: .trailing) {
                            Rectangle().fill(.black.opacity(0.18)).frame(width: 1)
                        }
                }
            }
        }
        .allowsHitTesting(false)
    }
}
