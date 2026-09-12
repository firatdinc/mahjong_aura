import Foundation
import SwiftUI
import OSLog
import GameKit

/// Game Center: kimlik doğrulama ve skor gönderimi.
///
/// Lider tablosu kimlikleri yayındaki 2.0.1 ile birebir aynı (`StoreCatalog.Leaderboard`).
/// Bu sayede mevcut oyuncuların skorları, kaynak kod kaybolmuş olmasına rağmen
/// yerinde kalır — skorlar Apple'ın sunucusunda tutuluyor.
///
/// **Eşleme kararı:** `bestiq` tablosunun adı "Best IQ". v2'de IQ diye bir
/// metrik yok; en yakın karşılık tek bölümde elde edilen en yüksek Aura puanı.
/// Vendor ID korunduğu için eski skorlar duruyor; tablonun görünen adı ASC'den
/// "Best Aura" olarak değiştirilebilir (kimlik değişmeden).
@MainActor
final class GameCenterService: ObservableObject {

    private static let log = Logger(subsystem: "com.mahjongaura.app", category: "gamecenter")

    @Published private(set) var isAuthenticated = false

    /// Game Center giriş ekranı sunulması gerekiyorsa buraya düşer.
    @Published var authenticationViewController: UIViewController?

    func authenticate() {
        guard !isAuthenticated else { return }

        GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
            guard let self else { return }
            Task { @MainActor in
                if let viewController {
                    // Oyuncu henüz giriş yapmamış; sistem ekranını sunmamız gerekiyor.
                    self.authenticationViewController = viewController
                    return
                }
                if let error {
                    Self.log.error("kimlik dogrulama hatasi: \(error.localizedDescription, privacy: .public)")
                    self.isAuthenticated = false
                    return
                }
                self.isAuthenticated = GKLocalPlayer.local.isAuthenticated
                Self.log.info("kimlik dogrulandi: \(self.isAuthenticated, privacy: .public)")
            }
        }
    }

    /// Bölüm tamamlandığında çağrılır. İki tabloya da yazar.
    func submit(highestLevel: Int, bestAura: Double) async {
        guard isAuthenticated else { return }

        await submit(score: highestLevel, to: .highestLevel)
        // Aura ondalıklı; tabloda tam sayı tutuluyor, 10 katı olarak yazılıp
        // ASC'de "ondalık: 1 basamak" biçimiyle gösterilebilir.
        await submit(score: Int((bestAura * 10).rounded()), to: .bestIQ)
    }

    private func submit(score: Int, to leaderboard: StoreCatalog.Leaderboard) async {
        do {
            try await GKLeaderboard.submitScore(
                score,
                context: 0,
                player: GKLocalPlayer.local,
                leaderboardIDs: [leaderboard.rawValue]
            )
            Self.log.info("skor gonderildi \(leaderboard.rawValue, privacy: .public): \(score, privacy: .public)")
        } catch {
            Self.log.error("skor gonderilemedi \(leaderboard.rawValue, privacy: .public): \(error.localizedDescription, privacy: .public)")
        }
    }
}

/// Game Center panosunu açar (lobideki roket butonu).
struct GameCenterDashboard: UIViewControllerRepresentable {
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> GKGameCenterViewController {
        let controller = GKGameCenterViewController(state: .leaderboards)
        controller.gameCenterDelegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: GKGameCenterViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onFinish: { dismiss() }) }

    final class Coordinator: NSObject, GKGameCenterControllerDelegate {
        private let onFinish: () -> Void
        init(onFinish: @escaping () -> Void) { self.onFinish = onFinish }

        func gameCenterViewControllerDidFinish(_ controller: GKGameCenterViewController) {
            onFinish()
        }
    }
}

/// Game Center giriş ekranını sunar (gerektiğinde).
struct GameCenterAuthPresenter: UIViewControllerRepresentable {
    let controller: UIViewController

    func makeUIViewController(context: Context) -> UIViewController { controller }
    func updateUIViewController(_ controller: UIViewController, context: Context) {}
}
