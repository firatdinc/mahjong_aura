# Mahjong Aura - Proje Dokümantasyonu

## Genel Bakış
Mahjong Aura, React Native (Expo) ile geliştirilmiş tek oyunculu bir Mahjong taş oyunudur. Oyuncu 3 yapay zeka rakibine karşı klasik Mahjong kurallarıyla oynayabilir.

- **Platform:** iOS / Android
- **Framework:** React Native (Expo SDK 54)
- **Dil:** TypeScript
- **State Management:** Zustand
- **Versiyon:** 1.0.0
- **Bundle ID:** com.mahjongaura.app
- **App Store ID:** 6760037926

---

## Teknoloji Yığını

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| Expo | ~54.0.0 | Framework |
| React | 19.1.0 | UI |
| React Native | 0.81.5 | Native platform |
| TypeScript | ~5.9.2 | Tip güvenliği |
| Zustand | ^5.0.11 | State management |
| AsyncStorage | 2.2.0 | Kalıcı depolama |
| react-native-webview | 13.15.0 | Gizlilik politikası görüntüleyici |
| react-native-gesture-handler | ~2.28.0 | Gesture desteği |
| react-native-safe-area-context | ~5.6.0 | Safe area |

---

## Proje Yapısı

```
Mahjong Aura/
├── App.tsx                          # Ana giriş noktası, navigation
├── index.ts                         # Expo root component kaydı
├── app.json                         # Expo konfigürasyonu
├── eas.json                         # EAS Build konfigürasyonu
├── package.json
├── tsconfig.json
│
├── assets/
│   ├── icon.png                     # Uygulama ikonu
│   ├── splash-icon.png              # Splash ekranı
│   ├── favicon.png                  # Web favicon
│   ├── android-icon-*.png           # Android adaptive icon dosyaları
│   └── game/
│       ├── crown.png                # Başlık taç ikonu
│       ├── energy.png               # Enerji ikonu
│       ├── medal.png                # Madalya ikonu
│       ├── star.png                 # Yıldız ikonu
│       └── trophy.png              # Kupa ikonu
│
├── locales/                         # iOS lokalizasyon dosyaları
│   ├── en.json
│   ├── tr.json
│   ├── zh-Hans.json
│   ├── es.json
│   ├── fr.json
│   └── de.json
│
├── privacy-policy/                  # Gizlilik politikası HTML sayfaları
│   ├── en.html
│   ├── tr.html
│   ├── zh.html
│   ├── es.html
│   ├── fr.html
│   └── de.html
│
└── src/
    ├── types/
    │   └── index.ts                 # Tüm TypeScript tip tanımları
    │
    ├── screens/
    │   ├── StartScreen.tsx           # Ana menü, istatistikler, ayarlar
    │   ├── GameScreen.tsx            # Oyun ekranı, duraklatma/bitiş modalleri
    │   └── TutorialScreen.tsx        # 6 adımlı interaktif eğitim
    │
    ├── components/
    │   ├── TileComponent.tsx         # Tek taş render bileşeni
    │   ├── PlayerHand.tsx            # Oyuncu eli (2 satır + açık setler)
    │   ├── BotHand.tsx               # Bot elleri (üst/sol/sağ)
    │   ├── GameHeader.tsx            # Durum çubuğu + duraklatma butonu
    │   └── DiscardPile.tsx           # Merkezi atılan taş alanı
    │
    ├── store/
    │   ├── useGameStore.ts           # Oyun state yönetimi (Zustand)
    │   └── useSettings.ts            # Ayarlar store (otomatik çekme)
    │
    ├── engine/
    │   ├── index.ts                  # Engine export'ları
    │   ├── tileGenerator.ts          # 144 taş üretimi, dağıtım, sıralama
    │   ├── meldUtils.ts              # Set eşleştirme (pong/kong/chow)
    │   ├── winDetection.ts           # Kazanan el kontrolü
    │   └── botAI.ts                  # Yapay zeka (3 zorluk seviyesi)
    │
    ├── i18n/
    │   ├── translations.ts           # 6 dil çevirileri
    │   └── useLanguage.ts            # Dil store (Zustand)
    │
    ├── constants/
    │   ├── tiles.ts                  # Taş sabitleri
    │   ├── game.ts                   # Oyun sabitleri
    │   └── tileDisplay.ts            # Taş gösterim sabitleri
    │
    └── utils/
        └── storage.ts                # AsyncStorage wrapper + cache
```

