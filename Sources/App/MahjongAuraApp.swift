import SwiftUI

@main
struct MahjongAuraApp: App {
    @StateObject private var player: PlayerStore
    @StateObject private var store: StoreService

    init() {
        let player = PlayerStore()
        _player = StateObject(wrappedValue: player)
        _store = StateObject(wrappedValue: StoreService(player: player))
    }

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
            .environmentObject(store)
            .preferredColorScheme(.dark)
            .task { await store.loadProducts() }
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
