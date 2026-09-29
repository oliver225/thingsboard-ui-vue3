/**
 * 双因素认证(2FA)供应商类型
 * TwoFaProviderType
 */
export enum TwoFaProviderType {
  BACKUP_CODE = 'BACKUP_CODE',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  TOTP = 'TOTP',
}
