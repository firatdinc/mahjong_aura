import {create} from 'zustand';
import {
  TrashGameState,
  TrashOkeyStats,
  TrashDifficulty,
  TrashTile,
} from '../types/trashOkey';
import {dealTrashOkey} from '../engine/trashOkey/tileSetup';
import {
  canPlaceTile,
  placeTileInSlot,
  isGridComplete,
  countRevealed,
} from '../engine/trashOkey/gridLogic';
import {chooseBotSlot, botShouldSkip, getBotDelay} from '../engine/trashOkey/botAI';
import {saveTrashOkeyStats, loadTrashOkeyStats} from '../utils/storage';

interface TrashOkeyStore extends TrashGameState {
  stats: TrashOkeyStats;

  startGame: (difficulty: TrashDifficulty) => void;
  drawFromPile: () => void;
  drawFromDiscard: () => void;
  placeDrawnTile: (position: number) => void;
  discardDrawnTile: () => void;
  playBotTurn: () => Promise<void>;
  resetGame: () => void;
  loadStats: () => void;
  continueGame: () => void;

  // Keep old API names for router compatibility
  pickUpCenterTile: () => void;
  placeTileInSlot: (row: number, col: number) => void;
  endChain: () => void;
}

const DEFAULT_STATS: TrashOkeyStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  longestChain: 0,
  totalTurns: 0,
  byDifficulty: {
    easy: {played: 0, wins: 0},
    medium: {played: 0, wins: 0},
    hard: {played: 0, wins: 0},
  },
};

const initialState = dealTrashOkey('easy');

