import type { BasicUserInfo } from '@vben-core/typings';

import { Authority, EntityId, EntityType } from '@vben/constants';

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
  additionalInfo: any;
  createdTime: number;
}

export type { UserInfo };
