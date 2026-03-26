import {InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType} from 'react-native-google-mobile-ads';
import {AppState, AppStateStatus} from 'react-native';
import {AD_IDS, INTERSTITIAL_FREQUENCY} from '../constants/adConfig';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

// ─── Ad showing state (freeze guard) ─────────────────────
let adShowing = false;

AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active') {
    // Always reset adShowing when app becomes active
    adShowing = false;
    // Reload ads if needed
    if (!interstitialLoaded && !interstitialLoading) loadInterstitial();
    if (!rewardedLoaded && !rewardedLoading) loadRewarded();
  }
});

// ─── Interstitial (game over) ─────────────────────────────
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let interstitialLoading = false;
let gamesPlayed = 0;
let interstitialCloseCallback: (() => void) | null = null;
let interstitialUnsubscribers: (() => void)[] = [];

function cleanupInterstitial() {
  const unsubs = interstitialUnsubscribers;
  interstitialUnsubscribers = [];
  interstitial = null;
  interstitialLoaded = false;
  interstitialLoading = false;
  // Unsubscribe after clearing references to avoid re-entrancy
  unsubs.forEach(unsub => { try { unsub(); } catch {} });
}

export function loadInterstitial() {
  if (interstitialLoading || interstitialLoaded) return;
  try {
    cleanupInterstitial();
    interstitialLoading = true;
    const ad = InterstitialAd.createForAdRequest(AD_IDS.INTERSTITIAL);

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
      interstitialLoading = false;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      adShowing = false;
      const cb = interstitialCloseCallback;
      interstitialCloseCallback = null;
      cleanupInterstitial();
      // Delay callback and reload to let the ad fully dismiss
      setTimeout(() => {
        cb?.();
        loadInterstitial();
      }, 100);
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      adShowing = false;
      const cb = interstitialCloseCallback;
      interstitialCloseCallback = null;
      cleanupInterstitial();
      cb?.();
      setTimeout(() => loadInterstitial(), 10000);
    });

    interstitialUnsubscribers = [unsubLoaded, unsubClosed, unsubError];
    interstitial = ad;
    ad.load();
  } catch {
    interstitialLoading = false;
  }
}

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
    loadInterstitial();
  }
}

// ─── Rewarded (hint / continue / double score) ───────────
let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;
let rewardedLoading = false;
let rewardedCallback: (() => void) | null = null;
let rewardedEarned = false;
let rewardedUnsubscribers: (() => void)[] = [];

function cleanupRewarded() {
  const unsubs = rewardedUnsubscribers;
  rewardedUnsubscribers = [];
  rewarded = null;
  rewardedLoaded = false;
  rewardedLoading = false;
  rewardedEarned = false;
  unsubs.forEach(unsub => { try { unsub(); } catch {} });
}

export function loadRewarded() {
  if (rewardedLoading || rewardedLoaded) return;
  try {
    cleanupRewarded();
    rewardedLoading = true;
    const ad = RewardedAd.createForAdRequest(AD_IDS.REWARDED);

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded = true;
      rewardedLoading = false;
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardedEarned = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      adShowing = false;
      // Call callback on close (after earned) to avoid state updates while ad is visible
      const cb = rewardedEarned ? rewardedCallback : null;
      rewardedCallback = null;
      cleanupRewarded();
      // Delay to let ad fully dismiss before triggering UI updates
      setTimeout(() => {
        cb?.();
        loadRewarded();
      }, 100);
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      adShowing = false;
      rewardedCallback = null;
      cleanupRewarded();
      setTimeout(() => loadRewarded(), 10000);
    });

    rewardedUnsubscribers = [unsubLoaded, unsubEarned, unsubClosed, unsubError];
    rewarded = ad;
    ad.load();
  } catch {
    rewardedLoading = false;
  }
}

export function isRewardedReady(): boolean {
  if (isDev) return true;
  return rewardedLoaded && rewarded !== null;
}

export function showRewarded(onRewarded: () => void): boolean {
  if (isDev) {
    // Use setTimeout to avoid synchronous state updates during render
    setTimeout(() => onRewarded(), 50);
    return true;
  }
  if (!rewardedLoaded || !rewarded) return false;
  try {
    adShowing = true;
    rewardedCallback = onRewarded;
    rewardedEarned = false;
    rewarded.show();
    return true;
  } catch {
    adShowing = false;
    rewardedCallback = null;
    loadRewarded();
    return false;
  }
}