---

## Özellikler

### Oyun Mekaniği
- **144 taş:** 3 suit × 9 değer × 4 kopya + 4 rüzgar × 4 + 3 ejderha × 4
- **4 oyuncu:** 1 insan + 3 yapay zeka bot
- **Sıra:** Oyuncu → Bot1 (sol) → Bot2 (üst) → Bot3 (sağ)
- **Fazlar:** Çekme → Atma → Talep etme → Oyun sonu
- **Set türleri:** Pong (3 aynı), Kong (4 aynı), Chow (3 ardışık)
- **Kazanma:** 4 set + 1 çift = Mahjong!

### Zorluk Seviyeleri
| Seviye | Açıklama |
|--------|----------|
| Kolay | %70 yetim taş atma, %30 rastgele |
| Orta | Set oluşturmaya en az katkı yapan taşı at |
| Zor | Savunma stratejisi, oyuncunun ihtiyaçlarını takip et |

### Dil Desteği (6 Dil)
- English 🇬🇧
- Türkçe 🇹🇷
- 中文 🇨🇳
- Español 🇪🇸
- Français 🇫🇷
- Deutsch 🇩🇪

### Diğer Özellikler
- Otomatik taş çekme ayarı
- Oyun kaydetme/devam etme
- Detaylı istatistikler (zorluk seviyesine göre)
- 6 adımlı interaktif tutorial
- Gizlilik politikası (WebView ile uygulama içi görüntüleme)
- Tamamen çevrimdışı çalışma
- Reklam yok, veri toplama yok

---

## Renk Paleti

| Renk | Hex | Kullanım |
|------|-----|----------|
| Koyu yeşil | `#334443` | Ana arka plan |
| Krem beyaz | `#FAF8F1` | Başlıklar, vurgu metinler |
| Altın sarı | `#FAEAB1` | Butonlar, aktif elemanlar |
| Koyu petrol | `#34656D` | İkincil arka plan |
| Soluk yeşil | `#8AABA5` | İkincil metin |
| Koyu çay yeşili | `#6B9C93` | Alt metin, tarih |

### Taş Renkleri
| Suit | Renk |
|------|------|
| Bamboo | Yeşil `#4CAF50` |
| Dot | Kırmızı `#E57373` |
| Character | Mavi `#64B5F6` |
| Wind | Mor `#BA68C8` |
| Dragon | Turuncu `#FFB74D` |

---

## Depolama (AsyncStorage)

| Anahtar | İçerik |
|---------|--------|
| `@mahjong_aura/game_state` | Oyun durumu (devam ettirme için) |
| `@mahjong_aura/player_stats` | Oyuncu istatistikleri |
| `@mahjong_aura/tutorial_completed` | Tutorial tamamlanma durumu |
| `@mahjong_aura/language` | Seçili dil |
| `@mahjong_aura/settings` | Ayarlar (otomatik çekme) |

---

## Ekran Akışı

```
İlk Açılış → TutorialScreen (6 adım)
                    ↓ (Tamamla/Atla)
              StartScreen (Ana Menü)
              ├── Yeni Oyun (zorluk seç) → GameScreen
              ├── Devam Et → GameScreen (kayıtlı oyun)
              ├── Tutorial → TutorialScreen
              ├── Ayarlar (dil, otomatik çekme)
              └── Gizlilik Politikası (WebView)

GameScreen
├── Duraklat → Devam / Çık
└── Oyun Bitti → Yeni Oyun / Masayı İncele
```

---

## App Store Bilgileri

