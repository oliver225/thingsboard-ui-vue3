/** 双因素认证：平台策略、个人配置与登录验证。 */
import type { LoginResponse } from '#/api/tb/auth';
import type { TwoFaProviderType } from '#/enums';

import { baseRequestClient, requestClient } from '#/api/request';

/** 单个 2FA 供应商配置(按 providerType 区分字段) */
export interface TwoFaProviderConfig {
  /** BACKUP_CODE */
  codesQuantity?: null | number;
  /** TOTP */
  issuerName?: string;
  providerType: TwoFaProviderType;
  /** SMS */
  smsVerificationMessageTemplate?: string;
  /** SMS / EMAIL */
  verificationCodeLifetime?: null | number;
}

/** 强制对象过滤(SystemLevelUsersFilter):type 为 ALL_USERS / TENANT_ADMINISTRATORS / SYSTEM_ADMINISTRATORS */
export interface SystemLevelUsersFilter {
  tenantProfilesIds?: null | string[];
  tenantsIds?: null | string[];
  type: string;
}

/** 平台 2FA 设置(PlatformTwoFaSettings) */
export interface PlatformTwoFaSettings {
  enforcedUsersFilter?: null | SystemLevelUsersFilter;
  enforceTwoFa?: boolean;
  maxVerificationFailuresBeforeUserLockout?: null | number;
  minVerificationCodeSendPeriod?: null | number;
  providers: TwoFaProviderConfig[];
  totalAllowedTimeForVerification?: null | number;
  /** 形如「次数:秒」,如 "3:900";为空表示不限流 */
  verificationCodeCheckRateLimit?: string;
}

export interface TwoFaProviderInfo {
  type: TwoFaProviderType;
  default: boolean;
  contact?: null | string;
  minVerificationCodeSendPeriod?: number;
}

export interface TwoFaAccountConfig {
  providerType: TwoFaProviderType;
  useByDefault: boolean;
  authUrl?: string;
  email?: string;
  phoneNumber?: string;
  codes?: string[];
  codesLeft?: number;
}

export interface AccountTwoFaSettings {
  configs: Partial<Record<TwoFaProviderType, TwoFaAccountConfig>>;
}

// 平台策略：仅系统管理员可管理。
/** 获取平台 2FA 设置(GET /api/2fa/settings,未配置时返回 null) */
export function getPlatformTwoFaSettings() {
  return requestClient.get<null | PlatformTwoFaSettings>('/2fa/settings');
}

/** 保存平台 2FA 设置(POST /api/2fa/settings) */
export function savePlatformTwoFaSettings(settings: PlatformTwoFaSettings) {
  return requestClient.post<PlatformTwoFaSettings>('/2fa/settings', settings);
}

// 个人中心使用正式会话，由 requestClient 处理刷新凭据和错误提示。
export function getAccountTwoFaSettings() {
  return requestClient.get<AccountTwoFaSettings | null>(
    '/2fa/account/settings',
  );
}

export function getAccountTwoFaProviders() {
  return requestClient.get<TwoFaProviderType[]>('/2fa/providers');
}

export function generateAccountTwoFaConfig(providerType: TwoFaProviderType) {
  return requestClient.post<TwoFaAccountConfig>(
    '/2fa/account/config/generate',
    undefined,
    {
      params: { providerType },
    },
  );
}

export function submitAccountTwoFaConfig(
  config: TwoFaAccountConfig,
): Promise<void> {
  return requestClient.post('/2fa/account/config/submit', config);
}

export function saveAccountTwoFaConfig(
  config: TwoFaAccountConfig,
  verificationCode?: string,
) {
  return requestClient.post<AccountTwoFaSettings>(
    '/2fa/account/config',
    config,
    {
      params: { verificationCode },
    },
  );
}

export function updateAccountTwoFaConfig(providerType: TwoFaProviderType) {
  return requestClient.put<AccountTwoFaSettings>(
    '/2fa/account/config',
    { useByDefault: true },
    {
      params: { providerType },
    },
  );
}

export function deleteAccountTwoFaConfig(providerType: TwoFaProviderType) {
  return requestClient.delete<AccountTwoFaSettings>('/2fa/account/config', {
    params: { providerType },
  });
}

// 登录验证：使用受限令牌，错误交给登录页面处理。
export function getTwoFaProviders(token: string) {
  return baseRequestClient.get<TwoFaProviderInfo[]>('/auth/2fa/providers', {
    headers: { 'X-Authorization': `Bearer ${token}` },
    skipErrorHandler: true,
  });
}

export function sendTwoFaCode(
  token: string,
  providerType: TwoFaProviderType,
): Promise<void> {
  return baseRequestClient.post('/auth/2fa/verification/send', undefined, {
    headers: { 'X-Authorization': `Bearer ${token}` },
    skipErrorHandler: true,
    params: { providerType },
  });
}

export function checkTwoFaCode(
  token: string,
  providerType: TwoFaProviderType,
  verificationCode: string,
) {
  return baseRequestClient.post<LoginResponse>(
    '/auth/2fa/verification/check',
    undefined,
    {
      headers: { 'X-Authorization': `Bearer ${token}` },
      skipErrorHandler: true,
      params: { providerType, verificationCode },
    },
  );
}

// 首次配置：生成配置、发送验证码、验证保存后完成登录。
export function getTwoFaConfigurationProviders(token: string) {
  return baseRequestClient.get<TwoFaProviderType[]>('/2fa/providers', {
    headers: { 'X-Authorization': `Bearer ${token}` },
    skipErrorHandler: true,
  });
}

export function generateTwoFaConfig(
  token: string,
  providerType: TwoFaProviderType,
) {
  return baseRequestClient.post<TwoFaAccountConfig>(
    '/2fa/account/config/generate',
    undefined,
    {
      headers: { 'X-Authorization': `Bearer ${token}` },
      skipErrorHandler: true,
      params: { providerType },
    },
  );
}

export function submitTwoFaConfig(
  token: string,
  config: TwoFaAccountConfig,
): Promise<void> {
  return baseRequestClient.post('/2fa/account/config/submit', config, {
    headers: { 'X-Authorization': `Bearer ${token}` },
    skipErrorHandler: true,
  });
}

export function saveTwoFaConfig(
  token: string,
  config: TwoFaAccountConfig,
  verificationCode: string,
) {
  return baseRequestClient.post<AccountTwoFaSettings>(
    '/2fa/account/config',
    config,
    {
      headers: { 'X-Authorization': `Bearer ${token}` },
      skipErrorHandler: true,
      params: { verificationCode },
    },
  );
}

export function finishTwoFaConfiguration(token: string) {
  return baseRequestClient.post<LoginResponse>('/auth/2fa/login', undefined, {
    headers: { 'X-Authorization': `Bearer ${token}` },
    skipErrorHandler: true,
  });
}
