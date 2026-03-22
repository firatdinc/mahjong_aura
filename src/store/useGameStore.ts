import {create} from 'zustand';
import {
  GameStore,
  GameState,
  Difficulty,
  SeatId,
  MeldType,
  Tile,
  ClaimOption,
} from '../types';
import {dealGame, sortHand} from '../engine/mahjong/tileGenerator';
import {createMeld, findPongMatch, findKongMatch, findChowMatches, findConcealedKongs} from '../engine/mahjong/meldUtils';
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
  playerClaimOptions: [],
  waitingForPlayerClaim: false,
};

// ─── Turn helper ────────────────────────────────────────────
function getNextSeat(current: SeatId): SeatId {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % TURN_ORDER.length];
}

// ─── Check what claim options the player has ────────────────
function getPlayerClaimOptions(
  hand: Tile[],
  discard: Tile,
  discardedBy: SeatId,
): ClaimOption[] {
  const options: ClaimOption[] = [];

  // Kong
  const kongTiles = findKongMatch(hand, discard);
  if (kongTiles) {
    options.push({meldType: 'kong', tileIds: kongTiles.map(t => t.id)});
  }

  // Pong
  const pongTiles = findPongMatch(hand, discard);
  if (pongTiles) {
    options.push({meldType: 'pong', tileIds: pongTiles.map(t => t.id)});
  }

  // Chow — only if player is next in turn after discardedBy
  const order: SeatId[] = ['player', 'bot1', 'bot2', 'bot3'];
  const discIdx = order.indexOf(discardedBy);
  const nextIdx = (discIdx + 1) % order.length;
  if (order[nextIdx] === 'player') {
    const chowOptions = findChowMatches(hand, discard);
    for (const chowTiles of chowOptions) {
      options.push({meldType: 'chow', tileIds: chowTiles.map(t => t.id)});
    }
  }

  return options;
}

