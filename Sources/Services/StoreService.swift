import Foundation
import StoreKit

/// StoreKit 2 satın alma katmanı.
///
/// Ürün kimlikleri `StoreCatalog`'dan gelir ve yayındaki 2.0.1 ile birebir
/// aynıdır — bu yüzden `removeAds` satın almış mevcut kullanıcılar, kaynak
/// kod kaybolmuş olmasına rağmen haklarını geri alır: non-consumable haklar
/// Apple'ın sunucusunda tutuluyor, cihazdaki kayıtlarda değil.
@MainActor
final class StoreService: ObservableObject {

    enum Phase: Equatable {
        case idle
        case loading
        case ready
        case failed(String)
    }

    @Published private(set) var phase: Phase = .idle
    @Published private(set) var products: [StoreCatalog.Product: Product] = [:]
    @Published private(set) var pending: StoreCatalog.Product?
    @Published var alertMessage: String?

    private let player: PlayerStore
    private var updatesTask: Task<Void, Never>?

    init(player: PlayerStore) {
        self.player = player
        listenForTransactions()
    }

    deinit { updatesTask?.cancel() }

    // MARK: - Yükleme

    func loadProducts() async {
        guard phase != .loading else { return }
        phase = .loading
        do {
            let ids = StoreCatalog.Product.allCases.map(\.rawValue)
            let fetched = try await Product.products(for: ids)

            var map: [StoreCatalog.Product: Product] = [:]
            for product in fetched {
                if let known = StoreCatalog.Product(rawValue: product.id) {
                    map[known] = product
                }
            }
            products = map
            phase = .ready

            await refreshEntitlements()
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    /// Mağazadan gelen yerelleştirilmiş fiyat. Ürün yüklenmediyse nil.
    func displayPrice(for product: StoreCatalog.Product) -> String? {
        products[product]?.displayPrice
    }

    // MARK: - Satın alma

    func purchase(_ item: StoreCatalog.Product) async {
        guard let product = products[item] else {
            alertMessage = NSLocalizedString("store.unavailable", comment: "")
            return
        }
        guard pending == nil else { return }

        pending = item
        defer { pending = nil }

        do {
            switch try await product.purchase() {
            case .success(let verification):
                await redeem(verification)
            case .userCancelled:
                break
            case .pending:
                alertMessage = NSLocalizedString("store.pending", comment: "")
            @unknown default:
                break
            }
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    /// "Restore Purchases" — kalıcı hakları Apple'dan yeniden çeker.
    func restore() async {
        do {
            try await AppStore.sync()
            await refreshEntitlements()
            alertMessage = player.hasRemoveAds
                ? NSLocalizedString("store.restored", comment: "")
                : NSLocalizedString("store.nothingToRestore", comment: "")
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    // MARK: - Haklar

    /// Kalıcı hakları tarar. Tüketilebilirler burada görünmez — onlar satın
    /// alındığı anda bakiyeye yazılıp `finish()` ile kapatılır.
    func refreshEntitlements() async {
        var ownsRemoveAds = false
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            if transaction.productID == StoreCatalog.Product.removeAds.rawValue,
               transaction.revocationDate == nil {
                ownsRemoveAds = true
            }
        }
        player.setRemoveAds(ownsRemoveAds)
    }

    // MARK: - İşlem akışı

    /// Uygulama dışında tamamlanan işlemler (Ask to Buy, iade, başka cihaz)
    /// buradan gelir. Dinleyici uygulama ömrü boyunca açık kalmalı.
    private func listenForTransactions() {
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                await self?.redeem(update)
            }
        }
    }

    private func redeem(_ result: VerificationResult<Transaction>) async {
        guard case .verified(let transaction) = result else {
            // Doğrulanamayan işlem kapatılmaz; Apple yeniden gönderir.
            alertMessage = NSLocalizedString("store.unverified", comment: "")
            return
        }

        if let item = StoreCatalog.Product(rawValue: transaction.productID) {
            if item.isConsumable {
                if transaction.revocationDate == nil {
                    for (booster, amount) in item.grants {
                        player.credit(booster, amount)
                    }
                }
            } else {
                player.setRemoveAds(transaction.revocationDate == nil)
            }
        }

        await transaction.finish()
    }
}
