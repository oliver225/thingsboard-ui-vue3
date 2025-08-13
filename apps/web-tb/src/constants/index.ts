import type { EntityId } from '#/types';

import { EntityType } from './src/entityType';

export * from './src/alarm';
export * from './src/authority';
export * from './src/component';
export * from './src/device';
export * from './src/entityType';
export * from './src/entityType';
export * from './src/event';
export * from './src/event';
export * from './src/notification';
export * from './src/otaPackage';
export * from './src/queue';
export * from './src/relation';
export * from './src/relation';
export * from './src/resourceType';
export * from './src/telemetry';
export * from './src/thingsModel';
export * from './src/thingsModel';
export * from './src/widgetType';
export * from './src/widgetType';
export * from './src/wsCmdType';

export const TBV_GITEE_URL = 'https://github.com/oliver225/thingsboard-ui-vue3';
export const TBV_GITHUB_URL = 'https://gitee.com/oliver225/thingsboard-ui-vue3';

export const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';

export const SYS_TENANT_ID: EntityId<EntityType.TENANT> = {
  entityType: EntityType.TENANT,
  id: NULL_UUID,
};
