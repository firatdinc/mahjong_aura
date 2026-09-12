import Foundation

/// AdMob yapılandırması.
///
/// Uygulama kimliği yayındaki 2.0.1 paketinden, reklam birimi kimlikleri ise
/// v1.x kaynağının git geçmişinden kurtarıldı (`origin/master`'daki
/// `src/constants/adConfig.ts`). Aynı AdMob uygulaması altındalar, dolayısıyla
/// geçerliler.
///
/// ⚠️ Doğrulanmalı: 2.0.1 bu birimleri mi kullanıyordu, yoksa yeni birimler mi
/// oluşturulmuştu? AdMob konsolundan bakılmalı. Yanlış birim gelir kaybettirmez
/// ama raporlamayı böler.
///
/// Not: 2.0.1 ekran görüntülerinde **banner görünmüyor** — v2'de banner
/// kaldırılmış olabilir. Geçiş (interstitial) ve ödüllü reklam kullanımda.
enum AdConfig {

    static let applicationID = "ca-app-pub-8571533711927103~6034352154"

    enum Unit {
        static let banner       = "ca-app-pub-8571533711927103/1948468189"
        static let interstitial = "ca-app-pub-8571533711927103/3561199651"
        static let rewarded     = "ca-app-pub-8571533711927103/5651208772"
    }

    /// Google'ın resmi test birimleri — geliştirmede daima bunlar kullanılır.
    enum TestUnit {
        static let banner       = "ca-app-pub-3940256099942544/2435281174"
        static let interstitial = "ca-app-pub-3940256099942544/4411468910"
        static let rewarded     = "ca-app-pub-3940256099942544/1712485313"
    }

    /// Debug'da test birimleri, Release'te gerçek birimler.
    static var bannerUnit: String {
        #if DEBUG
        TestUnit.banner
        #else
        Unit.banner
        #endif
    }

    static var interstitialUnit: String {
        #if DEBUG
        TestUnit.interstitial
        #else
        Unit.interstitial
        #endif
    }

    static var rewardedUnit: String {
        #if DEBUG
        TestUnit.rewarded
        #else
        Unit.rewarded
        #endif
    }

    /// ATT izin istemi açılıştan hemen sonra gösterilirse yutuluyor;
    /// bu gecikme diğer oyunlarda çalıştığı doğrulanmış değer.
    static let attPromptDelay: TimeInterval = 1.2
}
