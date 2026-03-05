import {create} from 'zustand';
import {
  TrashOkeyGameState,
  TrashOkeyStats,
  TrashOkeyDifficulty,
  PlayerSide,
  OkeyTile,
} from '../types/trashOkey';
import {dealTrashOkey} from '../engine/trashOkey/tileSetup';
import {
  canPlaceTile,
  placeInSlot,
  isGridComplete,
  countRevealed,
  getAvailableSlots,
  getAllFaceDownSlots,
} from '../engine/trashOkey/gridLogic';
import {chooseBotSlot, getBotDelay} from '../engine/trashOkey/botAI';
import {saveTrashOkeyStats, loadTrashOkeyStats} from '../utils/storage';

interface TrashOkeyStore extends TrashOkeyGameState {
  stats: TrashOkeyStats;

  startGame: (difficulty: TrashOkeyDifficulty) => void;
  pickUpCenterTile: () => void;
  placeTileInSlot: (row: number, col: number) => void;
  endChain: () => void;
  playBotTurn: () => Promise<void>;
  resetGame: () => void;
  loadStats: () => void;
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

  startGame: (difficulty: TrashOkeyDifficulty) => {
    const gameState = dealTrashOkey(difficulty);
    const {stats} = get();
    const newStats = {...stats};
    newStats.gamesPlayed++;
    newStats.byDifficulty[difficulty].played++;
    set({...gameState, stats: newStats});
    saveTrashOkeyStats(newStats);
  },

  pickUpCenterTile: () => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'player') return;
    if (!state.centerTile || state.chainActive) return;

    set({
      chainActive: true,
      chainLength: 0,
      currentChainTile: state.centerTile,
      centerTile: null,
    });
  },

  placeTileInSlot: (row: number, col: number) => {
    const state = get();
    if (state.status !== 'playing' || !state.chainActive || !state.currentChainTile) return;
    if (state.currentTurn !== 'player') return;

    const playerState = state.players.player;
    const slot = playerState.grid[row][col];

    // Validate: tile can go in this slot
    if (!slot.isFaceDown) return;
    const tile = state.currentChainTile;
    if (!tile.isFalseJoker && slot.targetNumber !== tile.number) return;

    const {newGrid, pickedUpTile} = placeInSlot(playerState.grid, row, col, tile);
    const newChainLength = state.chainLength + 1;
    const newLongestChain = Math.max(state.longestChain, newChainLength);
    const revealed = countRevealed(newGrid);

    const newPlayerState = {
      ...playerState,
      grid: newGrid,
      revealedCount: revealed,
    };

    // Check win
    if (isGridComplete(newGrid)) {
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
        currentChainTile: null,
        status: 'won',
        stats: newStats,
      });
      saveTrashOkeyStats(newStats);
      return;
    }

    // If picked up tile exists, continue chain or end
    if (pickedUpTile) {
      // Check if the picked up tile can be placed
      if (canPlaceTile(newGrid, pickedUpTile)) {
        set({
          players: {...state.players, player: newPlayerState},
          chainLength: newChainLength,
          longestChain: newLongestChain,
          currentChainTile: pickedUpTile,
        });
      } else {
        // Can't place — tile goes to center, turn ends
        set({
          players: {...state.players, player: newPlayerState},
          centerTile: pickedUpTile,
          chainActive: false,
          chainLength: newChainLength,
          longestChain: newLongestChain,
          currentChainTile: null,
          currentTurn: 'bot',
          turnCount: state.turnCount + 1,
        });
      }
    } else {
      // No tile to pick up (shouldn't happen in normal play)
      set({
        players: {...state.players, player: newPlayerState},
        chainActive: false,
        chainLength: newChainLength,
        longestChain: newLongestChain,
        currentChainTile: null,
        currentTurn: 'bot',
        turnCount: state.turnCount + 1,
      });
    }
  },

  endChain: () => {
    const state = get();
    if (!state.chainActive || !state.currentChainTile) return;
    if (state.currentTurn !== 'player') return; // Only player can manually end chain

    set({
      centerTile: state.currentChainTile,
      chainActive: false,
      currentChainTile: null,
      currentTurn: 'bot',
      turnCount: state.turnCount + 1,
    });
  },

  playBotTurn: async () => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'bot') return;
    if (!state.centerTile) return;

    const delay = getBotDelay(state.difficulty);

    // Bot picks up center tile
    let currentTile: OkeyTile = state.centerTile;
    let botState = state.players.bot;
    let chainLength = 0;
    let longestChain = state.longestChain;

    set({
      centerTile: null,
      chainActive: true,
      currentChainTile: currentTile,
    });

    await new Promise(r => setTimeout(r, delay));

    // Bot chain loop
    while (true) {
      const freshState = get();
      if (freshState.status !== 'playing') return;

      botState = freshState.players.bot;

      const slotChoice = chooseBotSlot(botState.grid, currentTile, freshState.difficulty);

      if (!slotChoice) {
        // Can't place — put in center, end turn
        set({
          centerTile: currentTile,
          chainActive: false,
          chainLength,
          longestChain: Math.max(longestChain, chainLength),
          currentChainTile: null,
          currentTurn: 'player',
          turnCount: freshState.turnCount + 1,
        });
        return;
      }

      const {newGrid, pickedUpTile} = placeInSlot(
        botState.grid,
        slotChoice.row,
        slotChoice.col,
        currentTile,
      );

      chainLength++;
      longestChain = Math.max(longestChain, chainLength);
      const revealed = countRevealed(newGrid);
      const newBotState = {...botState, grid: newGrid, revealedCount: revealed};

      // Check bot win
      if (isGridComplete(newGrid)) {
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
          currentChainTile: null,
          status: 'lost',
          stats: newStats,
        });
        saveTrashOkeyStats(newStats);
        return;
      }

      if (!pickedUpTile || !canPlaceTile(newGrid, pickedUpTile)) {
        // Chain ends — put picked-up tile in center (or null if none)
        set({
          players: {...freshState.players, bot: newBotState},
          centerTile: pickedUpTile ?? null,
          chainActive: false,
          chainLength,
          longestChain,
          currentChainTile: null,
          currentTurn: 'player',
          turnCount: freshState.turnCount + 1,
        });
        return;
      }

      // Continue chain
      currentTile = pickedUpTile;
      set({
        players: {...freshState.players, bot: newBotState},
        chainLength,
        longestChain,
        currentChainTile: currentTile,
      });

      await new Promise(r => setTimeout(r, delay));
    }
  },

  resetGame: () => {
    const {difficulty} = get();
    set(dealTrashOkey(difficulty));
  },
}));
