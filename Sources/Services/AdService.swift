import Foundation
import SwiftUI
import GoogleMobileAds
import UserMessagingPlatform
import AppTrackingTransparency

/// Reklam katmanı: GDPR onayı → ATT izni → SDK başlatma → reklam yükleme.
///
/// Sıra önemli. UMP onayı alınmadan SDK başlatılırsa Avrupa'da kişiselleştirilmiş
/// reklam gösterilemez; ATT istemi açılıştan hemen sonra gösterilirse sistem
/// tarafından yutulur (bu yüzden `AdConfig.attPromptDelay` var).
///
/// `removeAds` satın alan kullanıcıya hiçbir reklam gösterilmez — mağazadaki
/// vaat bu: "No interstitials."
@MainActor
final class AdService: ObservableObject {

    @Published private(set) var isReady = false
    @Published private(set) var isRewardedReady = false

    private let player: PlayerStore
    private var interstitial: InterstitialAd?
    private var rewarded: RewardedAd?

    /// Geçiş reklamı sıklığı. v1.x'te her 2 oyunda birdi; rahatlatıcı bir
    /// oyunda bu agresif, 3 bölümde bire çekildi.
    private static let interstitialEveryNLevels = 3
    private var levelsSinceInterstitial = 0

    init(player: PlayerStore) {
        self.player = player
    }

    // MARK: - Başlatma

    func start() async {
        guard !isReady else { return }

        await requestConsent()

        // ATT istemi, onay akışından sonra ve bir gecikmeyle.
        try? await Task.sleep(nanoseconds: UInt64(AdConfig.attPromptDelay * 1_000_000_000))
        _ = await ATTrackingManager.requestTrackingAuthorization()

        await MobileAds.shared.start()
        isReady = true

        await preload()
    }

    /// UMP: gerekiyorsa onay formunu gösterir.
    private func requestConsent() async {
        let parameters = RequestParameters()
        #if DEBUG
        let debugSettings = DebugSettings()
        debugSettings.geography = .EEA
        parameters.debugSettings = debugSettings
        #endif

        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { _ in
                continuation.resume()
            }
        }

        guard let root = Self.rootViewController else { return }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            ConsentForm.loadAndPresentIfRequired(from: root) { _ in
                continuation.resume()
            }
        }
    }

    // MARK: - Yükleme

    func preload() async {
        guard isReady, !player.hasRemoveAds else { return }
        async let i: Void = loadInterstitial()
        async let r: Void = loadRewarded()
        _ = await (i, r)
    }

    private func loadInterstitial() async {
        guard interstitial == nil else { return }
        interstitial = try? await InterstitialAd.load(
            with: AdConfig.interstitialUnit, request: Request()
        )
    }

    private func loadRewarded() async {
        guard rewarded == nil else { return }
        rewarded = try? await RewardedAd.load(
            with: AdConfig.rewardedUnit, request: Request()
        )
        isRewardedReady = rewarded != nil
    }

    // MARK: - Gösterim

    /// Bölüm tamamlandığında çağrılır. Sıklık kuralına uymuyorsa hiçbir şey yapmaz.
    func showInterstitialIfDue() {
        guard !player.hasRemoveAds, isReady else { return }
        levelsSinceInterstitial += 1
        guard levelsSinceInterstitial >= Self.interstitialEveryNLevels,
              let ad = interstitial,
              let root = Self.rootViewController else { return }

        levelsSinceInterstitial = 0
        interstitial = nil
        ad.present(from: root)
        Task { await loadInterstitial() }
    }

    /// Ödüllü reklam. Ödül kazanıldıysa `true` döner.
    /// `removeAds` sahibine reklam göstermeden doğrudan ödül verilir.
    @discardableResult
    func showRewarded() async -> Bool {
        if player.hasRemoveAds { return true }

        guard let ad = rewarded, let root = Self.rootViewController else {
            return false
        }

        rewarded = nil
        isRewardedReady = false

        var earned = false
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            ad.present(from: root) {
                earned = true
                continuation.resume()
            }
        }

        await loadRewarded()
        return earned
    }

    // MARK: - Yardımcı

    private static var rootViewController: UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
    }
}
