/**
 * 用户权限(对应后端 org.thingsboard.server.common.data.security.Authority)
 * 作为 vben 的 roles 使用,路由 meta.authority 按此过滤
 */
export enum Authority {
  CUSTOMER_USER = 'CUSTOMER_USER',
  PRE_VERIFICATION_TOKEN = 'PRE_VERIFICATION_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  SYS_ADMIN = 'SYS_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
}
