import { BasicModel } from '../model/baseModel';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface AdminSetting extends BasicModel<null> {
  tenantId?: EntityId<EntityType.TENANT>;
  key?: string;
  jsonValue?: any;
}

export interface SmsRequest {
  providerConfiguration: Recordable;
  numberTo: string;
  message: string;
}

export interface JwtSetting {
  tokenExpirationTime: number;
  refreshTokenExpTime: number;
  tokenIssuer: string;
  tokenSigningKey: string;
}

export interface PasswordPolicy {
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
  passwordPolicy: PasswordPolicy;
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
      serviceId?: string;
      serviceType?: string;
      cpuUsage?: number;
      cpuCount?: number;
      memoryUsage?: number;
      totalMemory?: number;
      discUsage?: number;
      totalDiscSpace?: number;
    },
  ];
}

export function getAdminSetting(key: string) {
  return defHttp.get<AdminSetting>({
    url: `/api/admin/settings/${key}`,
  });
}

export function saveAdminSetting(data: AdminSetting | any) {
  return defHttp.postJson<AdminSetting>({
    url: `/api/admin/settings`,
    data,
  });
}

export function sendTestMail(data: AdminSetting | any) {
  return defHttp.postJson<void>({
    url: `/api/admin/settings/testMail`,
    data,
  });
}

export function sendTestSms(data: SmsRequest | any) {
  return defHttp.postJson<void>({
    url: `/api/admin/settings/testSms`,
    data,
  });
}

export function getJwtSetting() {
  return defHttp.get<JwtSetting>({
    url: '/api/admin/jwtSettings',
  });
}

export function saveJwtSetting(data: JwtSetting | any) {
  return defHttp.postJson<JwtSetting>({
    url: `/api/admin/jwtSettings`,
    data,
  });
}

export function getSecuritySettings() {
  return defHttp.get<SecuritySettings>({
    url: '/api/admin/securitySettings',
  });
}

export function saveSecuritySettings(data: SecuritySettings | any) {
  return defHttp.postJson<JwtSetting>({
    url: `/api/admin/securitySettings`,
    data,
  });
}
