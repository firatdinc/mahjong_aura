import {create} from 'zustand';
import {
  CPGameState,
  CPStats,
  CPDifficulty,
  CPTile,
  CPOwner,
} from '../types/columnPush';
import {dealColumnPush} from '../engine/columnPush/tileSetup';
import {
  pushTileToColumn,
  isChainByOwner,
  getValidColumnsForPlacement,
  checkWinCondition,
  countHiddenTiles,
  collectHiddenFromGrid,
  placeTileOnGrid,
  getThemeForPlayer,
} from '../engine/columnPush/gridLogic';
import {chooseBotColumn, getBotDelay, botPickFromCenter} from '../engine/columnPush/botAI';
import {saveColumnPushStats, loadColumnPushStats} from '../utils/storage';

interface ColumnPushStore extends CPGameState {
  stats: CPStats;

  startGame: (difficulty: CPDifficulty) => void;
  rollDice: () => void;
  pushTile: (colIndex: number) => void;
  playBotTurn: () => Promise<void>;
  pickCenterTile: (index: number) => void;
  loadStats: () => void;
  resetGame: () => void;
  continueGame: () => void;
}

const DEFAULT_STATS: CPStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  longestChain: 0,
  totalTurns: 0,
  byDifficulty: {
    easy: {played: 0, wins: 0},
    medium: {played: 0, wins: 0},
    hard: {played: 0, wins: 0},
  },
};

const initialState = dealColumnPush('easy');

/** Assign theme based on first non-neutral popped tile */
function assignTheme(
  poppedTile: CPTile,
  currentTurn: 'player' | 'bot',
): CPOwner | null {
  if (poppedTile.owner === 'neutral') return null;
  if (currentTurn === 'player') return poppedTile.owner;
  return poppedTile.owner === 'player' ? 'bot' : 'player';
}

/** Check if we should enter finalPick (3 or fewer hidden tiles remain) */
function shouldEnterFinalPick(
  playerGrid: CPTile[][],
  botGrid: CPTile[][],
): boolean {
  return countHiddenTiles(playerGrid, botGrid) <= 3;
}

/** Enter final pick phase: reveal all hidden tiles, collect to center */
function enterFinalPick(state: CPGameState): Partial<CPGameState> {
  const {newGrid: pGrid, hiddenTiles: pHidden} = collectHiddenFromGrid(state.playerGrid);
  const {newGrid: bGrid, hiddenTiles: bHidden} = collectHiddenFromGrid(state.botGrid);
  return {
    playerGrid: pGrid,
    botGrid: bGrid,
    centerTiles: [...pHidden, ...bHidden],
    status: 'finalPick',
    activeTile: null,
    chainLength: 0,
  };
}

/** Determine winner after final pick by counting theme tiles */
function determineWinner(
  playerGrid: CPTile[][],
  botGrid: CPTile[][],
  playerTheme: CPOwner,
): 'won' | 'lost' | 'draw' {
  const botTheme = playerTheme === 'player' ? 'bot' : 'player';
  let playerCount = 0;
  let botCount = 0;
  for (const col of playerGrid) {
    for (const tile of col) {
      if (tile.owner === playerTheme) playerCount++;
    }
  }
  for (const col of botGrid) {
    for (const tile of col) {
      if (tile.owner === botTheme) botCount++;
    }
  }
  if (playerCount > botCount) return 'won';
  if (botCount > playerCount) return 'lost';
  return 'draw';
}

function saveWinStats(stats: CPStats, state: CPGameState, result: 'won' | 'lost' | 'draw'): CPStats {
  const newStats = {
    ...stats,
    ...(result === 'won' && {wins: stats.wins + 1}),
    ...(result === 'lost' && {losses: stats.losses + 1}),
    ...(result === 'draw' && {draws: (stats.draws ?? 0) + 1}),
    longestChain: Math.max(stats.longestChain, state.playerLongestChain),
    totalTurns: stats.totalTurns + state.turnCount,
    byDifficulty: {
      ...stats.byDifficulty,
      ...(result === 'won' && {
        [state.difficulty]: {
          ...stats.byDifficulty[state.difficulty],
          wins: stats.byDifficulty[state.difficulty].wins + 1,
        },
      }),
    },
  };
  return newStats;
}

