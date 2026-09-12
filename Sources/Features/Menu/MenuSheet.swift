import SwiftUI

/// Oyun içi menü — şartname § 2.6
/// Ayarlar ekranı kayıtta yoktu; ses ve titreşim anahtarları uygulamanın
/// kendi kalıbına uyacak şekilde bu panele eklendi (ayrı ekran açılmadı).
struct MenuSheet: View {
    @EnvironmentObject private var player: PlayerStore
    @Environment(\.dismiss) private var dismiss

    let onShop: () -> Void
    let onRestart: () -> Void
    let onQuit: () -> Void

    var body: some View {
        ZStack {
            Rectangle().fill(Theme.feltBackground).ignoresSafeArea()

            VStack(spacing: 16) {
                Text(NSLocalizedString("menu.title", comment: ""))
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.top, 18)

                toggleRow(icon: "figure.mind.and.body",
                          title: "menu.zenMode",
                          detail: "menu.zenMode.detail",
                          isOn: $player.zenModeEnabled)

                removeAdsBlock

                rowButton("menu.shop", icon: "cart.fill", action: onShop)
                rowButton("menu.restart", icon: nil, action: onRestart)

                Button(action: onQuit) {
                    Text(NSLocalizedString("menu.quit", comment: ""))
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundStyle(Theme.symbolRed)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(RoundedRectangle(cornerRadius: 12).fill(.white.opacity(0.05)))
                }
                .buttonStyle(.plain)

                Spacer()
            }
            .padding(.horizontal, 20)
        }
        .presentationDetents([.medium])
    }

    private var removeAdsBlock: some View {
        VStack(spacing: 8) {
            if !player.hasRemoveAds {
                Button {
                    // TODO: StoreKit satın alma akışı
                } label: {
                    Text(String(format: NSLocalizedString("menu.removeAds", comment: ""), "₺249,99"))
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: Theme.Metric.actionButtonHeight)
                        .background(Capsule().fill(Theme.actionGreen))
                }
                .buttonStyle(.plain)

                Text(NSLocalizedString("menu.removeAds.detail", comment: ""))
                    .font(.system(size: 12, design: .rounded))
                    .foregroundStyle(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
            }

            Button {
                // TODO: StoreKit geri yükleme
            } label: {
                Text(NSLocalizedString("menu.restore", comment: ""))
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.75))
                    .underline()
            }
            .buttonStyle(.plain)
        }
    }

    private func toggleRow(icon: String, title: String, detail: String,
                           isOn: Binding<Bool>) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(Theme.amberBright)
            VStack(alignment: .leading, spacing: 2) {
                Text(NSLocalizedString(title, comment: ""))
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(NSLocalizedString(detail, comment: ""))
                    .font(.system(size: 11, design: .rounded))
                    .foregroundStyle(.white.opacity(0.6))
            }
            Spacer()
            Toggle("", isOn: isOn).labelsHidden().tint(Theme.actionGreen)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(.white.opacity(0.06)))
    }

    private func rowButton(_ key: String, icon: String?,
                           action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon { Image(systemName: icon).font(.system(size: 13)) }
                Text(NSLocalizedString(key, comment: ""))
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
            }
            .foregroundStyle(.white.opacity(0.9))
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(RoundedRectangle(cornerRadius: 12).fill(.white.opacity(0.06)))
        }
        .buttonStyle(.plain)
    }
}

/// Mağaza — şartname § 2.7. Ürün kimlikleri `StoreCatalog` ile birebir.
struct ShopSheet: View {
    @Environment(\.dismiss) private var dismiss

    private struct Row {
        let product: StoreCatalog.Product
        let titleKey: String
        let detailKey: String
        let icon: String
        let price: String
    }

    /// Fiyatlar canlıda StoreKit'ten gelecek; buradakiler ASC'deki TRY karşılıkları.
    private let boosters: [Row] = [
        Row(product: .boosterBundle, titleKey: "shop.bundle", detailKey: "shop.bundle.detail",
            icon: "gift.fill", price: "₺199,99"),
        Row(product: .hints20, titleKey: "shop.hints", detailKey: "shop.hints.detail",
            icon: "lightbulb.fill", price: "₺99,99"),
        Row(product: .undos30, titleKey: "shop.undos", detailKey: "shop.undos.detail",
            icon: "arrow.uturn.backward", price: "₺99,99"),
        Row(product: .revives10, titleKey: "shop.revives", detailKey: "shop.revives.detail",
            icon: "heart.fill", price: "₺149,99"),
    ]

    var body: some View {
        ZStack {
            Rectangle().fill(Theme.feltBackground).ignoresSafeArea()

            ScrollView {
                VStack(spacing: 10) {
                    Text(NSLocalizedString("shop.title", comment: ""))
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.top, 18)

                    productRow(Row(product: .removeAds, titleKey: "shop.removeAds",
                                   detailKey: "shop.removeAds.detail",
                                   icon: "nosign", price: "₺249,99"))

                    Text(NSLocalizedString("shop.boosters", comment: ""))
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.5))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 8)

                    ForEach(boosters, id: \.product) { productRow($0) }

                    Button {
                        // TODO: StoreKit geri yükleme
                    } label: {
                        Text(NSLocalizedString("menu.restore", comment: ""))
                            .font(.system(size: 13, design: .rounded))
                            .foregroundStyle(.white.opacity(0.75))
                            .underline()
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 10)
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func productRow(_ row: Row) -> some View {
        HStack(spacing: 12) {
            Image(systemName: row.icon)
                .font(.system(size: 18))
                .foregroundStyle(Theme.amberBright)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(NSLocalizedString(row.titleKey, comment: ""))
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(NSLocalizedString(row.detailKey, comment: ""))
                    .font(.system(size: 11, design: .rounded))
                    .foregroundStyle(.white.opacity(0.6))
            }

            Spacer()

            Button {
                // TODO: StoreKit satın alma — row.product.rawValue
            } label: {
                Text(row.price)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14).padding(.vertical, 7)
                    .background(Capsule().fill(Theme.actionGreen))
            }
            .buttonStyle(.plain)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(.white.opacity(0.06)))
    }
}
