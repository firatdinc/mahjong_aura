import {GridSlot, TrashTile} from '../../types/trashOkey';

/**
 * Find the slot for a given number (1-10). Returns null if already revealed.
 */
export function getSlotForNumber(slots: GridSlot[], number: number): GridSlot | null {
  const slot = slots.find(s => s.position === number);
  if (!slot || slot.isRevealed) return null;
  return slot;
}

/**
 * Check if a tile can be placed anywhere.
 */
export function canPlaceTile(slots: GridSlot[], tile: TrashTile): boolean {
  if (tile.isJoker) {
    return slots.some(s => !s.isRevealed);
  }
  return getSlotForNumber(slots, tile.number) !== null;
}

/**
 * Place a tile in its matching slot. Returns the displaced tile.
 */
export function placeTileInSlot(
  slots: GridSlot[],
  position: number,
  tile: TrashTile,
): {newSlots: GridSlot[]; displacedTile: TrashTile | null} {
  const newSlots = slots.map(s => ({...s, tile: s.tile ? {...s.tile} : null}));
  const slot = newSlots.find(s => s.position === position);
  if (!slot) return {newSlots, displacedTile: null};

  const displacedTile = slot.tile;
  slot.tile = tile;
  slot.isRevealed = true;

  return {newSlots, displacedTile};
}

/**
 * Check if all slots are revealed (win condition).
 */
export function isGridComplete(slots: GridSlot[]): boolean {
  return slots.every(s => s.isRevealed);
}

/**
 * Count revealed slots.
 */
export function countRevealed(slots: GridSlot[]): number {
  return slots.filter(s => s.isRevealed).length;
}

/**
 * Get all unrevealed slots (for joker placement).
 */
export function getUnrevealedSlots(slots: GridSlot[]): GridSlot[] {
  return slots.filter(s => !s.isRevealed);
}

// Keep old exports for compatibility
export function getAvailableSlots(slots: GridSlot[], number: number): GridSlot[] {
  const slot = getSlotForNumber(slots, number);
  return slot ? [slot] : [];
}

export function getAllFaceDownSlots(slots: GridSlot[]): GridSlot[] {
  return getUnrevealedSlots(slots);
}

export function placeInSlot(
  slots: GridSlot[],
  _row: number,
  col: number,
  tile: TrashTile,
): {newGrid: GridSlot[]; pickedUpTile: TrashTile | null} {
  const position = col + 1;
  const {newSlots, displacedTile} = placeTileInSlot(slots, position, tile);
  return {newGrid: newSlots, pickedUpTile: displacedTile};
}
