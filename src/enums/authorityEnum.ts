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
  { value: Authority.SYS_ADMIN, label: '系统管理员' },
  { value: Authority.TENANT_ADMIN, label: '租户管理员' },
  { value: Authority.CUSTOMER_USER, label: '客户' },
  { value: Authority.REFRESH_TOKEN, label: '刷新Token' },
  { value: Authority.PRE_VERIFICATION_TOKEN, label: '验证Token' },
];
