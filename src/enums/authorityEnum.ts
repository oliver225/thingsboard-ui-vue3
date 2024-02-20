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