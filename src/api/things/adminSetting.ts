import { BasicModel } from "../model/baseModel";
import { EntityId } from "/#/store";
import { EntityType } from "/@/enums/entityTypeEnum";
import { defHttp } from "/@/utils/http/axios";

export interface AdminSetting extends BasicModel<null> {
  tenantId?: EntityId<EntityType.TENANT>;
  key?: string;
  jsonValue?: Recordable;
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
  minimumLength?: number;
  minimumUppercaseLetters?: number;
  minimumLowercaseLetters?: number;
  minimumDigits?: number;
  minimumSpecialCharacters?: number;
  allowWhitespaces?: boolean;
  passwordExpirationPeriodDays?: number;
  passwordReuseFrequencyDays?: number

}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  maxFailedLoginAttempts: number;
  userLockoutNotificationEmail: string;
}

export function getAdminSetting(key: string) {
  return defHttp.get<AdminSetting>({
    url: `/api/admin/settings/${key}`,
  });
}

export function saveAdminSetting(data: AdminSetting | any) {
  return defHttp.postJson<AdminSetting>({
    url: `/api/admin/settings`,
    data
  });
}

export function sendTestMail(data: AdminSetting | any) {
  return defHttp.postJson<void>({
    url: `/api/admin/settings/testMail`,
    data
  });
}

export function sendTestSms(data: SmsRequest | any) {
  return defHttp.postJson<void>({
    url: `/api/admin/settings/testSms`,
    data
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
    data
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
    data
  });
}