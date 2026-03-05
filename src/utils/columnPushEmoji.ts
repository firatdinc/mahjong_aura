import {ImageSourcePropType} from 'react-native';
import {CPTile} from '../types/columnPush';
import {CP_PLAYER_IMAGES, CP_BOT_IMAGES, CP_NEUTRAL_IMAGE} from '../constants/gameAssets';

export function getImageForTile(tile: CPTile): ImageSourcePropType {
  if (tile.owner === 'neutral') return CP_NEUTRAL_IMAGE;
  if (tile.owner === 'player') return CP_PLAYER_IMAGES[tile.typeIndex] ?? CP_NEUTRAL_IMAGE;
  return CP_BOT_IMAGES[tile.typeIndex] ?? CP_NEUTRAL_IMAGE;
}

// Keep old name as alias for backwards compat during transition
export const getEmojiForTile = getImageForTile;
