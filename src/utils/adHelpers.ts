import {InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType} from 'react-native-google-mobile-ads';
import {AD_IDS, INTERSTITIAL_FREQUENCY} from '../constants/adConfig';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

// ─── Interstitial (game over) ─────────────────────────────
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let gamesPlayed = 0;

export function loadInterstitial() {
  try {
    interstitial = InterstitialAd.createForAdRequest(AD_IDS.INTERSTITIAL);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      loadInterstitial(); // Preload next one
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded = false;
    });
    interstitial.load();
  } catch {}
}

export function showInterstitialIfReady(): boolean {
  gamesPlayed++;
  if (gamesPlayed % INTERSTITIAL_FREQUENCY !== 0) return false;
  if (!interstitialLoaded || !interstitial) return false;
  try {
    interstitial.show();
    return true;
  } catch {
    return false;
  }
}

// ─── Rewarded (hint) ──────────────────────────────────────
let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;
let rewardedCallback: (() => void) | null = null;

export function loadRewarded() {
  try {
    rewarded = RewardedAd.createForAdRequest(AD_IDS.REWARDED);
    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
    });
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      if (rewardedCallback) {
        rewardedCallback();
        rewardedCallback = null;
      }
    });
    rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedLoaded = false;
      rewardedCallback = null;
      loadRewarded(); // Preload next one
    });
    rewarded.addAdEventListener(AdEventType.ERROR, () => {
      rewardedLoaded = false;
    });
    rewarded.load();
  } catch {}
}

export function isRewardedReady(): boolean {
  // In dev mode, always allow hints (no ad required)
  if (isDev) return true;
  return rewardedLoaded && rewarded !== null;
}

export function showRewarded(onRewarded: () => void): boolean {
  // In dev mode, skip the ad and give the hint directly
  if (isDev) {
    onRewarded();
    return true;
  }
  if (!rewardedLoaded || !rewarded) return false;
  try {
    rewardedCallback = onRewarded;
    rewarded.show();
    return true;
  } catch {
    rewardedCallback = null;
    return false;
  }
}
