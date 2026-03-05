import {GridSlot, OkeyTile, TrashOkeyDifficulty} from '../../types/trashOkey';
import {getAvailableSlots, getAllFaceDownSlots} from './gridLogic';

/**
 * Choose which slot the bot should place a tile in.
 */
export function chooseBotSlot(
  grid: GridSlot[][],
  tile: OkeyTile,
  difficulty: TrashOkeyDifficulty,
): {row: number; col: number} | null {
  if (tile.isFalseJoker) {
    return chooseBotJokerSlot(grid, difficulty);
  }

  const slots = getAvailableSlots(grid, tile.number);
  if (slots.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      // Random slot
      return pickRandom(slots);
    case 'medium':
      // Prefer numbers with more empty slots (more chain potential)
      return pickBySlotCount(grid, slots);
    case 'hard':
      // Strategic: pick slot that maximizes potential chain depth
      return pickStrategic(grid, slots);
    default:
      return pickRandom(slots);
  }
}

function chooseBotJokerSlot(
  grid: GridSlot[][],
  difficulty: TrashOkeyDifficulty,
): {row: number; col: number} | null {
  const faceDown = getAllFaceDownSlots(grid);
  if (faceDown.length === 0) return null;

  if (difficulty === 'easy') {
    return pickRandom(faceDown);
  }

  // Medium/Hard: put joker where most same-number slots are still face-down
  // This creates the most chain opportunities
  const numberCounts = new Map<number, number>();
  for (const slot of faceDown) {
    const count = numberCounts.get(slot.targetNumber) ?? 0;
    numberCounts.set(slot.targetNumber, count + 1);
  }

  let bestNumber = faceDown[0].targetNumber;
  let bestCount = 0;
  for (const [num, count] of numberCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestNumber = num;
    }
  }

  const bestSlots = faceDown.filter(s => s.targetNumber === bestNumber);
  return pickRandom(bestSlots);
}

function pickRandom(slots: GridSlot[]): {row: number; col: number} {
  const slot = slots[Math.floor(Math.random() * slots.length)];
  return {row: slot.row, col: slot.col};
}

function pickBySlotCount(grid: GridSlot[][], slots: GridSlot[]): {row: number; col: number} {
  // Prefer slots whose targetNumber has more face-down slots (higher chain potential)
  let best = slots[0];
  let bestCount = 0;
  for (const slot of slots) {
    let count = 0;
    for (const row of grid) {
      for (const s of row) {
        if (s.isFaceDown && s.targetNumber === slot.targetNumber) count++;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      best = slot;
    }
  }
  return {row: best.row, col: best.col};
}

function pickStrategic(grid: GridSlot[][], slots: GridSlot[]): {row: number; col: number} {
  // Hard mode: pick the slot that will reveal a tile most likely to continue the chain
  // Simulate one step ahead — prefer placing where the picked-up tile can also be placed
  let best = slots[0];
  let bestScore = -1;
  for (const slot of slots) {
    let score = 0;
    // The tile under this slot has targetNumber — if we place here, we pick up whatever's there
    // A face-down slot means we get its current hidden tile. If that tile's number has available slots, chain continues.
    const targetNum = slot.targetNumber;
    // Count how many other face-down slots exist for this target number (chain depth estimate)
    for (const row of grid) {
      for (const s of row) {
        if (s.isFaceDown && s.targetNumber === targetNum && s !== slot) score += 2;
      }
    }
    // Bonus for slots whose row/col have more face-down tiles nearby
    for (const s of grid[slot.row]) {
      if (s.isFaceDown && s !== slot) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = slot;
    }
  }
  return {row: best.row, col: best.col};
}

/**
 * Bot thinking delay (ms).
 */
export function getBotDelay(difficulty: TrashOkeyDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 600;
    case 'medium':
      return 450;
    case 'hard':
      return 350;
  }
}
