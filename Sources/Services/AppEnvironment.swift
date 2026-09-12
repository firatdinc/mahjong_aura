import Foundation

/// Derlemenin nereden geldiğini ayırt eder.
///
/// Hata ayıklama arayüzü (tanılama paneli, Ad Inspector, "reklamları zorla"
/// anahtarı) TestFlight'ta işimize yarıyor ama App Store sürümünde
/// bulunmamalı: reklamsız satın almış bir oyuncu o anahtarı bulup açarsa
/// parasını ödediği halde reklam görmeye başlar.
///
/// Ayrım makbuz dosyasının adından yapılıyor: TestFlight ve sandbox
/// kurulumlarında `sandboxReceipt`, App Store kurulumunda `receipt`.
enum AppEnvironment {

    /// Debug veya TestFlight mı? App Store sürümünde daima `false`.
    static let isInternalBuild: Bool = {
        #if DEBUG
        return true
        #else
        guard let url = Bundle.main.appStoreReceiptURL else { return false }
        return url.lastPathComponent == "sandboxReceipt"
        #endif
    }()
}
