import Foundation
import AdSupport

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

    // MARK: - Test cihazları

    /// ⚠️ BAN RİSKİ — buraya kendi cihazlarınızın kimliğini ekleyin.
    ///
    /// Test birimi kimliği ile test **cihazı** farklı şeylerdir:
    ///   • Test birimi (`TestUnit`) → sahte reklam, gelir yok, risk yok.
    ///     Yalnızca Debug'da kullanılır.
    ///   • Gerçek birim + tanıtılmamış cihaz → GERÇEK reklam gelir.
    ///     Kendi uygulamanızda izleyip tıklamanız geçersiz trafik sayılır
    ///     ve hesabın askıya alınmasına yol açabilir.
    ///   • Gerçek birim + tanıtılmış cihaz → test reklamı gösterilir, güvenli.
    ///
    /// TestFlight veya Release derlemesini kendi telefonunuzda denemeden ÖNCE
    /// buraya kimliğini ekleyin. Kimliği öğrenmek için uygulamayı bir kez
    /// çalıştırın; SDK konsola şu satırı yazar:
    ///   "To get test ads on this device, set ... testDeviceIdentifiers = @[ "..." ]"
    /// `AdService` bu satırı `ads` kategorisinde ayrıca vurgular.
    ///
    /// Not: Bu liste Release'te de geçerlidir — kasıtlı. Kendi cihazınız
    /// yayına çıktıktan sonra da test reklamı görmeli.
    /// AdMob konsolundaki "Test cihazları" listesiyle aynı olmalı.
    /// Konsol kaydı yalnızca AdMob Ağı'nı kapsar; uyumlulaştırma üzerinden
    /// gelen reklamlara uygulanmaz. Buradaki liste istek düzeyinde çalışır,
    /// bu yüzden ikisi birlikte tutulur.
    static let testDeviceIdentifiers: [String] = [
        "26078A84-52D0-40B5-86C7-BB2E0BE1585F",  // ergn
        "2362EB31-0BFE-4FC3-AF96-EFD7FCD7C93A",  // Fırat
    ]

    /// Cihazın güncel reklam kimliği. ATT reddedilmişse sıfırlardan oluşur —
    /// o durumda AdMob konsolundaki test cihazı kaydı eşleşmez.
    static var currentAdvertisingIdentifier: String {
        ASIdentifierManager.shared().advertisingIdentifier.uuidString
    }
}
