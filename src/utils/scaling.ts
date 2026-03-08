import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 375;

const ratio = SCREEN_WIDTH / BASE_WIDTH;

/** Scale linearly with screen width */
export const scale = (size: number) => Math.round(size * ratio);

/** Scale moderately – factor 0 = no scaling, 1 = linear scaling */
export const ms = (size: number, factor = 0.5) =>
  Math.round(size + (size * ratio - size) * factor);

/** Responsive modal/content width: scales up on tablet, capped at 85% screen */
export const modalWidth = (base: number) =>
  Math.min(ms(base, 0.4), SCREEN_WIDTH * 0.85);

/** Responsive max-width for content containers */
export const contentMaxWidth = (base: number) =>
  Math.min(ms(base, 0.6), SCREEN_WIDTH * 0.9);

export const isTablet = SCREEN_WIDTH >= 768;
