import {GridSlot, TrashTile, TrashDifficulty} from '../../types/trashOkey';
import {getSlotForNumber, getUnrevealedSlots} from './gridLogic';

/**
 * Choose which slot the bot should place a tile in.
 * Returns the position (1-10) or null if can't place.
 */
export function chooseBotSlot(
  slots: GridSlot[],
  tile: TrashTile,
  difficulty: TrashDifficulty,
): number | null {
  if (tile.isJoker) {
    return chooseBotJokerSlot(slots, difficulty);
  }

  const slot = getSlotForNumber(slots, tile.number);
  if (!slot) return null;
  return slot.position;
}

function chooseBotJokerSlot(
  slots: GridSlot[],
  difficulty: TrashDifficulty,
): number | null {
  const unrevealed = getUnrevealedSlots(slots);
  if (unrevealed.length === 0) return null;

  if (difficulty === 'easy') {
    // Random unrevealed slot
    return unrevealed[Math.floor(Math.random() * unrevealed.length)].position;
  }

  // Medium/Hard: place joker on the highest position (hardest to get naturally)
  const sorted = [...unrevealed].sort((a, b) => b.position - a.position);
  if (difficulty === 'hard') {
    return sorted[0].position;
  }
  // Medium: pick from top 3
  const topN = sorted.slice(0, Math.min(3, sorted.length));
  return topN[Math.floor(Math.random() * topN.length)].position;
}

/**
 * On easy mode, bot sometimes "misses" — skips a valid placement.
 */
export function botShouldSkip(difficulty: TrashDifficulty): boolean {
  if (difficulty === 'easy') return Math.random() < 0.15;
  return false;
}

/**
 * Bot thinking delay (ms).
 */
export function getBotDelay(difficulty: TrashDifficulty): number {
  switch (difficulty) {
    case 'easy': return 800;
    case 'medium': return 550;
    case 'hard': return 400;
  }
}
