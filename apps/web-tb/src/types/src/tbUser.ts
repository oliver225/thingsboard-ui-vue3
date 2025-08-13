import type { BasicUserInfo } from '@vben/types';

import type { Authority, EntityType } from '#/constants';

interface EntityId<T> {
  entityType?: T;
  id: string;
}

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
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

export type { EntityId, UserInfo };
