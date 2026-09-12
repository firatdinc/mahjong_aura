import SwiftUI

@main
struct MahjongAuraApp: App {
    @StateObject private var player = PlayerStore()

    var body: some Scene {
        WindowGroup {
            LobbyView()
                .environmentObject(player)
                .preferredColorScheme(.dark)
        }
    }
}
