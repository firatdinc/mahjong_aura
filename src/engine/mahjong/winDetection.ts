import {Tile, PlayerState} from '../../types';
import {tileKey, isNumberedTile} from './meldUtils';

// ─── Win Detection ──────────────────────────────────────────
// A winning hand = 4 melds (Pong/Chow) + 1 pair = 14 tiles total.
// Revealed melds already count, so we only need to check the
// concealed hand for the remaining melds + pair.

/**
 * Check if a player has a winning hand.
 * The total tiles (hand + revealed meld tiles) must equal 14.
 * The concealed hand must decompose into N melds + 1 pair,
 * where N + revealedMelds.length === 4.
 */
export function checkWin(playerState: PlayerState): boolean {
  const {hand, revealedMelds} = playerState;
  const totalTiles =
    hand.length + revealedMelds.reduce((sum, m) => sum + m.tiles.length, 0);

  // Must have exactly 14 tiles to win (+ 1 extra per Kong meld, since Kong = 4 tiles not 3)
  const kongCount = revealedMelds.filter(m => m.type === 'kong').length;
  if (totalTiles !== 14 + kongCount) {return false;}

  // Number of melds still needed from concealed hand
  const meldsNeeded = 4 - revealedMelds.length;

  return canDecompose(hand, meldsNeeded);
}

/**
 * Recursively check if a set of tiles can be decomposed into
 * exactly `meldsNeeded` melds + 1 pair.
 */
function canDecompose(tiles: Tile[], meldsNeeded: number): boolean {
  // Build a frequency map: key -> count
  const freq = new Map<string, number>();
  for (const tile of tiles) {
    const key = tileKey(tile);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }

  // Try each unique tile as the pair
  const uniqueKeys = [...new Set(tiles.map(t => tileKey(t)))];

  for (const pairKey of uniqueKeys) {
    const count = freq.get(pairKey) ?? 0;
    if (count < 2) {continue;}

    // Remove the pair
    const remaining = new Map(freq);
    remaining.set(pairKey, count - 2);
    if (remaining.get(pairKey) === 0) {remaining.delete(pairKey);}

    // Try to form exactly meldsNeeded melds from the remaining
    if (canFormMelds(remaining, meldsNeeded, tiles)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the frequency map can form exactly `count` melds (Pongs or Chows).
 * Greedy + backtracking approach.
 */
function canFormMelds(
  freq: Map<string, number>,
  count: number,
  originalTiles: Tile[],
): boolean {
  if (count === 0) {
    // All melds formed — frequency map should be empty
    for (const v of freq.values()) {
      if (v > 0) {return false;}
    }
    return true;
  }

  // Find the first tile key with remaining count
  let firstKey: string | null = null;
  for (const [key, val] of freq) {
    if (val > 0) {
      firstKey = key;
      break;
    }
  }
  if (!firstKey) {return false;}

  const firstCount = freq.get(firstKey)!;

  // Try Pong (3 identical)
  if (firstCount >= 3) {
    const next = new Map(freq);
    next.set(firstKey, firstCount - 3);
    if (next.get(firstKey) === 0) {next.delete(firstKey);}
    if (canFormMelds(next, count - 1, originalTiles)) {return true;}
  }

  // Try Chow (3 consecutive of same numbered suit)
  const sampleTile = originalTiles.find(t => tileKey(t) === firstKey);
  if (sampleTile && isNumberedTile(sampleTile)) {
    const val = parseInt(sampleTile.value, 10);
    const suit = sampleTile.suit;
    const key2 = `${suit}_${val + 1}`;
    const key3 = `${suit}_${val + 2}`;

    if ((freq.get(key2) ?? 0) > 0 && (freq.get(key3) ?? 0) > 0) {
      const next = new Map(freq);
      next.set(firstKey, firstCount - 1);
      next.set(key2, (next.get(key2) ?? 0) - 1);
      next.set(key3, (next.get(key3) ?? 0) - 1);
      // Clean up zeroes
      for (const k of [firstKey, key2, key3]) {
        if (next.get(k) === 0) {next.delete(k);}
      }
      if (canFormMelds(next, count - 1, originalTiles)) {return true;}
    }
  }

  return false;
}