### Genel
- **Uygulama Adı:** Mahjong Aura
- **Bundle ID:** com.mahjongaura.app
- **Apple ID:** 6760037926
- **Kategori:** Games → Board / Puzzle
- **Yaş Sınıfı:** 4+
- **Fiyat:** Ücretsiz
- **Telif Hakkı:** © 2026 FE Labs

### URL'ler
- **Gizlilik Politikası:** https://felabs.app/apps/mahjong-aura/privacy-policy/en.html
- **Destek:** https://felabs.app
- **İletişim:** support@felabs.app

### Anahtar Kelimeler (EN)
```
mahjong,tiles,board game,puzzle,classic,strategy,offline,solitaire,chinese,mah jong
```

---

## Yapılan İşler Özeti

### Temel Oyun Geliştirme
- [x] 144 taşlık Mahjong taş seti oluşturma
- [x] Taş dağıtımı ve duvar sistemi
- [x] Pong, Kong, Chow set mekanikleri
- [x] Kazanan el tespiti (4 set + 1 çift)
- [x] Sıra tabanlı oyun akışı
- [x] 3 seviyeli yapay zeka (kolay/orta/zor)
- [x] Otomatik taş çekme özelliği

### Kullanıcı Arayüzü
- [x] Ana menü ekranı (istatistikler, rozetler)
- [x] Oyun ekranı (4 oyunculu masa düzeni)
- [x] 2 satırlı oyuncu eli gösterimi
- [x] Renkli taş bileşenleri (5 suit rengi)
- [x] Modern buton tasarımları (gölge, parıltı efekti)
- [x] Özel duraklatma modalı (Alert yerine)
- [x] Özel oyun sonu modalı (kontekstüel ikonlar)
- [x] Koyu tema renk paleti (#334443 tabanlı)

### Çoklu Dil Desteği
- [x] 6 dil çeviri sistemi (Zustand + AsyncStorage)
- [x] Tüm ekranlar ve modallar çevrildi
- [x] Dil seçim modalı (bayrak ikonları ile)
- [x] App Store lokalizasyon dosyaları

### Tutorial Sistemi
- [x] 6 adımlı interaktif eğitim
- [x] İlerleme noktaları ve navigasyon
- [x] Gerçek taş bileşenleri ile örnekler
- [x] İlk açılışta otomatik gösterim
- [x] Ana menüden tekrar erişim

### Veri Yönetimi
- [x] Oyun kaydetme/yükleme
- [x] Oyuncu istatistikleri takibi
- [x] Tutorial tamamlanma durumu
- [x] Ayarlar kalıcılığı
- [x] Dil tercihi kalıcılığı

### App Store Hazırlığı
- [x] app.json konfigürasyonu (bundleIdentifier, backgroundColor, locales)
- [x] eas.json build konfigürasyonu
- [x] iOS şifreleme beyanı (ITSAppUsesNonExemptEncryption)
- [x] CFBundleLocalizations (6 dil)
- [x] 6 dilde gizlilik politikası HTML sayfaları
- [x] Uygulama içi gizlilik politikası görüntüleyici (WebView)
- [x] WebView hata yönetimi (çevrimdışı durumu)
- [x] App Store Connect tüm alanlar dolduruldu (6 dil)
- [x] Yaş sınıflandırması: 4+
- [x] App Privacy: Data Not Collected

### Bekleyen İşler
- [ ] App Store ekran görüntüleri (iPhone 6.5" + iPad)
- [ ] EAS Build alma ve yükleme (`eas build --platform ios`)
- [ ] Review'e gönderme

---

## Build Komutları

```bash
# Geliştirme
npx expo start

# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production

# TypeScript Kontrolü
npx tsc --noEmit

# App Store'a Gönderme
eas submit --platform ios
```

---

## Proje İstatistikleri

| Metrik | Değer |
|--------|-------|
| Ekranlar | 3 |
| Bileşenler | 5 |
| Motor Modülleri | 5 |
| Store Dosyaları | 2 |
| Toplam Kaynak Dosya | 22 |
| Toplam Kod Satırı | ~4,500+ |
| Desteklenen Diller | 6 |
| Production Bağımlılık | 9 |
| Oyun Taşı Sayısı | 144 |
