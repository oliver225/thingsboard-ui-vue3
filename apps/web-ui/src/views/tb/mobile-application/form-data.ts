import type { MobileApp } from '#/api/tb/mobile-app';

import { randomSecret } from '#/utils/common';

export interface MobileApplicationBasicValues {
  pkgName: string;
  title: string;
  platformType: MobileApp['platformType'];
  status: MobileApp['status'];
  appSecret: string;
}

export interface MobileApplicationVersionValues {
  minVersion: string;
  latestVersion: string;
  minVersionReleaseNotes: string;
  latestVersionReleaseNotes: string;
}

export interface MobileApplicationStoreValues {
  platformType: MobileApp['platformType'];
  status: MobileApp['status'];
  storeLink: string;
  sha256CertFingerprints: string;
  appId: string;
}

export function createAppSecret() {
  return btoa(randomSecret(64));
}

export function toMobileAppFormValues(mobileApp?: MobileApp): {
  basic: MobileApplicationBasicValues;
  version: MobileApplicationVersionValues;
  store: MobileApplicationStoreValues;
} {
  return {
    basic: {
      pkgName: mobileApp?.pkgName ?? '',
      title: mobileApp?.title ?? '',
      platformType: mobileApp?.platformType ?? 'ANDROID',
      status: mobileApp?.status ?? 'DRAFT',
      appSecret: mobileApp?.appSecret || createAppSecret(),
    },
    version: {
      minVersion: mobileApp?.versionInfo?.minVersion ?? '',
      latestVersion: mobileApp?.versionInfo?.latestVersion ?? '',
      minVersionReleaseNotes:
        mobileApp?.versionInfo?.minVersionReleaseNotes ?? '',
      latestVersionReleaseNotes:
        mobileApp?.versionInfo?.latestVersionReleaseNotes ?? '',
    },
    store: {
      platformType: mobileApp?.platformType ?? 'ANDROID',
      status: mobileApp?.status ?? 'DRAFT',
      storeLink: mobileApp?.storeInfo?.storeLink ?? '',
      sha256CertFingerprints:
        mobileApp?.storeInfo?.sha256CertFingerprints ?? '',
      appId: mobileApp?.storeInfo?.appId ?? '',
    },
  };
}
