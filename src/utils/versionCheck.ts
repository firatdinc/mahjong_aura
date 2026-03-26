import {Platform, Linking} from 'react-native';

const VERSION_URL =
  'https://gist.githubusercontent.com/firatdinc/3befbb6ef0f8ae36927bb73997e31977/raw/version.json';

// Current app version — keep in sync with Info.plist / build.gradle
export const APP_VERSION = '1.1.4';

interface VersionInfo {
  ios: {latestVersion: string; minVersion: string};
  android: {latestVersion: string; minVersion: string};
  storeUrls: {ios: string; android: string};
}

export type UpdateStatus =
  | {type: 'upToDate'}
  | {type: 'updateAvailable'; storeUrl: string}
  | {type: 'forceUpdate'; storeUrl: string};

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export async function checkForUpdate(): Promise<UpdateStatus> {
  try {
    const res = await fetch(VERSION_URL, {cache: 'no-store'});
    if (!res.ok) return {type: 'upToDate'};
    const data: VersionInfo = await res.json();

    const platform = Platform.OS === 'ios' ? data.ios : data.android;
    const storeUrl =
      Platform.OS === 'ios' ? data.storeUrls.ios : data.storeUrls.android;

    // Below minimum → force update
    if (compareVersions(APP_VERSION, platform.minVersion) < 0) {
      return {type: 'forceUpdate', storeUrl};
    }

    // Below latest → optional update
    if (compareVersions(APP_VERSION, platform.latestVersion) < 0) {
      return {type: 'updateAvailable', storeUrl};
    }

    return {type: 'upToDate'};
  } catch {
    return {type: 'upToDate'};
  }
}

export function openStore(url: string) {
  Linking.openURL(url).catch(() => {});
}
