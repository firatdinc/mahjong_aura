import {Tile, Meld, MeldType} from '../../types';
import {NUMBERED_SUITS} from '../../constants/mahjong/tiles';

// ─── Tile matching helpers ──────────────────────────────────

/** Check if two tiles have the same suit and value (ignoring copy number) */
export function tilesMatch(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

/** Check if a tile is a numbered suit (can form Chows) */
export function isNumberedTile(tile: Tile): boolean {
  return NUMBERED_SUITS.includes(tile.suit);
}

// ─── Count occurrences of each tile type in a hand ──────────
type TileKey = string; // e.g. "bamboo_5"

export function tileKey(tile: Tile): TileKey {
  return `${tile.suit}_${tile.value}`;
}

export function countTiles(tiles: Tile[]): Map<TileKey, Tile[]> {
  const counts = new Map<TileKey, Tile[]>();
  for (const tile of tiles) {
    const key = tileKey(tile);
    const existing = counts.get(key) ?? [];
    existing.push(tile);
    counts.set(key, existing);
  }
  return counts;
}

// ─── Find possible Pongs from hand given a discard ──────────
// Returns the tiles from hand that would complete the Pong (2 tiles needed)
export function findPongMatch(hand: Tile[], discard: Tile): Tile[] | null {
  const matching = hand.filter(t => tilesMatch(t, discard));
  return matching.length >= 2 ? matching.slice(0, 2) : null;
}

// ─── Find possible Kongs from hand given a discard ──────────
// Returns the tiles from hand that would complete the Kong (3 tiles needed)
export function findKongMatch(hand: Tile[], discard: Tile): Tile[] | null {
  const matching = hand.filter(t => tilesMatch(t, discard));
  return matching.length >= 3 ? matching.slice(0, 3) : null;
}

// ─── Find possible Chows from hand given a discard ──────────
// Returns an array of possible Chow combinations (each is 2 tiles from hand)
export function findChowMatches(hand: Tile[], discard: Tile): Tile[][] {
  if (!isNumberedTile(discard)) {return [];}

  const val = parseInt(discard.value, 10);
  const suit = discard.suit;
  const results: Tile[][] = [];

  // Three possible sequences the discard could fit into:
  // [val-2, val-1, val], [val-1, val, val+1], [val, val+1, val+2]
  const offsets: [number, number][] = [
    [-2, -1],
    [-1, 1],
    [1, 2],
  ];

  for (const [o1, o2] of offsets) {
    const v1 = val + o1;
    const v2 = val + o2;
    if (v1 < 1 || v1 > 9 || v2 < 1 || v2 > 9) {continue;}

    const tile1 = hand.find(t => t.suit === suit && t.value === String(v1));
    const tile2 = hand.find(
      t => t.suit === suit && t.value === String(v2) && t.id !== tile1?.id,
    );

    if (tile1 && tile2) {
      results.push([tile1, tile2]);
    }
  }

  return results;
}

// ─── Find concealed Kong in hand (4 identical tiles) ────────
export function findConcealedKongs(hand: Tile[]): Tile[][] {
  const counts = countTiles(hand);
  const kongs: Tile[][] = [];
  for (const tiles of counts.values()) {
    if (tiles.length === 4) {
      kongs.push(tiles);
    }
  }
  return kongs;
}

// ─── Build a Meld object ────────────────────────────────────
export function createMeld(type: MeldType, tiles: Tile[]): Meld {
  return {type, tiles};
}
