import {create} from 'zustand';
import {
  TileMatchGameState,
  TileMatchProgress,
  TileMatchStats,
  TileMatchPowerUp,
  TileMatchTile,
} from '../types/tileMatch';
import {generateLevel} from '../engine/tileMatch/levelGenerator';
import {
  computeFreeTiles,
  addToBar,
  checkWin,
  checkLoss,
  shuffleBoard,
  calculateStars,
} from '../engine/tileMatch/matchLogic';
import {
  saveTileMatchProgress,
  loadTileMatchProgress,
  saveTileMatchStats,
  loadTileMatchStats,
} from '../utils/storage';

interface TileMatchStore extends TileMatchGameState {
  progress: TileMatchProgress;
  stats: TileMatchStats;

  startLevel: (levelNumber: number) => void;
  tapTile: (tileId: string) => void;
  usePowerUp: (type: TileMatchPowerUp) => void;
  tick: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetLevel: () => void;
  nextLevel: () => void;
  loadProgress: () => void;
}

const DEFAULT_PROGRESS: TileMatchProgress = {
  currentLevel: 1,
  highestLevel: 1,
  totalStars: 0,
  starsByLevel: {},
};

const DEFAULT_STATS: TileMatchStats = {
  levelsCompleted: 0,
  highestLevel: 1,
  totalStars: 0,
  totalMatches: 0,
  bestCombo: 0,
  totalTimePlayed: 0,
  totalLevelsAttempted: 0,
};

const initialGameState = generateLevel(1);

