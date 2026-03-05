import {TileMatchTile} from '../../types/tileMatch';

// Available tile types — reusing Mahjong tile types
const ALL_TILE_TYPES = [
  {type: 'bamboo_1', suit: 'bamboo', value: '1'},
  {type: 'bamboo_2', suit: 'bamboo', value: '2'},
  {type: 'bamboo_3', suit: 'bamboo', value: '3'},
  {type: 'bamboo_4', suit: 'bamboo', value: '4'},
  {type: 'bamboo_5', suit: 'bamboo', value: '5'},
  {type: 'bamboo_6', suit: 'bamboo', value: '6'},
  {type: 'bamboo_7', suit: 'bamboo', value: '7'},
  {type: 'bamboo_8', suit: 'bamboo', value: '8'},
  {type: 'bamboo_9', suit: 'bamboo', value: '9'},
  {type: 'dot_1', suit: 'dot', value: '1'},
  {type: 'dot_2', suit: 'dot', value: '2'},
  {type: 'dot_3', suit: 'dot', value: '3'},
  {type: 'dot_4', suit: 'dot', value: '4'},
  {type: 'dot_5', suit: 'dot', value: '5'},
  {type: 'dot_6', suit: 'dot', value: '6'},
  {type: 'dot_7', suit: 'dot', value: '7'},
  {type: 'dot_8', suit: 'dot', value: '8'},
  {type: 'dot_9', suit: 'dot', value: '9'},
  {type: 'character_1', suit: 'character', value: '1'},
  {type: 'character_2', suit: 'character', value: '2'},
  {type: 'character_3', suit: 'character', value: '3'},
  {type: 'character_4', suit: 'character', value: '4'},
  {type: 'character_5', suit: 'character', value: '5'},
  {type: 'character_6', suit: 'character', value: '6'},
  {type: 'character_7', suit: 'character', value: '7'},
  {type: 'character_8', suit: 'character', value: '8'},
  {type: 'character_9', suit: 'character', value: '9'},
  {type: 'wind_east', suit: 'wind', value: 'east'},
  {type: 'wind_south', suit: 'wind', value: 'south'},
  {type: 'wind_west', suit: 'wind', value: 'west'},
  {type: 'wind_north', suit: 'wind', value: 'north'},
  {type: 'dragon_red', suit: 'dragon', value: 'red'},
  {type: 'dragon_green', suit: 'dragon', value: 'green'},
  {type: 'dragon_white', suit: 'dragon', value: 'white'},
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a pool of tiles for a level.
 * Each type appears exactly 3 times (for matching).
 * totalTiles must be divisible by 3.
 */
export function generateTilePool(
  tileTypes: number,
  totalTiles: number,
): Omit<TileMatchTile, 'layer' | 'row' | 'col' | 'isFree'>[] {
  const groupsNeeded = totalTiles / 3;
  const selectedTypes = shuffle(ALL_TILE_TYPES).slice(0, tileTypes);

  const tiles: Omit<TileMatchTile, 'layer' | 'row' | 'col' | 'isFree'>[] = [];
  let idCounter = 0;

  for (let g = 0; g < groupsNeeded; g++) {
    const tileType = selectedTypes[g % selectedTypes.length];
    for (let c = 0; c < 3; c++) {
      tiles.push({
        id: `tm_${idCounter++}`,
        type: tileType.type,
        suit: tileType.suit,
        value: tileType.value,
        isInBar: false,
        isMatched: false,
      });
    }
  }

  return shuffle(tiles);
}
