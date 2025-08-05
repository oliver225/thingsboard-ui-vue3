import { ErrorTypeEnum } from '/@/enums/exceptionEnum';
import { MenuModeEnum, MenuTypeEnum } from '/@/enums/menuEnum';
import { Authority } from '/@/enums/authorityEnum';
import { EntityType } from '/@/enums/entityTypeEnum';

// Lock screen information
export interface LockInfo {
  // Password required
  pwd?: string | undefined;
  // Is it locked?
  isLock?: boolean;
}

// Error-log information
export interface ErrorLogInfo {
  // Type of error
  type: ErrorTypeEnum;
  // Error file
  file: string;
  // Error name
  name?: string;
  // Error message
  message: string;
  // Error stack
  stack?: string;
  // Error detail
  detail: string;
  // Error url
  url: string;
  // Error time
  time?: string;
}

export interface UserInfo {
  id: EntityId<EntityType.USER>;
  tenantId: EntityId<EntityType.TENANT>;
  customerId: EntityId<EntityType.CUSTOMER>;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  authority: Authority;
  additionalInfo: {
    [key: string]: any;
    defaultDashboardFullscreen?: boolean;
    defaultDashboardId?: string;
    description?: string;
    homeDashboardHideToolbar?: boolean;
    homeDashboardId?: string;
    lastLoginTs: number;
    userActivated?: boolean;
    userCredentialsEnabled?: boolean;
  };
  createdTime: number;
}

export interface JwtPair {
  token: string;
  refreshToken: string;
}

export interface BeforeMiniState {
  menuCollapsed?: boolean;
  menuSplit?: boolean;
  menuMode?: MenuModeEnum;
  menuType?: MenuTypeEnum;
}
