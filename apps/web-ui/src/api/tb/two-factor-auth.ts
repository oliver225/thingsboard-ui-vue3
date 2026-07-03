/**
 * 双因素认证(2FA)平台设置接口(SYS_ADMIN)
 * 契约参考:后端 TwoFactorAuthConfigController.java(/api/2fa)
 */
import type { TwoFaProviderType } from '#/enums';

import { requestClient } from '#/api/request';

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

/** 获取平台 2FA 设置(GET /api/2fa/settings,未配置时返回 null) */
export function getPlatformTwoFaSettings() {
  return requestClient.get<null | PlatformTwoFaSettings>('/2fa/settings');
}

/** 保存平台 2FA 设置(POST /api/2fa/settings) */
export function savePlatformTwoFaSettings(settings: PlatformTwoFaSettings) {
  return requestClient.post<PlatformTwoFaSettings>('/2fa/settings', settings);
}
