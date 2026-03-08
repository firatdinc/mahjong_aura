import {create} from 'zustand';
import {
  GameStore,
  GameState,
  Difficulty,
  SeatId,
  MeldType,
  Tile,
} from '../types';
import {dealGame, sortHand} from '../engine/mahjong/tileGenerator';
import {createMeld} from '../engine/mahjong/meldUtils';
import {checkWin} from '../engine/mahjong/winDetection';
import {
  chooseBotDiscard,
  evaluateBotClaim,
  waitForThinking,
} from '../engine/mahjong/botAI';
import {TURN_ORDER} from '../constants/mahjong/game';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  recordGameResult,
} from '../utils/storage';

// ─── Default (empty) state ──────────────────────────────────
const createEmptyPlayerState = (seatId: SeatId) => ({
  seatId,
  hand: [],
  revealedMelds: [],
  discards: [],
});

const initialState: GameState = {
  wall: [],
  discardPile: [],
  players: {
    player: createEmptyPlayerState('player'),
    bot1: createEmptyPlayerState('bot1'),
    bot2: createEmptyPlayerState('bot2'),
    bot3: createEmptyPlayerState('bot3'),
  },
  currentTurn: 'player',
  turnPhase: 'drawing',
  difficulty: 'medium',
  lastDiscardedTile: null,
  lastDiscardedBy: null,
  winner: null,
};

// ─── Turn helper ────────────────────────────────────────────
function getNextSeat(current: SeatId): SeatId {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % TURN_ORDER.length];
}

// ─── Bot claiming logic (runs after any discard) ────────────
// Checks if any bot wants to claim the last discarded tile.
// Pong/Kong take priority over Chow. If no bot claims, skip.
async function handleBotClaiming(depth = 0) {
  // Safety: prevent infinite recursive claiming
  if (depth > 12) {
    try { useGameStore.getState().skipClaim(); } catch {}
    return;
  }

  try {
    const store = useGameStore.getState;

    const state = store();
    if (state.turnPhase !== 'claiming' || !state.lastDiscardedTile) {return;}

    const discardedBy = state.lastDiscardedBy!;

    // Check each bot (excluding the one who discarded) for claims
    const botSeats: SeatId[] = ['bot1', 'bot2', 'bot3'].filter(
      s => s !== discardedBy,
    ) as SeatId[];

    // Also exclude human player — they decide via UI
    const eligibleBots = botSeats.filter(s => s !== 'player');

    for (const botSeat of eligibleBots) {
      const currentState = store();
      if (currentState.turnPhase !== 'claiming') {return;}

      const hand = currentState.players[botSeat].hand;
      const currentDiscard = currentState.lastDiscardedTile;
      if (!currentDiscard) {return;}
      const decision = evaluateBotClaim(
        hand,
        currentDiscard,
        currentState.difficulty,
        botSeat,
        discardedBy,
      );

      if (decision.shouldClaim) {
        await waitForThinking();
        useGameStore.getState().claimTile(botSeat, decision.meldType, decision.tileIds);

        // After claiming, the bot needs to discard (unless it's a kong or win)
        const afterClaim = store();
        if (afterClaim.winner || afterClaim.turnPhase === 'gameOver') {return;}

        if (afterClaim.turnPhase === 'discarding' && afterClaim.currentTurn === botSeat) {
          await waitForThinking();
          // Re-fetch state to avoid stale data after async wait
          const freshState = store();
          const botHand = freshState.players[botSeat].hand;
          const tileId = chooseBotDiscard(botHand, freshState.difficulty, freshState);
          useGameStore.getState().discardTile(tileId);
          // Recursively handle claiming for the new discard
          await handleBotClaiming(depth + 1);
        }
        // For kong (turnPhase === 'drawing'): component's useEffect will trigger playBotTurn
        return;
      }
    }

    // No bot claimed — skip and advance to next player
    useGameStore.getState().skipClaim();
    // Component's useEffect will trigger playBotTurn for the next bot turn
  } catch {
    // Recover from errors — skip claim to prevent stuck state
    try {
      const fallbackState = useGameStore.getState();
      if (fallbackState.turnPhase === 'claiming') {
        useGameStore.getState().skipClaim();
      }
    } catch {}
  }
}

