import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export interface OAuth2ClientInfo extends BaseData<EntityType.OAUTH2_CLIENT> {
  title: string;
  providerName?: string;
}

export interface MobileApp extends BaseData<EntityType.MOBILE_APP> {
  pkgName: string;
  title?: string;
  platformType: 'ANDROID' | 'IOS';
  appSecret: string;
  status: 'DEPRECATED' | 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
  tenantId?: EntityId<EntityType.TENANT>;
  versionInfo?: {
    minVersion: string;
    latestVersion: string;
    minVersionReleaseNotes?: string;
    latestVersionReleaseNotes?: string;
  };
  storeInfo?: {
    storeLink: string;
    sha256CertFingerprints?: string;
    appId?: string;
  };
}

export interface MobileAppBundle extends BaseData<EntityType.MOBILE_APP_BUNDLE> {
  title: string;
  description?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  androidAppId?: EntityId<EntityType.MOBILE_APP> | null;
  iosAppId?: EntityId<EntityType.MOBILE_APP> | null;
  layoutConfig?: { pages: Record<string, unknown>[] };
  oauth2Enabled: boolean;
}

export interface MobileAppBundleInfo extends MobileAppBundle {
  androidPkgName?: string;
  iosPkgName?: string;
  oauth2ClientInfos?: OAuth2ClientInfo[];
  qrCodeEnabled?: boolean;
}

export function getMobileAppBundleInfos(params: PageLink) {
  return requestClient.get<PageData<MobileAppBundleInfo>>(
    '/mobile/bundle/infos',
    { params },
  );
}

export function getMobileAppBundleInfo(id: string) {
  return requestClient.get<MobileAppBundleInfo>(`/mobile/bundle/info/${id}`);
}

export function saveMobileAppBundle(
  data: MobileAppBundle,
  oauth2ClientIds?: string[],
) {
  return requestClient.post<MobileAppBundle>('/mobile/bundle', data, {
    params: oauth2ClientIds?.length
      ? { oauth2ClientIds: oauth2ClientIds.join(',') }
      : {},
  });
}

export function updateMobileBundleOAuth2Clients(
  id: string,
  clientIds: string[],
) {
  return requestClient.put(`/mobile/bundle/${id}/oauth2Clients`, clientIds);
}

export function deleteMobileAppBundle(id: string): Promise<void> {
  return requestClient.delete(`/mobile/bundle/${id}`);
}

export function getMobileApps(
  params: PageLink & { platformType?: MobileApp['platformType'] },
  platformType?: MobileApp['platformType'],
) {
  return requestClient.get<PageData<MobileApp>>('/mobile/app', {
    params: { ...params, platformType: platformType ?? params.platformType },
  });
}

export function getMobileApp(id: string) {
  return requestClient.get<MobileApp>(`/mobile/app/${id}`);
}

export function saveMobileApp(data: MobileApp) {
  return requestClient.post<MobileApp>('/mobile/app', data);
}

export function deleteMobileApp(id: string): Promise<void> {
  return requestClient.delete(`/mobile/app/${id}`);
}

export function getMobileOAuth2Clients(params: PageLink) {
  return requestClient.get<PageData<OAuth2ClientInfo>>('/oauth2/client/infos', {
    params,
  });
}
