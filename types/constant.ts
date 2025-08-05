import { EntityType } from '/@/enums/entityTypeEnum';

export const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';

export const SYS_TENANT_ID: EntityId<EntityType.TENANT> = {
  entityType: EntityType.TENANT,
  id: NULL_UUID,
};