export const useTileMatchStore = create<TileMatchStore>((set, get) => ({
  ...initialGameState,
  progress: DEFAULT_PROGRESS,
  stats: DEFAULT_STATS,

  loadProgress: () => {
    const progress = loadTileMatchProgress();
    const stats = loadTileMatchStats();
    set({
      progress: progress ?? DEFAULT_PROGRESS,
      stats: stats ?? DEFAULT_STATS,
    });
  },

  startLevel: (levelNumber: number) => {
    const gameState = generateLevel(levelNumber);
    const {stats} = get();
    const newStats = {
      ...stats,
      totalLevelsAttempted: stats.totalLevelsAttempted + 1,
    };
    set({...gameState, stats: newStats});
    saveTileMatchStats(newStats);
  },

  tapTile: (tileId: string) => {
    const state = get();
    if (state.status !== 'playing') return;

    const tile = state.board.find(t => t.id === tileId);
    if (!tile || !tile.isFree || tile.isInBar || tile.isMatched) return;

    // Move tile to bar
    const updatedBoard = state.board.map(t =>
      t.id === tileId ? {...t, isInBar: true, isFree: false} : t,
    );

    const {newBar, matched} = addToBar(state.bar, tile);

    let combo = state.combo;
    let bestCombo = state.bestCombo;
    let matchCount = state.matchCount;

    if (matched) {
      // Mark matched tiles on board
      const matchedIds = new Set(matched.map(m => m.id));
      const finalBoard = updatedBoard.map(t =>
        matchedIds.has(t.id) ? {...t, isMatched: true} : t,
      );

      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      matchCount += 1;

      // Recompute free tiles
      const freeIds = computeFreeTiles(finalBoard);
      const boardWithFree = finalBoard.map(t => ({
        ...t,
        isFree: !t.isInBar && !t.isMatched && freeIds.has(t.id),
      }));

      // Check win
      if (checkWin(boardWithFree)) {
        const stars = calculateStars(
          state.timeRemaining,
          state.level.timerSeconds,
          state.powerUpsUsed,
        );
        const {progress, stats} = get();
        const newProgress: TileMatchProgress = {
          currentLevel: Math.max(progress.currentLevel, state.level.levelNumber + 1),
          highestLevel: Math.max(progress.highestLevel, state.level.levelNumber),
          totalStars:
            progress.totalStars +
            stars -
            (progress.starsByLevel[state.level.levelNumber] ?? 0),
          starsByLevel: {
            ...progress.starsByLevel,
            [state.level.levelNumber]: Math.max(
              progress.starsByLevel[state.level.levelNumber] ?? 0,
              stars,
            ),
          },
        };
        const timePlayed = state.level.timerSeconds - state.timeRemaining;
        const newStats: TileMatchStats = {
          ...stats,
          levelsCompleted: stats.levelsCompleted + 1,
          highestLevel: Math.max(stats.highestLevel, state.level.levelNumber),
          totalStars: newProgress.totalStars,
          totalMatches: stats.totalMatches + matchCount,
          bestCombo: Math.max(stats.bestCombo, bestCombo),
          totalTimePlayed: stats.totalTimePlayed + timePlayed,
        };

        set({
          board: boardWithFree,
          bar: newBar,
          status: 'won',
          combo,
          bestCombo,
          matchCount,
          moveHistory: [...state.moveHistory, tile],
          progress: newProgress,
          stats: newStats,
        });
        saveTileMatchProgress(newProgress);
        saveTileMatchStats(newStats);
        return;
      }

      set({
        board: boardWithFree,
        bar: newBar,
        combo,
        bestCombo,
        matchCount,
        moveHistory: [...state.moveHistory, tile],
      });
    } else {
      combo = 0; // Reset combo on non-match

      // Recompute free tiles
      const freeIds = computeFreeTiles(updatedBoard);
      const boardWithFree = updatedBoard.map(t => ({
        ...t,
        isFree: !t.isInBar && !t.isMatched && freeIds.has(t.id),
      }));

      // Check loss (bar full)
      if (checkLoss(newBar)) {
        set({
          board: boardWithFree,
          bar: newBar,
          status: 'lost',
          combo,
          moveHistory: [...state.moveHistory, tile],
        });
        return;
      }

      set({
        board: boardWithFree,
        bar: newBar,
        combo,
        moveHistory: [...state.moveHistory, tile],
      });
    }
  },

  usePowerUp: (type: TileMatchPowerUp) => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.powerUps[type] <= 0) return;

    const newPowerUps = {
      ...state.powerUps,
      [type]: state.powerUps[type] - 1,
    };

    switch (type) {
      case 'undo': {
        // Undo last move — only if the tile is still in the bar (not already matched)
        if (state.moveHistory.length === 0) return;
        const lastTile = state.moveHistory[state.moveHistory.length - 1];
        const isStillInBar = state.bar.some(t => t.id === lastTile.id);
        if (!isStillInBar) return; // Tile was matched, can't undo
        const newBar = state.bar.filter(t => t.id !== lastTile.id);
        const newBoard = state.board.map(t =>
          t.id === lastTile.id ? {...t, isInBar: false} : t,
        );
        const freeIds = computeFreeTiles(newBoard);
        const boardWithFree = newBoard.map(t => ({
          ...t,
          isFree: !t.isInBar && !t.isMatched && freeIds.has(t.id),
        }));
        set({
          board: boardWithFree,
          bar: newBar,
          powerUps: newPowerUps,
          powerUpsUsed: state.powerUpsUsed + 1,
          moveHistory: state.moveHistory.slice(0, -1),
        });
        break;
      }
      case 'shuffle': {
        const shuffled = shuffleBoard(state.board);
        const freeIds = computeFreeTiles(shuffled);
        const boardWithFree = shuffled.map(t => ({
          ...t,
          isFree: !t.isInBar && !t.isMatched && freeIds.has(t.id),
        }));
        set({
          board: boardWithFree,
          powerUps: newPowerUps,
          powerUpsUsed: state.powerUpsUsed + 1,
        });
        break;
      }
      case 'remove': {
        // Remove last tile from bar (marks it as matched/gone)
        if (state.bar.length === 0) return;
        const removedTile = state.bar[state.bar.length - 1];
        const newBarR = state.bar.slice(0, -1);
        const newBoardR = state.board.map(t =>
          t.id === removedTile.id ? {...t, isInBar: false, isMatched: true} : t,
        );
        const freeIdsR = computeFreeTiles(newBoardR);
        const boardWithFreeR = newBoardR.map(t => ({
          ...t,
          isFree: !t.isInBar && !t.isMatched && freeIdsR.has(t.id),
        }));
        set({
          board: boardWithFreeR,
          bar: newBarR,
          powerUps: newPowerUps,
          powerUpsUsed: state.powerUpsUsed + 1,
        });
        break;
      }
    }
  },

  tick: () => {
    const state = get();
    if (state.status !== 'playing') return;

    const newTime = state.timeRemaining - 1;
    if (newTime <= 0) {
      set({timeRemaining: 0, status: 'lost'});
    } else {
      set({timeRemaining: newTime});
    }
  },

  pauseGame: () => set({status: 'paused'}),
  resumeGame: () => set({status: 'playing'}),

  resetLevel: () => {
    const {level} = get();
    const gameState = generateLevel(level.levelNumber);
    set(gameState);
  },

  nextLevel: () => {
    const {progress} = get();
    const nextLvl = progress.currentLevel;
    const gameState = generateLevel(nextLvl);
    set(gameState);
  },
}));
