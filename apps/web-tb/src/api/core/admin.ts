import type { Recordable } from '@vben/types';

import type { EntityType } from '#/constants';

import { requestClient } from '#/api/request';

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

export function getAdminSettingsApi(key: string) {
  return requestClient.get<AdminSetting>(`/admin/settings/${key}`);
}

export function saveAdminSettingsApi(data: AdminSetting | any) {
  return requestClient.post<AdminSetting>('/admin/settings', data);
}

export function getSecuritySettingsApi() {
  return requestClient.get<SecuritySettings>('/admin/securitySettings');
}

export function saveSecuritySettingsApi(data: any | SecuritySettings) {
  return requestClient.post<SecuritySettings>('/admin/securitySettings', data);
}

export function getJwtSettingApi() {
  return requestClient.get<JwtSetting>('/admin/jwtSettings');
}

export function saveJwtSettingApi(data: any | JwtSetting) {
  return requestClient.post<JwtSetting>('/admin/jwtSettings', data);
}

export function sendTestMail(data: AdminSetting | any) {
  return requestClient.post(`/admin/settings/testMail`, data);
}

export function sendTestSms(data: any | SmsRequest) {
  return requestClient.post('/admin/settings/testSms', data);
}

export function getSysInfoApi() {
  return requestClient.get<SystemInfo>('/admin/systemInfo');
}

export function getFeaturesInfoApi() {
  return requestClient.get<FeaturesInfo>('/admin/featuresInfo');
}

export function checkUpdatesApi() {
  return requestClient.get<UpdateMessage>('/admin/updates');
}
