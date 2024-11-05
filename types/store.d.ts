import { ErrorTypeEnum } from '/@/enums/exceptionEnum';
import { MenuModeEnum, MenuTypeEnum } from '/@/enums/menuEnum';
import { EntityType } from '/@/enums/entityTypeEnum';
import { Authority } from '/@/enums/authorityEnum';
// import { RoleInfo } from '/@/api/sys/model/userModel';

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
  // userId: string | number;
  // username: string;
  // realName: string;
  // avatar: string;
  // desc?: string;
  // userCode: string | number;
  // loginCode: string;
  // userName: string;
  // avatarUrl: string;
  // remarks?: string;
  // roleList?: any[];
  // homePath?: string;
  // roles: RoleInfo[];
  id: EntityId<EntityType.USER>;
  tenantId: EntityId<EntityType.TENANT>;
  customerId: EntityId<EntityType.CUSTOMER>;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  authority: Authority;
  additionalInfo: any;
  createdTime: number;
}

export interface BeforeMiniState {
  menuCollapsed?: boolean;
  menuSplit?: boolean;
  menuMode?: MenuModeEnum;
  menuType?: MenuTypeEnum;
}

export interface JwtPair {
  token: string;
  refreshToken: string;
  scope: string;
}

export interface EntityId<T> {
  entityType?: T;
  id: string;
}