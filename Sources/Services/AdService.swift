import Foundation
import SwiftUI
import OSLog
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
final class AdService: NSObject, ObservableObject {

    /// İstek / dolum / gösterim adımları loglanıyor ki yayın sonrası AdMob'daki
    /// gösterim oranı (şu an %21) uygulama tarafıyla karşılaştırılabilsin.
    /// Konsolda süzmek için: subsystem `com.mahjongaura.app`, kategori `ads`.
    private static let log = Logger(subsystem: "com.mahjongaura.app", category: "ads")

    @Published private(set) var isReady = false
    @Published private(set) var isRewardedReady = false

    private let player: PlayerStore
    private var interstitial: InterstitialAd?
    private var rewarded: RewardedAd?

    /// Sıklık kuralı: hem bölüm sayısı hem de süre koşulu sağlanmalı.
    /// Rahatlatıcı bir oyunda arka arkaya reklam terk ettirir.
    private static let interstitialEveryNLevels = 3
    private static let interstitialMinInterval: TimeInterval = 60

    private var levelsSinceInterstitial = 0
    private var lastInterstitialAt: Date?

    /// Tam ekran reklam sunumu bitene kadar tutulan devam noktası.
    private var presentContinuation: CheckedContinuation<Void, Never>?
    private var earnedReward = false

    init(player: PlayerStore) {
        self.player = player
        super.init()
    }

    // MARK: - Başlatma

    func start() async {
        guard !isReady else { return }

        // Onaydan bağımsız ve önce: onay formu kullanıcıda beklerken bile
        // test cihazı yapılandırması yerine oturmuş olsun.
        configureTestDevices()

        await requestConsent()

        // ATT istemi, onay akışından sonra ve bir gecikmeyle.
        try? await Task.sleep(nanoseconds: UInt64(AdConfig.attPromptDelay * 1_000_000_000))
        let status = await ATTrackingManager.requestTrackingAuthorization()
        Self.log.info("ATT durumu: \(status.rawValue, privacy: .public)")

        await MobileAds.shared.start()
        isReady = true
        logAdapterStatuses()

        // Geçiş reklamı önden yüklenir (bölüm sonunda anında lazım).
        // Ödüllü reklam YÜKLENMEZ — ancak gerektiğinde yüklenir.
        await loadInterstitial()
    }

    /// Kendi cihazlarımızı test cihazı olarak işaretler.
    ///
    /// Bu olmadan, gerçek reklam birimleriyle kendi telefonunda reklam izlemek
    /// geçersiz trafik sayılır ve AdMob hesabının askıya alınmasına yol açabilir.
    /// Simülatör SDK tarafından zaten otomatik test cihazı sayılır.
    private func configureTestDevices() {
        let ids = AdConfig.testDeviceIdentifiers
        if !ids.isEmpty {
            MobileAds.shared.requestConfiguration.testDeviceIdentifiers = ids
            Self.log.info("test cihazi sayisi: \(ids.count, privacy: .public)")
        } else {
            Self.log.warning("""
            ⚠️ Kayitli test cihazi YOK. Gercek reklam birimleriyle kendi \
            cihazinizda reklam izlemek gecersiz trafik sayilir. Konsolda \
            SDK'nin yazdigi "testDeviceIdentifiers" satirindaki kimligi \
            AdConfig.testDeviceIdentifiers icine ekleyin.
            """)
        }
    }

    /// Aracı (mediation) adaptörlerinin hazır olup olmadığını yazar.
    /// Unity gibi bir adaptör eklenirse "ready" görünmesi gerekir.
    private func logAdapterStatuses() {
        let statuses = MobileAds.shared.initializationStatus.adapterStatusesByClassName
        guard !statuses.isEmpty else {
            Self.log.info("adapter yok (yalnizca AdMob)")
            return
        }
        for (name, status) in statuses {
            let state = status.state == .ready ? "ready" : "notReady"
            Self.log.info("adapter \(name, privacy: .public): \(state, privacy: .public) — \(status.description, privacy: .public)")
        }
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
            ConsentInformation.shared.requestConsentInfoUpdate(with: parameters) { error in
                if let error { Self.log.error("onay guncellemesi hatasi: \(error.localizedDescription, privacy: .public)") }
                continuation.resume()
            }
        }