// ─── Store ──────────────────────────────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // ── Start a new game ────────────────────────────────────
  startGame: (difficulty: Difficulty) => {
    const gameState = dealGame(difficulty);
    set({...gameState});
  },

  // ── Draw a tile from the wall ───────────────────────────
  drawTile: () => {
    const state = get();
    if (state.turnPhase !== 'drawing' || state.winner) {return;}

    const wall = [...state.wall];
    if (wall.length === 0) {
      // Wall exhausted — draw game (no winner)
      set({turnPhase: 'gameOver'});
      return;
    }

    const drawnTile = {...wall.pop()!};
    const currentSeat = state.currentTurn;

    // Update the tile's metadata
    drawnTile.location = currentSeat;
    drawnTile.isHidden = currentSeat !== 'player';

    // Add to player's hand
    const playerState = {...state.players[currentSeat]};
    const newHand = [...playerState.hand, drawnTile];
    sortHand(newHand);
    playerState.hand = newHand;

    const newPlayers = {...state.players, [currentSeat]: playerState};

    set({
      wall,
      players: newPlayers,
      turnPhase: 'discarding',
    });

    // Check if drawing completed a win (tsumo / self-draw win)
    if (checkWin(playerState)) {
      set({winner: currentSeat, turnPhase: 'gameOver'});
    }
  },

  // ── Discard a tile ──────────────────────────────────────
  discardTile: (tileId: string) => {
    const state = get();
    if (state.turnPhase !== 'discarding' || state.winner) {return;}

    const currentSeat = state.currentTurn;
    const playerState = {...state.players[currentSeat]};
    const tileIndex = playerState.hand.findIndex(t => t.id === tileId);

    if (tileIndex === -1) {return;} // Tile not in hand

    // Remove from hand
    const discardedTile = {...playerState.hand[tileIndex]};
    discardedTile.location = 'discardPile';
    discardedTile.isHidden = false;

    playerState.hand = playerState.hand.filter(t => t.id !== tileId);
    playerState.discards = [...playerState.discards, discardedTile];

    const newPlayers = {...state.players, [currentSeat]: playerState};
    const newDiscardPile = [...state.discardPile, discardedTile];

    // Move to claiming phase — other players get a chance to claim
    // Then transition to next player's drawing phase
    set({
      players: newPlayers,
      discardPile: newDiscardPile,
      lastDiscardedTile: discardedTile,
      lastDiscardedBy: currentSeat,
      turnPhase: 'claiming',
    });
  },

  // ── Claim the last discarded tile ───────────────────────
  claimTile: (
    claimingSeat: SeatId,
    meldType: MeldType,
    meldTileIds: string[],
  ) => {
    const state = get();
    if (state.turnPhase !== 'claiming' || !state.lastDiscardedTile) {return;}

    const discardedTile = state.lastDiscardedTile;
    const playerState = {...state.players[claimingSeat]};

    // Gather the tiles from hand that form the meld
    const meldTilesFromHand: Tile[] = [];
    const remainingHand = [...playerState.hand];

    for (const id of meldTileIds) {
      const idx = remainingHand.findIndex(t => t.id === id);
      if (idx === -1) {return;} // Invalid claim
      meldTilesFromHand.push(remainingHand.splice(idx, 1)[0]);
    }

    // Build the meld (hand tiles + the discarded tile) — shallow copy to avoid mutation
    const allMeldTiles = [...meldTilesFromHand, discardedTile].map(t => ({...t, isHidden: false}));
    const meld = createMeld(meldType, allMeldTiles);

    playerState.hand = remainingHand;
    playerState.revealedMelds = [...playerState.revealedMelds, meld];

    // Remove the discarded tile from the discard pile
    const newDiscardPile = state.discardPile.filter(
      t => t.id !== discardedTile.id,
    );

    const newPlayers = {...state.players, [claimingSeat]: playerState};

    // After claiming, the claiming player must discard (unless they won)
    if (checkWin(playerState)) {
      set({
        players: newPlayers,
        discardPile: newDiscardPile,
        lastDiscardedTile: null,
        lastDiscardedBy: null,
        currentTurn: claimingSeat,
        turnPhase: 'gameOver',
        winner: claimingSeat,
      });
      return;
    }

    // Kong claim: player draws a replacement tile instead of discarding
    if (meldType === 'kong') {
      set({
        players: newPlayers,
        discardPile: newDiscardPile,
        lastDiscardedTile: null,
        lastDiscardedBy: null,
        currentTurn: claimingSeat,
        turnPhase: 'drawing',
      });
      return;
    }

    // Pong/Chow: claiming player must now discard
    set({
      players: newPlayers,
      discardPile: newDiscardPile,
      lastDiscardedTile: null,
      lastDiscardedBy: null,
      currentTurn: claimingSeat,
      turnPhase: 'discarding',
    });
  },

  // ── Skip claiming — advance to next player's draw ───────
  skipClaim: () => {
    const state = get();
    if (state.turnPhase !== 'claiming') {return;}

    const nextSeat = getNextSeat(state.lastDiscardedBy ?? state.currentTurn);

    set({
      currentTurn: nextSeat,
      turnPhase: 'drawing',
      lastDiscardedTile: null,
      lastDiscardedBy: null,
    });
  },

  // ── Execute a full bot turn (draw → discard) ───────────
  playBotTurn: async () => {
    const state = get();
    const botSeat = state.currentTurn;

    // Safety: only run for bot seats
    if (botSeat === 'player' || state.winner) {return;}

    // Simulate thinking time
    await waitForThinking();

    // ── Drawing phase ──
    if (get().turnPhase === 'drawing') {
      get().drawTile();

      // Check if the draw ended the game (win or wall exhaustion)
      if (get().winner || get().turnPhase === 'gameOver') {return;}

      // Simulate more thinking before discarding
      await waitForThinking();

      // ── Discard phase ──
      const afterDraw = get();
      const hand = afterDraw.players[botSeat].hand;
      const tileId = chooseBotDiscard(hand, afterDraw.difficulty, afterDraw);
      get().discardTile(tileId);

      // After discarding, check if any bot wants to claim
      await handleBotClaiming();
    }
  },

  // ── Process bot actions after human discard/skip ────────
  // Call this from the UI after the human discards or skips claiming.
  processBotActions: async () => {
    await handleBotClaiming();
  },

  // ── Resume a saved game ────────────────────────────────
  resumeGame: (): boolean => {
    const saved = loadGameState();
    if (!saved) {return false;}
    set({...saved});
    return true;
  },

  // ── Reset game ─────────────────────────────────────────
  resetGame: () => {
    clearGameState();
    set({...initialState});
  },
}));

// ─── Auto-save & stats recording ────────────────────────────
// Subscribe to state changes and persist automatically.
useGameStore.subscribe((state, prevState) => {
  // Only save when the game is active (not empty initial state)
  if (state.wall.length > 0 || state.discardPile.length > 0) {
    saveGameState(state);
  }

  // Record stats when game ends
  if (state.turnPhase === 'gameOver' && prevState.turnPhase !== 'gameOver') {
    clearGameState(); // Don't restore finished games
    if (state.winner === 'player') {
      recordGameResult(state.difficulty, 'win');
    } else if (state.winner) {
      recordGameResult(state.difficulty, 'loss');
    } else {
      recordGameResult(state.difficulty, 'draw');
    }
  }
});
