import {ImageSourcePropType} from 'react-native';

// ─── Mahjong / Tile Match Tile Images ────────────────────────
// Keyed by `${suit}_${value}`, e.g. 'bamboo_1', 'wind_east', 'dragon_red'

export const TILE_IMAGES: Record<string, ImageSourcePropType> = {
  // Bamboo 1-9 -> Tools
  bamboo_1: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Sword.png'),
  bamboo_2: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Axe.png'),
  bamboo_3: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Hammer.png'),
  bamboo_4: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Bow.png'),
  bamboo_5: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Shield.png'),
  bamboo_6: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Knife.png'),
  bamboo_7: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Crossbow.png'),
  bamboo_8: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Pickaxe.png'),
  bamboo_9: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Arrows.png'),

  // Dot 1-9 -> Resources
  dot_1: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Coin.png'),
  dot_2: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Gem.png'),
  dot_3: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Gold.png'),
  dot_4: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Apple.png'),
  dot_5: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Bread.png'),
  dot_6: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Wheat.png'),
  dot_7: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Iron.png'),
  dot_8: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Coal.png'),
  dot_9: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Stone.png'),

  // Character 1-9 -> Other
  character_1: require('../../assets/game/Game_3D_Pack/PNGs/Other/Chest.png'),
  character_2: require('../../assets/game/Game_3D_Pack/PNGs/Other/Helmet.png'),
  character_3: require('../../assets/game/Game_3D_Pack/PNGs/Other/Armor.png'),
  character_4: require('../../assets/game/Game_3D_Pack/PNGs/Other/Map.png'),
  character_5: require('../../assets/game/Game_3D_Pack/PNGs/Other/Backpack.png'),
  character_6: require('../../assets/game/Game_3D_Pack/PNGs/Other/Ring.png'),
  character_7: require('../../assets/game/Game_3D_Pack/PNGs/Other/Flag.png'),
  character_8: require('../../assets/game/Game_3D_Pack/PNGs/Other/Torch.png'),
  character_9: require('../../assets/game/Game_3D_Pack/PNGs/Other/Skull.png'),

  // Wind honors
  wind_east: require('../../assets/game/Game_3D_Pack/PNGs/Other/Fireball.png'),
  wind_south: require('../../assets/game/Game_3D_Pack/PNGs/Other/Fire-barrel.png'),
  wind_west: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Bomb.png'),
  wind_north: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Dynamite.png'),

  // Dragon honors
  dragon_red: require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Crown.png'),
  dragon_green: require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Star.png'),
  dragon_white: require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Trophy.png'),
};

/** Get image for a Mahjong/TileMatch tile by suit and value */
export function getTileImage(suit: string, value: string): ImageSourcePropType | null {
  const key = `${suit}_${value}`;
  return TILE_IMAGES[key] ?? null;
}

// ─── Trash Okey Tile Images ──────────────────────────────────
// Indexed by tile number (1-12)

export const OKEY_TILE_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Key.png'),
  2: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Gun.png'),
  3: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Hoe.png'),
  4: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Lighter.png'),
  5: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Magic-Wand.png'),
  6: require('../../assets/game/Game_3D_Pack/PNGs/Tools/Shotgun.png'),
  7: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Loot.png'),
  8: require('../../assets/game/Game_3D_Pack/PNGs/Resources/Wood.png'),
  9: require('../../assets/game/Game_3D_Pack/PNGs/Other/Bone.png'),
  10: require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Meat.png'),
  11: require('../../assets/game/Game_3D_Pack/PNGs/Other/First-aid-kit.png'),
  12: require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Book.png'),
};

// ─── Column Push (Seaside Escape) Tile Images ────────────────

/** Player theme: Potions & Magic (indexed 0-7) */
export const CP_PLAYER_IMAGES: ImageSourcePropType[] = [
  require('../../assets/game/Game_3D_Pack/PNGs/Resources/Elixir.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Resources/Elixir-2.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Resources/Poison.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Resources/Red-mushroom.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Energy.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Hearth.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Hearth-broken.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Other/Military-suit.png'),
];

/** Bot theme: Military & Warfare (indexed 0-7) */
export const CP_BOT_IMAGES: ImageSourcePropType[] = [
  require('../../assets/game/Game_3D_Pack/PNGs/Tools/Automatic-gun.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Tools/Machine-gun.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Tools/Bazooka.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Tools/Grenade.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Tools/Compass.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Other/Tank.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Other/Bone.png'),
  require('../../assets/game/Game_3D_Pack/PNGs/Other/Backpack.png'),
];

/** Neutral starting tile */
export const CP_NEUTRAL_IMAGE: ImageSourcePropType =
  require('../../assets/game/Game_3D_Pack/PNGs/UI Elements/Star.png');