        guard let root = Self.rootViewController else { return }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            ConsentForm.loadAndPresentIfRequired(from: root) { error in
                if let error { Self.log.error("onay formu hatasi: \(error.localizedDescription, privacy: .public)") }
                continuation.resume()
            }
        }
        Self.log.info("onay tamam, reklam istenebilir: \(ConsentInformation.shared.canRequestAds, privacy: .public)")
    }

    // MARK: - Yükleme

    private func loadInterstitial() async {
        guard isReady, !player.hasRemoveAds, interstitial == nil else { return }
        Self.log.info("gecis: istek")
        do {
            interstitial = try await InterstitialAd.load(
                with: AdConfig.interstitialUnit, request: Request()
            )
            Self.log.info("gecis: dolum ✓")
        } catch {
            Self.log.error("gecis: dolum ✗ \(error.localizedDescription, privacy: .public)")
        }
    }

    /// Ödüllü reklamı **ihtiyaç anında** yükler (ör. kayıp ekranı açılırken).
    /// Açılışta yüklenmiyor: kullanıcıların çoğu hiç ödüllü reklam görmüyor,
    /// erken yükleme hem boşa istek hem de dolum oranını bozuyor.
    func prepareRewarded() async {
        guard isReady, !player.hasRemoveAds, rewarded == nil else { return }
        Self.log.info("odullu: istek")
        do {
            rewarded = try await RewardedAd.load(
                with: AdConfig.rewardedUnit, request: Request()
            )
            isRewardedReady = true
            Self.log.info("odullu: dolum ✓")
        } catch {
            isRewardedReady = false
            Self.log.error("odullu: dolum ✗ \(error.localizedDescription, privacy: .public)")
        }
    }

    // MARK: - Gösterim

    /// Bölüm geçişinde çağrılır. Hem bölüm sayısı hem süre koşulu sağlanmalı.
    func showInterstitialIfDue() {
        guard !player.hasRemoveAds, isReady else { return }
        levelsSinceInterstitial += 1

        guard levelsSinceInterstitial >= Self.interstitialEveryNLevels else { return }

        if let last = lastInterstitialAt,
           Date().timeIntervalSince(last) < Self.interstitialMinInterval {
            Self.log.info("gecis: atlandi (60 sn kurali)")
            return
        }

        guard let ad = interstitial, let root = Self.rootViewController else {
            Self.log.info("gecis: hazir degil")
            Task { await loadInterstitial() }
            return
        }

        levelsSinceInterstitial = 0
        lastInterstitialAt = Date()
        interstitial = nil

        Self.log.info("gecis: gosterim")
        ad.fullScreenContentDelegate = self
        ad.present(from: root)
    }

    /// Ödüllü reklam. Ödül kazanıldıysa `true` döner.
    /// `removeAds` sahibine reklam göstermeden doğrudan ödül verilir.
    @discardableResult
    func showRewarded() async -> Bool {
        if player.hasRemoveAds { return true }

        if rewarded == nil { await prepareRewarded() }

        guard let ad = rewarded, let root = Self.rootViewController else {
            Self.log.info("odullu: hazir degil")
            return false
        }

        rewarded = nil
        isRewardedReady = false

        Self.log.info("odullu: gosterim")
        earnedReward = false
        ad.fullScreenContentDelegate = self

        // Kapanmayı bekliyoruz, ödülü değil. `userDidEarnRewardHandler`
        // yalnızca ödül kazanılınca tetikleniyor; ona bağlanırsak reklam
        // kapatıldığında akış sonsuza kadar askıda kalıyor.
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            presentContinuation = continuation
            ad.present(from: root) { [weak self] in
                self?.earnedReward = true
            }
        }

        let earned = earnedReward
        Self.log.info("odullu: odul \(earned ? "kazanildi" : "kazanilmadi", privacy: .public)")
        await prepareRewarded()          // bir sonrakine hazırlan
        return earned
    }

    // MARK: - Tam ekran reklam yaşam döngüsü

    /// Sunum akışının tek çıkış noktası. Reklam kapanınca, sunulamayınca ya da
    /// hata alınca buradan devam edilir; her durumda tam bir kez.
    private static func logPresentFailure(_ error: Error) {
        log.error("tam ekran reklam sunulamadi: \(error.localizedDescription, privacy: .public)")
    }

    private func finishPresentation() {
        guard let continuation = presentContinuation else { return }
        presentContinuation = nil
        continuation.resume()
    }

    // MARK: - Hata ayıklama

    #if DEBUG
    /// AdMob Ad Inspector — dolum, aracı ve istek akışını canlı gösterir.
    func presentAdInspector() {
        guard let root = Self.rootViewController else { return }
        MobileAds.shared.presentAdInspector(from: root) { error in
            if let error { Self.log.error("Ad Inspector: \(error.localizedDescription, privacy: .public)") }
        }
    }
    #endif

    // MARK: - Yardımcı

    private static var rootViewController: UIViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
    }
}

// MARK: - FullScreenContentDelegate

extension AdService: FullScreenContentDelegate {

    nonisolated func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        Task { @MainActor in
            self.finishPresentation()
            // Reklam kapanır kapanmaz yenisini yükle.
            await self.loadInterstitial()
        }
    }

    nonisolated func ad(_ ad: FullScreenPresentingAd,
                        didFailToPresentFullScreenContentWithError error: Error) {
        Task { @MainActor in
            Self.logPresentFailure(error)
            self.finishPresentation()
        }
    }
}
