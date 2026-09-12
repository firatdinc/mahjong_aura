import SwiftUI

/// Oyun içi menü — şartname § 2.6
/// Ayarlar ekranı kayıtta yoktu; ses ve titreşim anahtarları uygulamanın
/// kendi kalıbına uyacak şekilde bu panele eklendi (ayrı ekran açılmadı).
struct MenuSheet: View {
    @EnvironmentObject private var player: PlayerStore
    @EnvironmentObject private var store: StoreService
    @EnvironmentObject private var ads: AdService
    @Environment(\.dismiss) private var dismiss

    let onShop: () -> Void
    let onRestart: () -> Void
    let onQuit: () -> Void

    /// Gizli tanılama paneli: "Menü" başlığına uzun basınca açılır.
    /// Normal oyuncu göremez; TestFlight'ta reklam sorununu teşhis için var.
    @State private var showDiagnostics = false

    var body: some View {
        ZStack {
            Rectangle().fill(Theme.feltBackground).ignoresSafeArea()

            VStack(spacing: 16) {
                Text(NSLocalizedString("menu.title", comment: ""))
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.top, 18)
                    .onLongPressGesture(minimumDuration: 1.2) {
                        showDiagnostics.toggle()
                    }

                if showDiagnostics { diagnosticsPanel }

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

    /// Reklam tanılaması — neden reklam gelmediğini tahmin etmek yerine gösterir.
    private var diagnosticsPanel: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(ads.diagnostics, id: \.0) { label, value in
                HStack {
                    Text(label)
                        .foregroundStyle(.white.opacity(0.55))
                    Spacer()
                    Text(value)
                        .foregroundStyle(value.contains("REDDEDİLDİ") || value.contains("ENGELLİ")
                                         || value.contains("SIFIR") || value == "eşleşmedi"
                                         ? Theme.symbolRed : .white)
                        .multilineTextAlignment(.trailing)
                }
                .font(.system(size: 11, design: .monospaced))
            }
            Button {
                ads.presentAdInspector()
            } label: {
                Label("Ad Inspector", systemImage: "ladybug.fill")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(Theme.amberBright)
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 10).fill(.black.opacity(0.35)))
    }

    private var removeAdsBlock: some View {
        VStack(spacing: 8) {
            if !player.hasRemoveAds, let price = store.displayPrice(for: .removeAds) {
                Button {
                    Task { await store.purchase(.removeAds) }
                } label: {
                    Group {
                        if store.pending == .removeAds {
                            ProgressView().tint(.white)
                        } else {
                            Text(String(format: NSLocalizedString("menu.removeAds", comment: ""), price))
                                .font(.system(size: 18, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: Theme.Metric.actionButtonHeight)
                    .background(Capsule().fill(Theme.actionGreen))
                }
                .buttonStyle(.plain)
                .disabled(store.pending != nil)

                Text(NSLocalizedString("menu.removeAds.detail", comment: ""))
                    .font(.system(size: 12, design: .rounded))
                    .foregroundStyle(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
            }

            Button {
                Task { await store.restore() }
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
    @EnvironmentObject private var store: StoreService
    @EnvironmentObject private var player: PlayerStore

    private struct Row {
        let product: StoreCatalog.Product
        let titleKey: String
        let detailKey: String
        let icon: String
    }

    private let boosters: [Row] = [
        Row(product: .boosterBundle, titleKey: "shop.bundle", detailKey: "shop.bundle.detail",
            icon: "gift.fill"),
        Row(product: .hints20, titleKey: "shop.hints", detailKey: "shop.hints.detail",
            icon: "lightbulb.fill"),
        Row(product: .undos30, titleKey: "shop.undos", detailKey: "shop.undos.detail",
            icon: "arrow.uturn.backward"),
        Row(product: .revives10, titleKey: "shop.revives", detailKey: "shop.revives.detail",
            icon: "heart.fill"),
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

                    if !player.hasRemoveAds {
                        productRow(Row(product: .removeAds, titleKey: "shop.removeAds",
                                       detailKey: "shop.removeAds.detail", icon: "nosign"))
                    }

                    Text(NSLocalizedString("shop.boosters", comment: ""))
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.5))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 8)

                    ForEach(boosters, id: \.product) { productRow($0) }

                    Button {
                        Task { await store.restore() }
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
        .alert(NSLocalizedString("store.title", comment: ""),
               isPresented: Binding(get: { store.alertMessage != nil },
                                    set: { if !$0 { store.alertMessage = nil } })) {
            Button("OK", role: .cancel) { store.alertMessage = nil }
        } message: {
            Text(store.alertMessage ?? "")
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
                Task { await store.purchase(row.product) }
            } label: {
                Group {
                    if store.pending == row.product {
                        ProgressView().tint(.white)
                    } else {
                        Text(store.displayPrice(for: row.product) ?? "—")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                }
                .frame(minWidth: 64)
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(Capsule().fill(Theme.actionGreen))
            }
            .buttonStyle(.plain)
            .disabled(store.pending != nil || store.displayPrice(for: row.product) == nil)
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(.white.opacity(0.06)))
    }
}