export const useColumnPushStore = create<ColumnPushStore>((set, get) => ({
  ...initialState,
  stats: DEFAULT_STATS,

  loadStats: () => {
    const stats = loadColumnPushStats();
    if (stats) set({stats});
  },

  startGame: (difficulty: CPDifficulty) => {
    const gameState = dealColumnPush(difficulty);
    const {stats} = get();
    const newStats = {...stats};
    newStats.gamesPlayed++;
    newStats.byDifficulty[difficulty].played++;
    set({...gameState, stats: newStats});
    saveColumnPushStats(newStats);
  },

  rollDice: () => {
    const state = get();
    if (state.status !== 'diceRoll') return;

    let playerRoll = Math.ceil(Math.random() * 6);
    let botRoll = Math.ceil(Math.random() * 6);

    while (playerRoll === botRoll) {
      playerRoll = Math.ceil(Math.random() * 6);
      botRoll = Math.ceil(Math.random() * 6);
    }

    const firstTurn = playerRoll > botRoll ? 'player' : 'bot';

    set({
      diceResult: {playerRoll, botRoll},
      currentTurn: firstTurn,
    });
  },

  pushTile: (colIndex: number) => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'player') return;
    if (!state.activeTile) return;

    // Validate column placement rule (same type per column)
    const placementValid = getValidColumnsForPlacement(state.playerGrid, state.activeTile);
    if (!placementValid.includes(colIndex)) return;

    const pushedTile = state.activeTile;
    const {newGrid, poppedTile} = pushTileToColumn(state.playerGrid, colIndex, pushedTile);

    // Assign theme on first non-neutral pop
    let {playerTheme} = state;
    if (!playerTheme) {
      const assigned = assignTheme(poppedTile, 'player');
      if (assigned) playerTheme = assigned;
    }

    const chainOccurred = playerTheme
      ? isChainByOwner(poppedTile, 'player', playerTheme)
      : false;
    const newChainLength = chainOccurred ? state.chainLength + 1 : 0;
    const newLongestChain = Math.max(state.longestChain, newChainLength);
    const newPlayerLongestChain = Math.max(state.playerLongestChain, newChainLength);

    // Check win
    if (playerTheme && checkWinCondition(newGrid, playerTheme)) {
      const {stats} = get();
      const newStats = {
        ...stats,
        wins: stats.wins + 1,
        longestChain: Math.max(stats.longestChain, newPlayerLongestChain),
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
        playerGrid: newGrid,
        activeTile: null,
        chainLength: newChainLength,
        longestChain: newLongestChain,
        playerLongestChain: newPlayerLongestChain,
        playerTheme,
        status: 'won',
        stats: newStats,
      });
      saveColumnPushStats(newStats);
      return;
    }

    // Check final pick (3 or fewer hidden tiles)
    if (shouldEnterFinalPick(newGrid, state.botGrid)) {
      const finalState = enterFinalPick({
        ...state,
        playerGrid: newGrid,
        playerTheme,
        longestChain: newLongestChain,
      });
      set({...finalState, playerTheme, longestChain: newLongestChain});
      return;
    }

    if (chainOccurred) {
      set({
        playerGrid: newGrid,
        activeTile: poppedTile,
        chainLength: newChainLength,
        longestChain: newLongestChain,
        playerLongestChain: newPlayerLongestChain,
        playerTheme,
      });
    } else {
      set({
        playerGrid: newGrid,
        activeTile: poppedTile,
        chainLength: 0,
        longestChain: newLongestChain,
        playerLongestChain: newPlayerLongestChain,
        currentTurn: 'bot',
        turnCount: state.turnCount + 1,
        playerTheme,
      });
    }
  },

  playBotTurn: async () => {
    const state = get();
    if (state.status !== 'playing' || state.currentTurn !== 'bot') return;
    if (!state.activeTile) return;

    const delay = getBotDelay(state.difficulty);
    let currentTile: CPTile = state.activeTile;
    let botGrid = state.botGrid;
    let chainLength = 0;
    let longestChain = state.longestChain;
    let isInChain = false;
    let {playerTheme} = state;

    const botTheme: CPOwner = playerTheme
      ? getThemeForPlayer('bot', playerTheme)
      : 'bot';

    await new Promise(r => setTimeout(r, delay));

    while (true) {
      const freshState = get();
      if (freshState.status !== 'playing') return;

      botGrid = freshState.botGrid;
      playerTheme = freshState.playerTheme;

      const currentBotTheme: CPOwner = playerTheme
        ? getThemeForPlayer('bot', playerTheme)
        : botTheme;

      const colIndex = chooseBotColumn(botGrid, currentTile, freshState.difficulty, isInChain, currentBotTheme);
      const {newGrid, poppedTile} = pushTileToColumn(botGrid, colIndex, currentTile);

      // Assign theme on first non-neutral pop (by bot)
      if (!playerTheme) {
        const assigned = assignTheme(poppedTile, 'bot');
        if (assigned) playerTheme = assigned;
      }

      const updatedBotTheme: CPOwner = playerTheme
        ? getThemeForPlayer('bot', playerTheme)
        : 'bot';

      // Check bot win
      if (playerTheme && checkWinCondition(newGrid, updatedBotTheme)) {
        const {stats} = get();
        const newStats = {
          ...stats,
          losses: stats.losses + 1,
          longestChain: Math.max(stats.longestChain, longestChain),
          totalTurns: stats.totalTurns + freshState.turnCount + 1,
          byDifficulty: {
            ...stats.byDifficulty,
            [freshState.difficulty]: {
              ...stats.byDifficulty[freshState.difficulty],
            },
          },
        };
        set({
          botGrid: newGrid,
          activeTile: null,
          chainLength,
          longestChain,
          playerTheme,
          status: 'lost',
          stats: newStats,
        });
        saveColumnPushStats(newStats);
        return;
      }

      // Check final pick
      if (shouldEnterFinalPick(freshState.playerGrid, newGrid)) {
        const finalState = enterFinalPick({
          ...freshState,
          botGrid: newGrid,
          playerTheme,
          longestChain: Math.max(longestChain, chainLength),
        });
        set({...finalState, playerTheme, longestChain: Math.max(longestChain, chainLength)});
        return;
      }

      const chainOccurred = playerTheme
        ? isChainByOwner(poppedTile, 'bot', playerTheme)
        : false;

      if (chainOccurred) {
        chainLength++;
        longestChain = Math.max(longestChain, chainLength);
        currentTile = poppedTile;
        isInChain = true;

        set({
          botGrid: newGrid,
          activeTile: currentTile,
          chainLength,
          longestChain,
          playerTheme,
        });

        await new Promise(r => setTimeout(r, delay));
      } else {
        set({
          botGrid: newGrid,
          activeTile: poppedTile,
          chainLength: 0,
          longestChain: Math.max(longestChain, chainLength),
          currentTurn: 'player',
          turnCount: freshState.turnCount + 1,
          playerTheme,
        });
        return;
      }
    }
  },

  pickCenterTile: (index: number) => {
    const state = get();
    if (state.status !== 'finalPick') return;
    if (!state.playerTheme) return;

    const centerTiles = [...state.centerTiles];
    if (index < 0 || index >= centerTiles.length) return;

    const pickedTile = centerTiles[index];
    centerTiles.splice(index, 1);

    // Place on player's grid if it matches player's theme
    let playerGrid = state.playerGrid;
    if (pickedTile.owner === state.playerTheme) {
      playerGrid = placeTileOnGrid(playerGrid, pickedTile, state.playerTheme);
    }

    // Check player win
    if (checkWinCondition(playerGrid, state.playerTheme)) {
      const {stats} = get();
      const newStats = saveWinStats(stats, state, 'won');
      set({playerGrid, centerTiles, status: 'won', stats: newStats});
      saveColumnPushStats(newStats);
      return;
    }

    // Bot picks if tiles remain
    let botGrid = state.botGrid;
    if (centerTiles.length > 0) {
      const botTheme = getThemeForPlayer('bot', state.playerTheme);
      const botIdx = botPickFromCenter(centerTiles, botTheme);
      const botPicked = centerTiles[botIdx];
      centerTiles.splice(botIdx, 1);

      if (botPicked.owner === botTheme) {
        botGrid = placeTileOnGrid(botGrid, botPicked, botTheme);
      }

      // Check bot win
      if (checkWinCondition(botGrid, botTheme)) {
        const {stats} = get();
        const newStats = saveWinStats(stats, state, 'lost');
        set({playerGrid, botGrid, centerTiles, status: 'lost', stats: newStats});
        saveColumnPushStats(newStats);
        return;
      }
    }

    set({playerGrid, botGrid, centerTiles});

    // If all tiles picked, determine winner by count
    if (centerTiles.length === 0) {
      const result = determineWinner(playerGrid, botGrid, state.playerTheme);
      const {stats} = get();
      const newStats = saveWinStats(stats, state, result);
      set({status: result, stats: newStats});
      saveColumnPushStats(newStats);
    }
  },

  continueGame: () => {
    const state = get();
    if (state.status !== 'lost') return;
    // Resume with dice roll so player gets a new active tile
    set({status: 'diceRoll', currentTurn: 'player', activeTile: null});
  },

  resetGame: () => {
    set(dealColumnPush('easy'));
  },
}));
