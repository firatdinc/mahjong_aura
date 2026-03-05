// ─── Game Configuration Constants ────────────────────────────

import {SeatId} from '../../types';

/** Turn order: player -> bot1 -> bot2 -> bot3 -> player ... */
export const TURN_ORDER: SeatId[] = ['player', 'bot1', 'bot2', 'bot3'];

/** Bot thinking delay range (ms) */
export const BOT_THINK_MIN_MS = 1000;
export const BOT_THINK_MAX_MS = 2500;

/** Labels for display (English fallback) */
export const SEAT_LABELS: Record<SeatId, string> = {
  player: 'You',
  bot1: 'Left',
  bot2: 'Top',
  bot3: 'Right',
};

/** Get translated seat label */
export function getSeatLabel(
  seatId: SeatId,
  t: {you: string; left: string; top: string; right: string},
): string {
  const map: Record<SeatId, string> = {
    player: t.you,
    bot1: t.left,
    bot2: t.top,
    bot3: t.right,
  };
  return map[seatId];
}
