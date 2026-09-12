import SwiftUI

@main
struct MahjongAuraApp: App {
    @StateObject private var player = PlayerStore()

    var body: some Scene {
        WindowGroup {
            Group {
                #if DEBUG
                // Geliştirme kısayolu: -debugLevel 12 ile doğrudan o bölümü açar.
                if let level = Self.debugLevel {
                    GameView(level: level, player: player)
                } else {
                    LobbyView()
                }
                #else
                LobbyView()
                #endif
            }
            .environmentObject(player)
            .preferredColorScheme(.dark)
        }
    }

    #if DEBUG
    private static var debugLevel: Int? {
        let args = CommandLine.arguments
        guard let i = args.firstIndex(of: "-debugLevel"), i + 1 < args.count else { return nil }
        return Int(args[i + 1])
    }
    #endif
}
