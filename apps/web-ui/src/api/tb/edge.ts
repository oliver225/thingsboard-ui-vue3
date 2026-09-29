import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export interface Edge extends BaseData<EntityType.EDGE> {
  name: string;
  label?: string;
  type: string;
  routingKey: string;
  secret: string;
  tenantId?: EntityId<EntityType.TENANT>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  rootRuleChainId?: EntityId<EntityType.RULE_CHAIN>;
  additionalInfo?: {
    [key: string]: unknown;
    description?: string;
  };
}

export interface EdgeInfo extends Edge {
  customerTitle?: string;
  customerIsPublic?: boolean;
}

/** Edge 实例选项，与 ui-ngx 的 getTenantEdgeInfos 保持一致。 */
export function getTenantEdgeInfos(pageLink: PageLink, type = '') {
  return requestClient.get<PageData<EdgeInfo>>('/tenant/edgeInfos', {
    params: { ...pageLink, type },
  });
}

export function getEdgeById(edgeId: string) {
  return requestClient.get<Edge>(`/edge/${edgeId}`);
}

export function saveEdge(edge: Edge) {
  return requestClient.post<Edge>('/edge', edge);
}

export function getEdgeTypes() {
  return requestClient.get<{ type: string }[]>('/edge/types');
}

export function deleteEdge(edgeId: string): Promise<void> {
  return requestClient.delete(`/edge/${edgeId}`);
}

export function syncEdge(edgeId: string): Promise<void> {
  return requestClient.post(`/edge/sync/${edgeId}`, edgeId);
}

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteEdges(edgeIds: string[]) {
  const ids = [...new Set(edgeIds)];
  const results = await Promise.allSettled(ids.map((id) => deleteEdge(id)));
  return {
    deletedIds: ids.filter(
      (_, index) => results[index]?.status === 'fulfilled',
    ),
    failedIds: ids.filter((_, index) => results[index]?.status === 'rejected'),
  };
}
