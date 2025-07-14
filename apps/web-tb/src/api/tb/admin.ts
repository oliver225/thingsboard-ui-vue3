import type { EntityId, EntityType } from '@vben/constants';
import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace AdminApi {
  export interface AdminSetting {
    id: EntityId<any>;
    tenantId?: EntityId<EntityType.TENANT>;
    key?: string;
    jsonValue?: any;
  }

  export interface SmsRequest {
    providerConfiguration: Recordable<any>;
    numberTo: string;
    message: string;
  }

  export interface JwtSetting {
    tokenExpirationTime: number;
    refreshTokenExpTime: number;
    tokenIssuer: string;
    tokenSigningKey: string;
  }

  export interface UserPasswordPolicy {
    allowWhitespaces?: boolean;
    forceUserToResetPasswordIfNotValid?: boolean;
    maximumLength?: number;
    minimumDigits?: number;
    minimumLength?: number;
    minimumLowercaseLetters?: number;
    minimumSpecialCharacters?: number;
    minimumUppercaseLetters?: number;
    passwordExpirationPeriodDays?: number;
    passwordReuseFrequencyDays?: number;
  }

  export interface SecuritySettings {
    passwordPolicy: UserPasswordPolicy;
    maxFailedLoginAttempts?: number;
    mobileSecretKeyLength?: number;
    userLockoutNotificationEmail?: string;
    userActivationTokenTtl?: number;
    passwordResetTokenTtl?: number;
  }

  export interface SystemInfo {
    isMonolith: boolean;
    systemData: [
      {
        cpuCount?: number;
        cpuUsage?: number;
        discUsage?: number;
        memoryUsage?: number;
        serviceId?: string;
        serviceType?: string;
        totalDiscSpace?: number;
        totalMemory?: number;
      },
    ];
  }
  export interface UpdateMessage {
    updateAvailable?: boolean;
    currentVersion?: string;
    latestVersion?: string;
    upgradeInstructionsUrl?: string;
    currentVersionReleaseNotesUrl?: string;
    latestVersionReleaseNotesUrl?: string;
  }

  export interface FeaturesInfo {
    isEmailEnabled?: boolean;
    isSmsEnabled?: boolean;
    isNotificationEnabled?: boolean;
    isOauthEnabled?: boolean;
    isTwoFaEnabled?: boolean;
  }
}

export function getAdminSettingsApi(key: string) {
  return requestClient.get<AdminApi.AdminSetting>(`/admin/settings/${key}`);
}

export function saveAdminSettingsApi(data: AdminApi.AdminSetting | any) {
  return requestClient.post<AdminApi.AdminSetting>('/admin/settings', data);
}

export function getSecuritySettingsApi() {
  return requestClient.get<AdminApi.SecuritySettings>(
    '/admin/securitySettings',
  );
}

export function saveSecuritySettingsApi(data: AdminApi.SecuritySettings | any) {
  return requestClient.post<AdminApi.SecuritySettings>(
    '/admin/securitySettings',
    data,
  );
}

export function getJwtSettingApi() {
  return requestClient.get<AdminApi.JwtSetting>('/admin/jwtSettings');
}

export function saveJwtSettingApi(data: AdminApi.JwtSetting | any) {
  return requestClient.post<AdminApi.JwtSetting>('/admin/jwtSettings', data);
}

export function sendTestMail(data: AdminApi.AdminSetting | any) {
  return requestClient.post(`/admin/settings/testMail`, data);
}

export function sendTestSms(data: AdminApi.SmsRequest | any) {
  return requestClient.post('/admin/settings/testSms', data);
}

export function getSysInfoApi() {
  return requestClient.get<AdminApi.SystemInfo>('/admin/systemInfo');
}

export function getFeaturesInfoApi() {
  return requestClient.get<AdminApi.FeaturesInfo>('/admin/featuresInfo');
}

export function checkUpdatesApi() {
  return requestClient.get<AdminApi.UpdateMessage>('/admin/updates');
}
