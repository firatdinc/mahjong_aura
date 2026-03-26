import AsyncStorage from '@react-native-async-storage/async-storage';
import {GameState, Difficulty} from '../types';
import {TileMatchProgress, TileMatchStats} from '../types/tileMatch';
import {TrashOkeyStats, TrashOkeyGameState as TrashOkeyGameStateType} from '../types/trashOkey';
import {CPStats} from '../types/columnPush';

// ─── Keys ────────────────────────────────────────────────────
const KEYS = {
  GAME_STATE: '@mahjong_aura/game_state',
  STATS: '@mahjong_aura/player_stats',
  TUTORIAL_COMPLETED: '@mahjong_aura/tutorial_completed',
  // Tile Match
  TM_PROGRESS: '@mahjong_aura/tile_match_progress',
  TM_STATS: '@mahjong_aura/tile_match_stats',
  // Trash Okey
  TO_GAME_STATE: '@mahjong_aura/trash_okey_game_state',
  TO_STATS: '@mahjong_aura/trash_okey_stats',
  // Column Push
  CP_STATS: '@mahjong_aura/column_push_stats',
  // Daily reward
  DAILY_REWARD_DATE: '@mahjong_aura/daily_reward_date',
  FREE_HINTS: '@mahjong_aura/free_hints',
} as const;

// ─── In-memory cache ────────────────────────────────────────
// The store calls save/load synchronously, so we keep a cache
// and write to AsyncStorage in the background.
let cachedGameState: GameState | null = null;
let cachedStats: PlayerStats | null = null;
let cachedTutorialCompleted = false;
let cachedTMProgress: TileMatchProgress | null = null;
let cachedTMStats: TileMatchStats | null = null;
let cachedTOStats: TrashOkeyStats | null = null;
let cachedCPStats: CPStats | null = null;
let cachedDailyRewardDate: string | null = null;
let cachedFreeHints = 0;
let cacheLoaded = false;

// Load cache from disk on startup
export async function initStorage(): Promise<void> {
  try {
    const [gameRaw, statsRaw, tutorialRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.GAME_STATE),
      AsyncStorage.getItem(KEYS.STATS),
      AsyncStorage.getItem(KEYS.TUTORIAL_COMPLETED),
    ]);
    if (gameRaw) {
      const parsed = JSON.parse(gameRaw) as GameState;
      cachedGameState = parsed.turnPhase === 'gameOver' ? null : parsed;
    }
    if (statsRaw) {
      cachedStats = JSON.parse(statsRaw) as PlayerStats;
    }
    cachedTutorialCompleted = tutorialRaw === 'true';

    const [tmProgressRaw, tmStatsRaw, toStatsRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.TM_PROGRESS),
      AsyncStorage.getItem(KEYS.TM_STATS),
      AsyncStorage.getItem(KEYS.TO_STATS),
    ]);
    if (tmProgressRaw) cachedTMProgress = JSON.parse(tmProgressRaw);
    if (tmStatsRaw) cachedTMStats = JSON.parse(tmStatsRaw);
    if (toStatsRaw) cachedTOStats = JSON.parse(toStatsRaw);

    const [cpStatsRaw, dailyRewardRaw, freeHintsRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.CP_STATS),
      AsyncStorage.getItem(KEYS.DAILY_REWARD_DATE),
      AsyncStorage.getItem(KEYS.FREE_HINTS),
    ]);
    if (cpStatsRaw) cachedCPStats = JSON.parse(cpStatsRaw);
    if (dailyRewardRaw) cachedDailyRewardDate = dailyRewardRaw;
    if (freeHintsRaw) cachedFreeHints = parseInt(freeHintsRaw, 10) || 0;
  } catch {
    // Silently fail
  }
  cacheLoaded = true;
}

// ─── Game State Persistence ─────────────────────────────────

export function saveGameState(state: GameState): void {
  const serializable = {
    wall: state.wall,
    discardPile: state.discardPile,
    players: state.players,
    currentTurn: state.currentTurn,
    turnPhase: state.turnPhase,
    difficulty: state.difficulty,
    lastDiscardedTile: state.lastDiscardedTile,
    lastDiscardedBy: state.lastDiscardedBy,
    winner: state.winner,
  };
  cachedGameState = serializable as GameState;
  AsyncStorage.setItem(KEYS.GAME_STATE, JSON.stringify(serializable)).catch(
    () => {},
  );
}