// ─── Bot claiming logic (runs after any discard) ────────────
// Now checks player first, then bots. If player can claim, pauses for UI.
async function handleBotClaiming(depth = 0) {
  if (depth > 12) {
    try { useGameStore.getState().skipClaim(); } catch {}
    return;
  }

  try {
    const store = useGameStore.getState;
    const state = store();
    if (state.turnPhase !== 'claiming' || !state.lastDiscardedTile) {return;}

    const discardedBy = state.lastDiscardedBy!;
    const discard = state.lastDiscardedTile;

    // ── Check if player can claim (player didn't discard it) ──
    if (discardedBy !== 'player') {
      const playerHand = state.players.player.hand;
      const playerOptions = getPlayerClaimOptions(playerHand, discard, discardedBy);

      if (playerOptions.length > 0) {
        // Show claim UI to the player and wait
        useGameStore.setState({
          playerClaimOptions: playerOptions,
          waitingForPlayerClaim: true,
        });
        // Return — the player will call playerClaim() or playerSkipClaim()
        // which will resume the flow
        return;
      }
    }

    // ── Check bots ──
    const botSeats: SeatId[] = (['bot1', 'bot2', 'bot3'] as SeatId[]).filter(
      s => s !== discardedBy,
    );

    for (const botSeat of botSeats) {
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

        const afterClaim = store();
        if (afterClaim.winner || afterClaim.turnPhase === 'gameOver') {return;}

        if (afterClaim.currentTurn === botSeat) {
          if (afterClaim.turnPhase === 'drawing') {
            // Kong claimed — bot needs to draw again, then discard
            let kongDrawAttempts = 0;
            while (store().turnPhase === 'drawing' && !store().winner && kongDrawAttempts < 4) {
              useGameStore.getState().drawTile();
              kongDrawAttempts++;
            }
            if (store().winner || store().turnPhase === 'gameOver') {return;}
          }
          if (store().turnPhase === 'discarding') {
            await waitForThinking();
            const freshState = store();
            const botHand = freshState.players[botSeat].hand;
            const tileId = chooseBotDiscard(botHand, freshState.difficulty, freshState);
            useGameStore.getState().discardTile(tileId);
            await handleBotClaiming(depth + 1);
          }
        }
        return;
      }
    }

    // No one claimed — skip and advance to next player
    useGameStore.getState().skipClaim();
  } catch {
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
    set({...gameState, playerClaimOptions: [], waitingForPlayerClaim: false});
  },

  // ── Draw a tile from the wall ───────────────────────────
  drawTile: () => {
    const state = get();
    if (state.turnPhase !== 'drawing' || state.winner) {return;}

    const wall = [...state.wall];
    if (wall.length === 0) {
      set({turnPhase: 'gameOver'});
      return;
    }

    const drawnTile = {...wall.pop()!};
    const currentSeat = state.currentTurn;

    drawnTile.location = currentSeat;
    drawnTile.isHidden = currentSeat !== 'player';

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

    if (checkWin(playerState)) {
      set({winner: currentSeat, turnPhase: 'gameOver'});
      return;
    }

    // Auto-declare concealed Kongs (4 identical tiles in hand)
    const concealedKongs = findConcealedKongs(newHand);
    if (concealedKongs.length > 0) {
      const kongTiles = concealedKongs[0];
      const remainingHand = newHand.filter(t => !kongTiles.some(kt => kt.id === t.id));
      const meld = createMeld('kong', kongTiles.map(t => ({...t, isHidden: false})));
      const updatedPlayer = {
        ...playerState,
        hand: remainingHand,
        revealedMelds: [...playerState.revealedMelds, meld],
      };
      const updatedPlayers = {...state.players, [currentSeat]: updatedPlayer};

      // After declaring Kong, player draws again
      set({
        players: updatedPlayers,
        turnPhase: 'drawing',
      });
    }
  },

  // ── Discard a tile ──────────────────────────────────────
  discardTile: (tileId: string) => {
    const state = get();
    if (state.turnPhase !== 'discarding' || state.winner) {return;}

    const currentSeat = state.currentTurn;
    const playerState = {...state.players[currentSeat]};
    const tileIndex = playerState.hand.findIndex(t => t.id === tileId);

    if (tileIndex === -1) {return;}

    const discardedTile = {...playerState.hand[tileIndex]};
    discardedTile.location = 'discardPile';
    discardedTile.isHidden = false;

    playerState.hand = playerState.hand.filter(t => t.id !== tileId);
    playerState.discards = [...playerState.discards, discardedTile];

    const newPlayers = {...state.players, [currentSeat]: playerState};
    const newDiscardPile = [...state.discardPile, discardedTile];

    set({
      players: newPlayers,
      discardPile: newDiscardPile,
      lastDiscardedTile: discardedTile,
      lastDiscardedBy: currentSeat,
      turnPhase: 'claiming',
      playerClaimOptions: [],
      waitingForPlayerClaim: false,
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

    const meldTilesFromHand: Tile[] = [];
    const remainingHand = [...playerState.hand];

    for (const id of meldTileIds) {
      const idx = remainingHand.findIndex(t => t.id === id);
      if (idx === -1) {return;}
      meldTilesFromHand.push(remainingHand.splice(idx, 1)[0]);
    }

    const allMeldTiles = [...meldTilesFromHand, discardedTile].map(t => ({...t, isHidden: false}));
    const meld = createMeld(meldType, allMeldTiles);

    playerState.hand = remainingHand;
    playerState.revealedMelds = [...playerState.revealedMelds, meld];

    const newDiscardPile = state.discardPile.filter(
      t => t.id !== discardedTile.id,
    );

    const newPlayers = {...state.players, [claimingSeat]: playerState};

    if (checkWin(playerState)) {
      set({
        players: newPlayers,
        discardPile: newDiscardPile,
        lastDiscardedTile: null,
        lastDiscardedBy: null,
        currentTurn: claimingSeat,
        turnPhase: 'gameOver',
        winner: claimingSeat,
        playerClaimOptions: [],
        waitingForPlayerClaim: false,
      });
      return;
    }

    if (meldType === 'kong') {
      set({
        players: newPlayers,
        discardPile: newDiscardPile,
        lastDiscardedTile: null,
        lastDiscardedBy: null,
        currentTurn: claimingSeat,
        turnPhase: 'drawing',
        playerClaimOptions: [],
        waitingForPlayerClaim: false,
      });
      return;
    }

    set({
      players: newPlayers,
      discardPile: newDiscardPile,
      lastDiscardedTile: null,
      lastDiscardedBy: null,
      currentTurn: claimingSeat,
      turnPhase: 'discarding',
      playerClaimOptions: [],
      waitingForPlayerClaim: false,
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
      playerClaimOptions: [],
      waitingForPlayerClaim: false,
    });
  },

  // ── Player chooses to claim ─────────────────────────────
  playerClaim: (option: ClaimOption) => {
    const state = get();
    if (!state.waitingForPlayerClaim || !state.lastDiscardedTile) {return;}

    // Clear the claim UI immediately
    set({playerClaimOptions: [], waitingForPlayerClaim: false});

    // Execute the claim
    get().claimTile('player', option.meldType, option.tileIds);

    // After claiming, if it's a kong the player draws again (handled by claimTile).
    // If pong/chow, player must discard (turnPhase = 'discarding', handled by UI).
  },

  // ── Player skips claiming ───────────────────────────────
  playerSkipClaim: () => {
    const state = get();
    if (!state.waitingForPlayerClaim) {return;}

    // Clear claim UI
    set({playerClaimOptions: [], waitingForPlayerClaim: false});

    // Now let bots check for claims on the same discard
    (async () => {
      const currentState = useGameStore.getState();
      if (currentState.turnPhase !== 'claiming' || !currentState.lastDiscardedTile) {
        return;
      }
      const discardedBy = currentState.lastDiscardedBy!;

      const botSeats: SeatId[] = (['bot1', 'bot2', 'bot3'] as SeatId[]).filter(
        s => s !== discardedBy,
      );

      for (const botSeat of botSeats) {
        const s = useGameStore.getState();
        if (s.turnPhase !== 'claiming' || !s.lastDiscardedTile) {return;}

        const hand = s.players[botSeat].hand;
        const decision = evaluateBotClaim(
          hand,
          s.lastDiscardedTile,
          s.difficulty,
          botSeat,
          discardedBy,
        );

        if (decision.shouldClaim) {
          await waitForThinking();
          useGameStore.getState().claimTile(botSeat, decision.meldType, decision.tileIds);

          const afterClaim = useGameStore.getState();
          if (afterClaim.winner || afterClaim.turnPhase === 'gameOver') {return;}

          if (afterClaim.turnPhase === 'discarding' && afterClaim.currentTurn === botSeat) {
            await waitForThinking();
            const fresh = useGameStore.getState();
            const botHand = fresh.players[botSeat].hand;
            const tileId = chooseBotDiscard(botHand, fresh.difficulty, fresh);
            useGameStore.getState().discardTile(tileId);
            await handleBotClaiming(0);
          }
          return;
        }
      }

      // No bot claimed either — skip
      useGameStore.getState().skipClaim();
    })();
  },

  // ── Execute a full bot turn (draw → discard) ───────────
  playBotTurn: async () => {
    const state = get();
    const botSeat = state.currentTurn;

    if (botSeat === 'player' || state.winner) {return;}

    await waitForThinking();

    // Draw — loop in case concealed Kong is auto-declared (sets phase back to 'drawing')
    let drawAttempts = 0;
    while (get().turnPhase === 'drawing' && !get().winner && drawAttempts < 4) {
      get().drawTile();
      drawAttempts++;
    }

    if (get().winner || get().turnPhase === 'gameOver') {return;}
    if (get().turnPhase !== 'discarding') {return;}

    await waitForThinking();

    const afterDraw = get();
    const hand = afterDraw.players[botSeat].hand;
    const tileId = chooseBotDiscard(hand, afterDraw.difficulty, afterDraw);
    get().discardTile(tileId);

    await handleBotClaiming();
  },

  // ── Process bot actions after human discard/skip ────────
  processBotActions: async () => {
    await handleBotClaiming();
  },

  // ── Resume a saved game ────────────────────────────────
  resumeGame: (): boolean => {
    const saved = loadGameState();
    if (!saved) {return false;}
    set({...saved, playerClaimOptions: [], waitingForPlayerClaim: false});
    return true;
  },

  // ── Reset game ─────────────────────────────────────────
  resetGame: () => {
    clearGameState();
    set({...initialState});
  },
}));

// ─── Auto-save & stats recording ────────────────────────────
useGameStore.subscribe((state, prevState) => {
  if (state.wall.length > 0 || state.discardPile.length > 0) {
    saveGameState(state);
  }

  if (state.turnPhase === 'gameOver' && prevState.turnPhase !== 'gameOver') {
    clearGameState();
    if (state.winner === 'player') {
      recordGameResult(state.difficulty, 'win');
    } else if (state.winner) {
      recordGameResult(state.difficulty, 'loss');
    } else {
      recordGameResult(state.difficulty, 'draw');
    }
  }
});
