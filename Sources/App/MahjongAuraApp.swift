import SwiftUI

@main
struct MahjongAuraApp: App {
    @StateObject private var player: PlayerStore
    @StateObject private var store: StoreService
    @StateObject private var ads: AdService
    @StateObject private var gameCenter = GameCenterService()

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
                // Geliştirme kısayolları:
                //   -debugLevel 12    → doğrudan o bölümü açar
                //   -debugScreen levels|shop → o ekranı açar (pazarlama görseli almak için)
                if let level = Self.debugLevel {
                    GameView(level: level, player: player)
                } else if Self.debugScreen == "levels" {
                    LevelsMapView()
                } else if Self.debugScreen == "shop" {
                    ShopSheet()
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
            .environmentObject(gameCenter)
            .preferredColorScheme(.dark)
            .task {
                await store.loadProducts()
                // Onay → ATT → SDK sırası AdService içinde; satın alma
                // durumu bilindikten sonra başlatılıyor ki removeAds
                // sahibine hiç reklam yüklenmesin.
                #if DEBUG
                // -debugNoAds: pazarlama görseli alırken onay formu ekranı kapatmasın.
                if Self.argument(after: "-debugNoAds") == nil { await ads.start() }
                #else
                await ads.start()
                #endif
            }
            .onAppear { gameCenter.authenticate() }
        }
    }

    #if DEBUG
    private static var debugLevel: Int? {
        argument(after: "-debugLevel").flatMap(Int.init)
    }

    private static var debugScreen: String? {
        argument(after: "-debugScreen")
    }

    private static func argument(after flag: String) -> String? {
        let args = CommandLine.arguments
        guard let i = args.firstIndex(of: flag), i + 1 < args.count else { return nil }
        return args[i + 1]
    }
    #endif
}
