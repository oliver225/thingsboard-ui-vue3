/**
 * Edge 接口
 * 契约参考 EdgeController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** Edge 实体(org.thingsboard.server.common.data.edge.Edge) */
export interface Edge extends BaseData<EntityType.EDGE> {
  additionalInfo?: Record<string, any>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  label?: string;
  name: string;
  routingKey?: string;
  secret?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  type?: string;
}

/** Edge 摘要(EdgeInfo) */
export interface EdgeInfo extends Edge {
  customerTitle?: string;
}

/** 租户 Edge 摘要列表(GET /api/tenant/edgeInfos) */
export function getTenantEdgeInfos(pageLink: PageLink) {
  return requestClient.get<PageData<EdgeInfo>>('/tenant/edgeInfos', {
    params: { ...pageLink },
  });
}

/** 客户 Edge 摘要列表(GET /api/customer/{customerId}/edgeInfos) */
export function getCustomerEdgeInfos(customerId: string, pageLink: PageLink) {
  return requestClient.get<PageData<EdgeInfo>>(
    `/customer/${customerId}/edgeInfos`,
    {
      params: { ...pageLink },
    },
  );
}
