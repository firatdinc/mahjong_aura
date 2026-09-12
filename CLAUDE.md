# Mahjong Aura — yeniden yazım (v2.1)

Bu proje, App Store'da canlı olan **2.0.1** sürümünün **sıfırdan SwiftUI ile
yeniden yazımıdır.** 2.0.1'in kaynak kodu kalıcı olarak kayıp (git'e hiç push
edilmemiş, tek kopyanın bulunduğu makineye erişim yok, ikili FairPlay şifreli).

## Değişmez kurallar

1. **Eski React Native koduna dokunulmaz, ondan kod taşınmaz.** v1.x arşivi
   sadece referans: GitHub `firatdinc/mahjong_aura`.
2. **Aşağıdaki kimlikler asla değiştirilemez.** Değişirse canlı kullanıcılar
   satın almalarını ve skorlarını kaybeder. Tanımları `Sources/Services/StoreCatalog.swift`:
   - Bundle: `com.mahjongaura.app`
   - IAP: `…removeads` (non-consumable), `…bundle`, `…hints20`, `…undos30`, `…revives10`
   - Game Center: `…levels`, `…bestiq`
   - AdMob: `ca-app-pub-8571533711927103~6034352154`
3. **Build numarası 14'ten devam eder.** Şu an 15.
4. **Oyuncu ilerlemesi bilinçli olarak sıfırlanıyor.** 2.0.1'in UserDefaults
   anahtar adları bilinmiyor ve telefon yedeğinden çıkarılmayacak (karar:
   2026-09-12, indirme sayısı düşük ve satın alma yok). Güncellemeyi alan
   mevcut oyuncular 1. bölümden başlar. `removeAds` etkilenmez — non-consumable
   olduğu için StoreKit otomatik geri yükler. Eski kayıtlar silinmiyor;
   `PlayerStore.legacySnapshot` ilk açılışta kopyasını alıyor, dolayısıyla
   anahtarlar ileride çözülürse ilerleme geri getirilebilir.
5. **Her yeni metin `Localizable.strings`'e girer**, koda gömülmez.
   Lokalizasyon ASO'nun 1 numaralı kaldıracı; 2.0 hiç yerelleştirilmemişti.
6. **Yayına çıkmadan önce push.** Bu projenin var olma sebebi push edilmemiş
   koddu. Uzak depoya gitmeyen kod yok sayılır.

## Şartname

Oynanış, ekranlar ve görsel dil ekran kaydından çıkarıldı:
`~/Desktop/MahjongAura-YEDEK/KURTARMA-KITI/V2-SARTNAME.md`
App Store Connect'in her alanı: `…/KURTARMA-KITI/asc/ASC-TAM-DOKUM.md`

Özet mekanik: mahjong solitaire serbest taş kuralı (üstü kapalı değil **ve**
sağ ya da sol kenarı açık) + tepside **çift** eşleştirme. Tepsi 4 yuva,
Zen Modu 5. Tepsi dolar ve eşleşme yoksa kayıp → Revive.

## Yapı

```
Sources/
  App/        — giriş noktası
  Core/       — Model (Tile) + Engine (BoardEngine: serbest taş & tepsi kuralları)
  Features/   — Lobby · Levels · Game · Result · Menu · Shop
  Design/     — Theme (renk/ölçü tokenları, ekran kaydından)
  Services/   — StoreCatalog (kurtarılmış kimlikler) · PlayerStore (kalıcı kayıt)
  Resources/  — Info.plist · Assets.xcassets · en.lproj · tr.lproj
```

## Komutlar

```
xcodegen generate
xcodebuild -project MahjongAura.xcodeproj -scheme MahjongAura \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  build CODE_SIGNING_ALLOWED=NO
```

Hedef: iOS 16.0 (2.0.1'de 17.0 idi; erişilebilir cihaz sayısını artırmak için
indirildi — bu yüzden `@Observable` değil `ObservableObject` kullanılıyor).

## Henüz yapılmadı

- RevenueCat / GoogleMobileAds / UserMessagingPlatform bağımlılıkları
- Bölüm üretimi (2000 bölüm) ve zorluk eğrisi
- Levels · Game · Result · Menu · Shop ekranları
- `SKStoreReviewController` (3. veya 5. bölüm sonunda — ASO notu)
- Kaybetme ekranı, Revive akışı, ödüllü reklamlar, ayarlar ekranı
  (bunlar ekran kaydında görünmüyordu, ikinci kayıt gerekiyor)
