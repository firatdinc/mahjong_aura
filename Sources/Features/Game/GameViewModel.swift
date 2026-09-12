import Foundation
import SwiftUI

/// Oyun döngüsü.
///
/// Ekran kaydında görünen davranışlar birebir uygulandı. Kayıtta **görünmeyen**
/// kısımlar (kaybetme ekranı, revive akışı, hediye içeriği, övgü kademeleri)
/// uygulamanın kendi kurallarından türetildi; her biri aşağıda gerekçesiyle
/// işaretli. Bunlar tasarım kararıdır, gözlem değil.
@MainActor
final class GameViewModel: ObservableObject {

    // MARK: - Kalibre edilmiş sabitler

    /// Kayıtta gözlenen artışlar: +0.4, +0.7, +1.0.
    /// `0.4 + 0.3 × kombo` bu üçüne birebir oturuyor (kombo 0, 1, 2+).
    static let auraBase = 0.4
    static let auraPerCombo = 0.3
    static let auraMax = 1.0

    /// TASARIM KARARI: kombo zaman penceresi. v1.x öğreticisi "Match tiles
    /// quickly to build combos" diyordu; zincir bir süre sessiz kalınca kırılır.
    static let comboWindow: TimeInterval = 6

    /// Bölüm sonu ekranındaki hediye şeridi 10 segmentliydi ve
    /// "Next gift at Level 10" yazıyordu.
    static let giftInterval = 10

    // MARK: - Durum

    enum Phase: Equatable {
        case playing
        case won(Outcome)
        case lost
    }

    struct Outcome: Equatable {
        let aura: Double
        let elapsed: TimeInterval
        let bestCombo: Int

        /// TASARIM KARARI: övgü kademeleri.
        /// Kayıtta kombo 3 / süre 00:28 → "Focused!" görüldü; yani hız tek
        /// başına en üst kademeyi vermiyor. Kademeyi komboya bağlıyoruz.
        /// "Brilliant!" App Store görselinden, "Focused!" kayıttan geliyor.
        var praiseKey: String {
            if bestCombo >= 5 { return "result.title.brilliant" }
            if bestCombo >= 2 { return "result.title.focused" }
            return "result.title.calm"
        }
    }

    @Published private(set) var board: BoardEngine
    @Published private(set) var phase: Phase = .playing
    @Published private(set) var aura: Double = 0
    @Published private(set) var combo: Int = 0
    @Published private(set) var bestCombo: Int = 0
    @Published private(set) var lastGain: Double?
    @Published private(set) var toast: Toast?
    @Published private(set) var hintedTiles: Set<UUID> = []

    enum Toast: Equatable {
        case blocked            // "Blocked on both sides"
        case trayAlmostFull     // "Careful — tray almost full!"
    }

    let level: LevelGenerator.Level
    private let player: PlayerStore
    private var startedAt = Date()
    private var lastMatchAt: Date?
    private var rng: SplitMix64

    init(level: Int, player: PlayerStore) {
        let generated = LevelGenerator.make(level: level)
        self.level = generated
        self.player = player
        self.board = BoardEngine(tiles: generated.tiles, zenMode: player.zenModeEnabled)
        self.rng = SplitMix64(seed: UInt64(level) &* UInt64(7919))
    }

    var levelNumber: Int { level.number }
    var elapsed: TimeInterval { Date().timeIntervalSince(startedAt) }

    // MARK: - Oyuncu girdisi

    func tap(_ tile: Tile) {
        guard phase == .playing else { return }
        hintedTiles.removeAll()

        switch board.tap(tile) {
        case .blocked:
            toast = .blocked
            breakCombo()

        case .moved:
            if board.isTrayNearlyFull { toast = .trayAlmostFull }

        case .matched:
            registerMatch()
            if board.isCleared { finish() }

        case .trayFull:
            if board.isLost {
                phase = .lost
            } else if board.isTrayNearlyFull {
                toast = .trayAlmostFull
            }
        }
    }

    private func registerMatch() {
        let now = Date()
        if let last = lastMatchAt, now.timeIntervalSince(last) <= Self.comboWindow {
            combo += 1
        } else {
            combo = 0
        }
        lastMatchAt = now
        bestCombo = max(bestCombo, combo)

        let gain = min(Self.auraMax, Self.auraBase + Self.auraPerCombo * Double(combo))
        aura += gain
        lastGain = gain
        toast = nil
    }

    private func breakCombo() {
        combo = 0
        lastMatchAt = nil
    }

    private func finish() {
        let outcome = Outcome(aura: aura, elapsed: elapsed, bestCombo: bestCombo)
        phase = .won(outcome)
        player.completeLevel(level.number, aura: aura)
        grantGiftIfDue()
    }

    /// TASARIM KARARI: hediye içeriği. Her 10 bölümde bir küçük booster seti.
    /// Miktarlar mağazadaki paketlerin çok altında tutuldu ki satın alma
    /// değerini düşürmesin.
    private func grantGiftIfDue() {
        guard (level.number % Self.giftInterval) == 0 else { return }
        player.credit(.hint, 3)
        player.credit(.undo, 3)
        player.credit(.revive, 1)
    }

    var levelsUntilGift: Int {
        let next = ((level.number / Self.giftInterval) + 1) * Self.giftInterval
        return next
    }

    // MARK: - Boosterlar

    func useHint() -> Bool {
        guard phase == .playing else { return false }
        guard player.hasRemoveAds || player.balance(of: .hint) > 0 else { return false }
        guard let pair = board.hintPair() else { return false }
        if !player.hasRemoveAds { player.credit(.hint, -1) }
        hintedTiles = [pair.0.id, pair.1.id]
        return true
    }

    func useUndo() -> Bool {
        guard phase == .playing else { return false }
        guard player.hasRemoveAds || player.balance(of: .undo) > 0 else { return false }
        guard board.undo() else { return false }
        if !player.hasRemoveAds { player.credit(.undo, -1) }
        breakCombo()
        return true
    }

    var isShuffleUnlocked: Bool { level.number >= Booster.shuffle.unlocksAtLevel }

    func useShuffle() {
        guard phase == .playing, isShuffleUnlocked else { return }
        board.shuffle(using: &rng)
        breakCombo()
    }

    /// Kaybettikten sonra devam. Tepsideki en eski iki taş tahtaya iade edilir.
    func revive() -> Bool {
        guard phase == .lost else { return false }
        guard player.hasRemoveAds || player.balance(of: .revive) > 0 else { return false }
        guard board.revive(returning: 2) > 0 else { return false }
        if !player.hasRemoveAds { player.credit(.revive, -1) }
        phase = .playing
        breakCombo()
        return true
    }

    /// Ödüllü reklam izleyerek bedava devam (bakiye yoksa da çalışır).
    func reviveByAd() {
        guard phase == .lost else { return }
        guard board.revive(returning: 2) > 0 else { return }
        phase = .playing
        breakCombo()
    }

    func dismissToast() { toast = nil }
}