export function loadGameState(): GameState | null {
  return cachedGameState;
}

export function clearGameState(): void {
  cachedGameState = null;
  AsyncStorage.removeItem(KEYS.GAME_STATE).catch(() => {});
}

// ─── Player Stats ───────────────────────────────────────────

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  byDifficulty: Record<Difficulty, {played: number; wins: number}>;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  byDifficulty: {
    easy: {played: 0, wins: 0},
    medium: {played: 0, wins: 0},
    hard: {played: 0, wins: 0},
  },
};

export function loadStats(): PlayerStats {
  return cachedStats ?? {...DEFAULT_STATS};
}

export function saveStats(stats: PlayerStats): void {
  cachedStats = stats;
  AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats)).catch(() => {});
}

export function recordGameResult(
  difficulty: Difficulty,
  result: 'win' | 'loss' | 'draw',
): PlayerStats {
  const stats = loadStats();
  stats.gamesPlayed++;
  stats.byDifficulty[difficulty].played++;

  switch (result) {
    case 'win':
      stats.wins++;
      stats.byDifficulty[difficulty].wins++;
      break;
    case 'loss':
      stats.losses++;
      break;
    case 'draw':
      stats.draws++;
      break;
  }

  saveStats(stats);
  return stats;
}

export function isStorageReady(): boolean {
  return cacheLoaded;
}

// ─── Tutorial Flag ──────────────────────────────────────────

export function isTutorialCompleted(): boolean {
  return cachedTutorialCompleted;
}

export function markTutorialCompleted(): void {
  cachedTutorialCompleted = true;
  AsyncStorage.setItem(KEYS.TUTORIAL_COMPLETED, 'true').catch(() => {});
}

// ─── Tile Match Persistence ─────────────────────────────────

export function saveTileMatchProgress(progress: TileMatchProgress): void {
  cachedTMProgress = progress;
  AsyncStorage.setItem(KEYS.TM_PROGRESS, JSON.stringify(progress)).catch(() => {});
}

export function loadTileMatchProgress(): TileMatchProgress | null {
  return cachedTMProgress;
}

export function saveTileMatchStats(stats: TileMatchStats): void {
  cachedTMStats = stats;
  AsyncStorage.setItem(KEYS.TM_STATS, JSON.stringify(stats)).catch(() => {});
}

export function loadTileMatchStats(): TileMatchStats | null {
  return cachedTMStats;
}

// ─── Trash Okey Persistence ─────────────────────────────────

export function saveTrashOkeyStats(stats: TrashOkeyStats): void {
  cachedTOStats = stats;
  AsyncStorage.setItem(KEYS.TO_STATS, JSON.stringify(stats)).catch(() => {});
}

export function loadTrashOkeyStats(): TrashOkeyStats | null {
  return cachedTOStats;
}

// ─── Column Push Persistence ──────────────────────────────

export function saveColumnPushStats(stats: CPStats): void {
  cachedCPStats = stats;
  AsyncStorage.setItem(KEYS.CP_STATS, JSON.stringify(stats)).catch(() => {});
}

export function loadColumnPushStats(): CPStats | null {
  return cachedCPStats;
}

// ─── Daily Reward & Free Hints ──────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function canClaimDailyReward(): boolean {
  return cachedDailyRewardDate !== getTodayString();
}

export function claimDailyReward(): void {
  const today = getTodayString();
  cachedDailyRewardDate = today;
  cachedFreeHints += 3;
  AsyncStorage.setItem(KEYS.DAILY_REWARD_DATE, today).catch(() => {});
  AsyncStorage.setItem(KEYS.FREE_HINTS, String(cachedFreeHints)).catch(() => {});
}

export function getFreeHints(): number {
  return cachedFreeHints;
}

export function useFreeHint(): boolean {
  if (cachedFreeHints <= 0) return false;
  cachedFreeHints--;
  AsyncStorage.setItem(KEYS.FREE_HINTS, String(cachedFreeHints)).catch(() => {});
  return true;
}
