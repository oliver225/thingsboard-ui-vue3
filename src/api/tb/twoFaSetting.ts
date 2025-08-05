import { defHttp } from '/@/utils/http/axios';

export interface TwoFaSetting {
  providers?: [{ providerType: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODE' }];
  minVerificationCodeSendPeriod?: number;
  maxVerificationFailuresBeforeUserLockout?: number;
  totalAllowedTimeForVerification?: number;
  verificationCodeCheckRateLimit?: string;
}

export function getTwoFaSettings() {
  return defHttp.get<TwoFaSetting>({
    url: '/api/2fa/settings',
  });
}

export function saveTwoFaSettings(data: TwoFaSetting | any) {
  return defHttp.postJson<TwoFaSetting>({
    url: '/api/2fa/settings',
    data,
  });
}
