import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812; // iPhone X

const ratio = SCREEN_WIDTH / BASE_WIDTH;
const vRatio = SCREEN_HEIGHT / BASE_HEIGHT;

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

/** Scale based on screen height – shrinks on small phones, grows on tall ones */
export const vs = (size: number, factor = 0.5) =>
  Math.round(size + (size * vRatio - size) * factor);

export const isSmallScreen = SCREEN_HEIGHT < 700;

export const isTablet = SCREEN_WIDTH >= 768;
