// ─── Tile Definition Constants ───────────────────────────────
// Used by the engine to generate the full 144-tile set.

import {Suit, WindDirection, DragonColor} from '../../types';

/** Numbered suits: each has values 1–9, with 4 copies each */
export const NUMBERED_SUITS: Suit[] = ['bamboo', 'dot', 'character'];

/** Wind honor values (4 copies each) */
export const WIND_VALUES: WindDirection[] = ['east', 'south', 'west', 'north'];

/** Dragon honor values (4 copies each) */
export const DRAGON_VALUES: DragonColor[] = ['red', 'green', 'white'];

/** How many copies of each tile exist */
export const COPIES_PER_TILE = 4;

/** Total tiles in our simplified set (no honor tiles) */
export const TOTAL_TILES = 108;

/** Tiles dealt to each player at the start */
export const TILES_PER_HAND = 13;

/** Number of players (1 human + 3 bots) */
export const NUM_PLAYERS = 4;
