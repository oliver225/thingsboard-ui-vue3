import { useI18n } from '/@/hooks/web/useI18n';

const { t } = useI18n();

// 权限
export enum Authority {
  // ADMIN (code 0)
  SYS_ADMIN = 'SYS_ADMIN',

  // TENANT (code 1)
  TENANT_ADMIN = 'TENANT_ADMIN',

  // CUSTOMER (code 2)
  CUSTOMER_USER = 'CUSTOMER_USER',

  // TOKEN (code 10)
  REFRESH_TOKEN = 'REFRESH_TOKEN',

  // VERIFICATION (code 11)
  PRE_VERIFICATION_TOKEN = 'PRE_VERIFICATION_TOKEN',
}

export const AUTHORITY_OPTIONS = [
  { value: Authority.SYS_ADMIN, label: t('tb.authority.sysAdmin') },
  { value: Authority.TENANT_ADMIN, label: t('tb.authority.tenantAdmin') },
  { value: Authority.CUSTOMER_USER, label: t('tb.authority.customerUser') },
  { value: Authority.REFRESH_TOKEN, label: t('tb.authority.refreshToken') },
  { value: Authority.PRE_VERIFICATION_TOKEN, label: t('tb.authority.preVerificationToken') },
];
