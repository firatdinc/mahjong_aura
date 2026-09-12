import SwiftUI

@main
struct MahjongAuraApp: App {
    @StateObject private var player: PlayerStore
    @StateObject private var store: StoreService
    @StateObject private var ads: AdService

    init() {
        let player = PlayerStore()
        _player = StateObject(wrappedValue: player)
        _store = StateObject(wrappedValue: StoreService(player: player))
        _ads = StateObject(wrappedValue: AdService(player: player))
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
            .environmentObject(ads)
            .preferredColorScheme(.dark)
            .task {
                await store.loadProducts()
                // Onay → ATT → SDK sırası AdService içinde; satın alma
                // durumu bilindikten sonra başlatılıyor ki removeAds
                // sahibine hiç reklam yüklenmesin.
                await ads.start()
            }
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