export const useTrashOkeyStore = create<TrashOkeyStore>((set, get) => ({
  ...initialState,
  stats: DEFAULT_STATS,

  loadStats: () => {
    const stats = loadTrashOkeyStats();
    if (stats) set({stats});
  },

  startGame: (difficulty: TrashDifficulty) => {
    const gameState = dealTrashOkey(difficulty);
    const {stats} = get();
    const newStats = {...stats};
    newStats.gamesPlayed++;
    newStats.byDifficulty[difficulty].played++;
    set({...gameState, stats: newStats});
    saveTrashOkeyStats(newStats);
  },

  drawFromPile: () => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'player') return;
    if (state.drawnTile || state.chainActive) return;

    let newPile = [...state.drawPile];

    // If draw pile is empty, reshuffle discard pile (except top card) into draw pile
    if (newPile.length === 0) {
      if (state.discardPile.length <= 1) {
        // Nothing to reshuffle — skip turn
        set({currentTurn: 'bot', turnCount: state.turnCount + 1});
        return;
      }
      const newDiscard = [state.discardPile[state.discardPile.length - 1]];
      const toShuffle = state.discardPile.slice(0, -1);
      // Shuffle
      for (let i = toShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
      }
      newPile = toShuffle;
      set({discardPile: newDiscard});
    }

    const drawn = newPile.pop()!;

    set({
      drawPile: newPile,
      drawnTile: drawn,
      chainActive: true,
      chainLength: 0,
    });
  },

  drawFromDiscard: () => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'player') return;
    if (state.drawnTile || state.chainActive) return;
    if (state.discardPile.length === 0) return;

    const topDiscard = state.discardPile[state.discardPile.length - 1];
    // Only pick from discard if it can be placed
    if (!canPlaceTile(state.players.player.slots, topDiscard)) return;

    const newDiscard = state.discardPile.slice(0, -1);

    set({
      discardPile: newDiscard,
      drawnTile: topDiscard,
      chainActive: true,
      chainLength: 0,
    });
  },

  placeDrawnTile: (position: number) => {
    const state = get();
    if (state.status !== 'playing' || !state.chainActive || !state.drawnTile) return;
    if (state.currentTurn !== 'player') return;

    const playerSlots = state.players.player.slots;
    const tile = state.drawnTile;

    // Validate
    const slot = playerSlots.find(s => s.position === position);
    if (!slot || slot.isRevealed) return;
    if (!tile.isJoker && slot.position !== tile.number) return;

    const {newSlots, displacedTile} = placeTileInSlot(playerSlots, position, tile);
    const newChainLength = state.chainLength + 1;
    const newLongestChain = Math.max(state.longestChain, newChainLength);
    const revealed = countRevealed(newSlots);

    const newPlayerState = {
      ...state.players.player,
      slots: newSlots,
      revealedCount: revealed,
    };

    // Check win
    if (isGridComplete(newSlots)) {
      const {stats} = get();
      const newStats = {
        ...stats,
        wins: stats.wins + 1,
        longestChain: Math.max(stats.longestChain, newLongestChain),
        totalTurns: stats.totalTurns + state.turnCount + 1,
        byDifficulty: {
          ...stats.byDifficulty,
          [state.difficulty]: {
            ...stats.byDifficulty[state.difficulty],
            wins: stats.byDifficulty[state.difficulty].wins + 1,
          },
        },
      };
      set({
        players: {...state.players, player: newPlayerState},
        chainActive: false,
        chainLength: newChainLength,
        longestChain: newLongestChain,
        drawnTile: null,
        status: 'won',
        stats: newStats,
      });
      saveTrashOkeyStats(newStats);
      return;
    }

    // Continue chain with displaced tile or end turn
    if (displacedTile && canPlaceTile(newSlots, displacedTile)) {
      set({
        players: {...state.players, player: newPlayerState},
        chainLength: newChainLength,
        longestChain: newLongestChain,
        drawnTile: displacedTile,
      });
    } else {
      // Can't continue — discard displaced tile, end turn
      const newDiscard = [...state.discardPile];
      if (displacedTile) newDiscard.push(displacedTile);

      set({
        players: {...state.players, player: newPlayerState},
        discardPile: newDiscard,
        chainActive: false,
        chainLength: newChainLength,
        longestChain: newLongestChain,
        drawnTile: null,
        currentTurn: 'bot',
        turnCount: state.turnCount + 1,
      });
    }
  },

  discardDrawnTile: () => {
    const state = get();
    if (state.status !== 'playing' || !state.drawnTile) return;
    if (state.currentTurn !== 'player') return;

    const newDiscard = [...state.discardPile, state.drawnTile];
    set({
      discardPile: newDiscard,
      drawnTile: null,
      chainActive: false,
      currentTurn: 'bot',
      turnCount: state.turnCount + 1,
    });
  },

  playBotTurn: async () => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'bot') return;
    if (state.drawPile.length === 0 && state.discardPile.length === 0) {
      // No tiles left — turn passes
      set({currentTurn: 'player', turnCount: state.turnCount + 1});
      return;
    }

    const delay = getBotDelay(state.difficulty);
    await new Promise(r => setTimeout(r, delay));

    let freshState = get();
    if (freshState.status !== 'playing') return;

    // Bot tries discard first (medium/hard), then draw pile
    let currentTile: TrashTile | null = null;
    let newDrawPile = [...freshState.drawPile];
    let newDiscardPile = [...freshState.discardPile];

    if (freshState.difficulty !== 'easy' && newDiscardPile.length > 0) {
      const topDiscard = newDiscardPile[newDiscardPile.length - 1];
      if (canPlaceTile(freshState.players.bot.slots, topDiscard)) {
        currentTile = newDiscardPile.pop()!;
      }
    }

    if (!currentTile) {
      // If draw pile is empty, reshuffle discard (except top) into draw pile
      if (newDrawPile.length === 0) {
        if (newDiscardPile.length <= 1) {
          set({currentTurn: 'player', turnCount: freshState.turnCount + 1});
          return;
        }
        const topCard = newDiscardPile[newDiscardPile.length - 1];
        const toShuffle = newDiscardPile.slice(0, -1);
        for (let i = toShuffle.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
        }
        newDrawPile = toShuffle;
        newDiscardPile = [topCard];
      }
      currentTile = newDrawPile.pop()!;
    }

    set({drawPile: newDrawPile, discardPile: newDiscardPile, chainActive: true, drawnTile: currentTile});

    let botSlots = freshState.players.bot.slots;
    let chainLength = 0;
    let longestChain = freshState.longestChain;

    // Chain loop
    while (currentTile) {
      await new Promise(r => setTimeout(r, delay));

      freshState = get();
      if (freshState.status !== 'playing') return;
      botSlots = freshState.players.bot.slots;

      // Easy mode: sometimes skip
      if (botShouldSkip(freshState.difficulty)) {
        newDiscardPile = [...freshState.discardPile, currentTile];
        set({
          discardPile: newDiscardPile,
          chainActive: false,
          chainLength,
          longestChain: Math.max(longestChain, chainLength),
          drawnTile: null,
          currentTurn: 'player',
          turnCount: freshState.turnCount + 1,
        });
        return;
      }

      const position = chooseBotSlot(botSlots, currentTile, freshState.difficulty);

      if (!position) {
        // Can't place — discard and end turn
        newDiscardPile = [...freshState.discardPile, currentTile];
        set({
          discardPile: newDiscardPile,
          chainActive: false,
          chainLength,
          longestChain: Math.max(longestChain, chainLength),
          drawnTile: null,
          currentTurn: 'player',
          turnCount: freshState.turnCount + 1,
        });
        return;
      }

      const {newSlots, displacedTile} = placeTileInSlot(botSlots, position, currentTile);
      chainLength++;
      longestChain = Math.max(longestChain, chainLength);
      const revealed = countRevealed(newSlots);
      const newBotState = {...freshState.players.bot, slots: newSlots, revealedCount: revealed};

      // Check bot win
      if (isGridComplete(newSlots)) {
        const {stats} = get();
        const newStats = {
          ...stats,
          losses: stats.losses + 1,
          longestChain: Math.max(stats.longestChain, longestChain),
          totalTurns: stats.totalTurns + freshState.turnCount + 1,
        };
        set({
          players: {...freshState.players, bot: newBotState},
          chainActive: false,
          chainLength,
          longestChain,
          drawnTile: null,
          status: 'lost',
          stats: newStats,
        });
        saveTrashOkeyStats(newStats);
        return;
      }

      if (!displacedTile || !canPlaceTile(newSlots, displacedTile)) {
        newDiscardPile = [...freshState.discardPile];
        if (displacedTile) newDiscardPile.push(displacedTile);
        set({
          players: {...freshState.players, bot: newBotState},
          discardPile: newDiscardPile,
          chainActive: false,
          chainLength,
          longestChain,
          drawnTile: null,
          currentTurn: 'player',
          turnCount: freshState.turnCount + 1,
        });
        return;
      }

      // Continue chain
      currentTile = displacedTile;
      set({
        players: {...freshState.players, bot: newBotState},
        chainLength,
        longestChain,
        drawnTile: currentTile,
      });
    }
  },

  continueGame: () => {
    const state = get();
    if (state.status !== 'lost') return;
    // Reveal 2 random unrevealed player slots
    const unrevealed = state.players.player.slots.filter(s => !s.isRevealed);
    const toReveal = unrevealed.slice(0, 2);
    if (toReveal.length === 0) return;
    const newSlots = state.players.player.slots.map(s => {
      if (toReveal.some(r => r.position === s.position)) {
        return {...s, isRevealed: true};
      }
      return s;
    });
    const revealedCount = newSlots.filter(s => s.isRevealed).length;
    set({
      status: 'playing',
      currentTurn: 'player',
      players: {
        ...state.players,
        player: {...state.players.player, slots: newSlots, revealedCount},
      },
    });
  },

  resetGame: () => {
    const {difficulty} = get();
    set(dealTrashOkey(difficulty));
  },

  // Legacy API compatibility
  pickUpCenterTile: () => get().drawFromPile(),
  placeTileInSlot: (_row: number, col: number) => get().placeDrawnTile(col + 1),
  endChain: () => get().discardDrawnTile(),
}));
