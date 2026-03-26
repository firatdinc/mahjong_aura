import {Platform} from 'react-native';

// In dev mode, use Google's official test ad unit IDs
const TEST_BANNER = 'ca-app-pub-3940256099942544/2435281174';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/4411468910';
const TEST_REWARDED = 'ca-app-pub-3940256099942544/1712485313';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const AD_IDS = {
  BANNER: isDev
    ? TEST_BANNER
    : Platform.select({
        ios: 'ca-app-pub-8571533711927103/1948468189',
        android: 'ca-app-pub-8571533711927103/1948468189',
      }) ?? '',
  INTERSTITIAL: isDev
    ? TEST_INTERSTITIAL
    : Platform.select({
        ios: 'ca-app-pub-8571533711927103/3561199651',
        android: 'ca-app-pub-8571533711927103/3561199651',
      }) ?? '',
  REWARDED: isDev
    ? TEST_REWARDED
    : Platform.select({
        ios: 'ca-app-pub-8571533711927103/5651208772',
        android: 'ca-app-pub-8571533711927103/5651208772',
      }) ?? '',
};

// Show interstitial every N games (not every single game)
export const INTERSTITIAL_FREQUENCY = 2;
