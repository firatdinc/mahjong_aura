import SwiftUI
import StoreKit

/// Bölüm tamamlandı — şartname § 2.5
struct ResultView: View {
    let outcome: GameViewModel.Outcome
    @ObservedObject var model: GameViewModel
    let onContinue: () -> Void

    @EnvironmentObject private var player: PlayerStore
    @EnvironmentObject private var ads: AdService
    @EnvironmentObject private var gameCenter: GameCenterService
    @Environment(\.requestReview) private var requestReview

    var body: some View {
        ZStack {
            Color.black.opacity(0.82).ignoresSafeArea()

            VStack(spacing: 22) {
                Spacer()

                Image(systemName: "camera.macro")
                    .font(.system(size: 64))
                    .foregroundStyle(
                        LinearGradient(colors: [.pink.opacity(0.9), Theme.actionGreen],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    .shadow(color: Theme.amber.opacity(0.55), radius: 40)

                Text(NSLocalizedString(outcome.praiseKey, comment: ""))
                    .font(.system(size: 44, weight: .heavy, design: .rounded))
                    .foregroundStyle(Theme.amber)

                HStack(spacing: 12) {
                    statCard("result.stat.time", system: "clock.fill", value: timeText)
                    statCard("result.stat.aura", system: "medal.fill",
                             value: String(format: "%.1f", outcome.aura))
                    statCard("result.stat.combo", system: "wind",
                             value: "\(outcome.bestCombo)")
                }

                Text(NSLocalizedString("result.message", comment: ""))
                    .font(.system(size: 16, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
                    .multilineTextAlignment(.center)

                giftTrack

                Button {
                    // Geçiş reklamı bölüm geçişinde — kutlama ekranının
                    // üstünde değil. Sıklık kuralı AdService'te.
                    ads.showInterstitialIfDue()
                    onContinue()
                } label: {
                    Text(String(format: NSLocalizedString("result.next", comment: ""),
                                model.levelNumber + 1))
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: Theme.Metric.actionButtonHeight)
                        .background(Capsule().fill(Theme.actionGreen))
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 36)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .task { await submitScores() }
        .task { await promptForReviewIfEarned() }
    }

    /// Kutlama ekranı oturduktan sonra sor — kazanma anının üstüne binmesin.
    private func promptForReviewIfEarned() async {
        guard player.shouldRequestReview(afterLevel: model.levelNumber) else { return }
        try? await Task.sleep(nanoseconds: 1_200_000_000)
        requestReview()
        player.markReviewRequested(atLevel: model.levelNumber)
    }

    /// İki lider tablosuna da yazar. Kimlik doğrulanmadıysa sessizce geçer.
    private func submitScores() async {
        await gameCenter.submit(highestLevel: player.highestLevel,
                                bestAura: player.bestAura)
    }

    private var timeText: String {
        let total = Int(outcome.elapsed)
        return String(format: "%02d:%02d", total / 60, total % 60)
    }

    private func statCard(_ key: String, system: String, value: String) -> some View {
        VStack(spacing: 6) {
            Text(NSLocalizedString(key, comment: ""))
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(Theme.amber)
            HStack(spacing: 4) {
                Image(systemName: system).font(.system(size: 12)).foregroundStyle(Theme.amber)
                Text(value)
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.white.opacity(0.06))
                .overlay(RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(.white.opacity(0.12), lineWidth: 1))
        )
    }

    /// 10 segmentli hediye şeridi — her 10 bölümde bir hediye.
    private var giftTrack: some View {
        VStack(spacing: 6) {
            HStack(spacing: 5) {
                ForEach(0..<GameViewModel.giftInterval, id: \.self) { i in
                    Capsule()
                        .fill(i < filledSegments ? Theme.amber : .white.opacity(0.15))
                        .frame(height: 10)
                }
                Image(systemName: "gift.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.symbolRed)
            }
            Text(String(format: NSLocalizedString("result.nextGift", comment: ""),
                        model.levelsUntilGift))
                .font(.system(size: 12, design: .rounded))
                .foregroundStyle(.white.opacity(0.6))
        }
    }

    private var filledSegments: Int {
        let within = model.levelNumber % GameViewModel.giftInterval
        return within == 0 ? GameViewModel.giftInterval : within
    }
}

/// Kaybetme ekranı. Ekran kaydında görünmedi — uygulamanın kendi ekonomisinden
/// türetildi: tepsi dolduğunda "10 Revives — Full tray? No problem" ürünü
/// devreye giriyor. Ödüllü reklam bedava alternatif olarak sunuluyor.
struct LoseView: View {
    @ObservedObject var model: GameViewModel
    @EnvironmentObject private var player: PlayerStore
    @EnvironmentObject private var ads: AdService
    let onShop: () -> Void
    let onQuit: () -> Void

    @State private var showAdUnavailable = false
    @State private var watchingAd = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.85).ignoresSafeArea()

            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "tray.full.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(Theme.symbolRed)
                    .shadow(color: Theme.symbolRed.opacity(0.5), radius: 30)

                Text(NSLocalizedString("lose.title", comment: ""))
                    .font(.system(size: 34, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)

                Text(NSLocalizedString("lose.message", comment: ""))
                    .font(.system(size: 15, design: .rounded))
                    .foregroundStyle(.white.opacity(0.8))
                    .multilineTextAlignment(.center)

                VStack(spacing: 12) {
                    if player.hasRemoveAds || player.balance(of: .revive) > 0 {
                        primaryButton("lose.useRevive", fill: Theme.actionGreen) {
                            _ = model.revive()
                        }
                    }
                    primaryButton("lose.watchAd", fill: Theme.amber) {
                        guard !watchingAd else { return }
                        watchingAd = true
                        Task {
                            // Ödül gerçekten kazanıldıysa devam hakkı verilir.
                            // removeAds sahibine reklam gösterilmeden verilir.
                            if await ads.showRewarded() {
                                model.reviveByAd()
                            } else {
                                showAdUnavailable = true
                            }
                            watchingAd = false
                        }
                    }
                    .disabled(watchingAd)
                    Button(action: onShop) {
                        Text(NSLocalizedString("menu.shop", comment: ""))
                            .font(.system(size: 16, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.85))
                    }
                    Button(action: onQuit) {
                        Text(NSLocalizedString("menu.quit", comment: ""))
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundStyle(Theme.symbolRed)
                    }
                }
                .padding(.horizontal, 36)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        // Ödüllü reklam tam da butonun göründüğü anda yüklenir —
        // açılışta değil. Boşa istek gitmez, dolum oranı bozulmaz.
        .task { await ads.prepareRewarded() }
        .alert(NSLocalizedString("ads.notReady", comment: ""),
               isPresented: $showAdUnavailable) {
            Button("OK", role: .cancel) {}
        }
    }

    private func primaryButton(_ key: String, fill: Color,
                               action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(NSLocalizedString(key, comment: ""))
                .font(.system(size: 19, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: Theme.Metric.actionButtonHeight)
                .background(Capsule().fill(fill))
        }
        .buttonStyle(.plain)
    }
}
