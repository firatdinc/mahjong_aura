import {InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType} from 'react-native-google-mobile-ads';
import {AppState, AppStateStatus} from 'react-native';
import {AD_IDS, INTERSTITIAL_FREQUENCY} from '../constants/adConfig';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

// ─── Ad showing state (freeze guard) ─────────────────────
let adShowing = false;

// When app returns from background while ad is showing, force cleanup
AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active' && adShowing) {
    adShowing = false;
    // Reload ads in case CLOSED event was missed
    if (!interstitialLoaded) loadInterstitial();
    if (!rewardedLoaded) loadRewarded();
  }
});

// ─── Interstitial (game over) ─────────────────────────────
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let gamesPlayed = 0;
let interstitialCloseCallback: (() => void) | null = null;

export function loadInterstitial() {
  try {
    interstitial = InterstitialAd.createForAdRequest(AD_IDS.INTERSTITIAL);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      adShowing = false;
      interstitialLoaded = false;
      if (interstitialCloseCallback) {
        interstitialCloseCallback();
        interstitialCloseCallback = null;
      }
      loadInterstitial();
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      adShowing = false;
      interstitialLoaded = false;
      if (interstitialCloseCallback) {
        interstitialCloseCallback();
        interstitialCloseCallback = null;
      }
      setTimeout(() => loadInterstitial(), 30000);
    });
    interstitial.load();
  } catch {}
}

// Shows interstitial if ready; calls onDone after ad closes (or immediately if no ad)
export function showInterstitialIfReady(onDone?: () => void): void {
  gamesPlayed++;
  if (gamesPlayed % INTERSTITIAL_FREQUENCY !== 0 || !interstitialLoaded || !interstitial) {
    onDone?.();
    return;
  }
  try {
    adShowing = true;
    interstitialCloseCallback = onDone ?? null;
    interstitial.show();
  } catch {
    adShowing = false;
    interstitialCloseCallback = null;
    onDone?.();
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
      adShowing = false;
      rewardedLoaded = false;
      rewardedCallback = null;
      loadRewarded();
    });
    rewarded.addAdEventListener(AdEventType.ERROR, () => {
      adShowing = false;
      rewardedLoaded = false;
      setTimeout(() => loadRewarded(), 30000);
    });
    rewarded.load();
  } catch {}
}

export function isRewardedReady(): boolean {
  if (isDev) return true;
  return rewardedLoaded && rewarded !== null;
}

export function showRewarded(onRewarded: () => void): boolean {
  if (isDev) {
    onRewarded();
    return true;
  }
  if (!rewardedLoaded || !rewarded) return false;
  try {
    adShowing = true;
    rewardedCallback = onRewarded;
    rewarded.show();
    return true;
  } catch {
    adShowing = false;
    rewardedCallback = null;
    return false;
  }
}
