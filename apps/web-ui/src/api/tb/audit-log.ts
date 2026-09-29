import type { ActionStatus, ActionType, EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export interface AuditLog extends BaseData<EntityType> {
  actionData?: Record<string, any>;
  actionFailureDetails?: string;
  actionStatus?: ActionStatus;
  actionType?: ActionType;
  customerId?: EntityId<EntityType.CUSTOMER>;
  entityId?: EntityId;
  entityName?: string;
  tenantId?: EntityId<EntityType.TENANT>;
  userId?: EntityId<EntityType.USER>;
  userName?: string;
}

export interface AuditLogQuery extends PageLink {
  actionTypes?: string;
  endTime?: number;
  startTime?: number;
}

export function getAuditLogs(params: AuditLogQuery) {
  return requestClient.get<PageData<AuditLog>>('/audit/logs', { params });
}

export function getAuditLogsByEntityId(
  entityType: EntityType | string,
  entityId: string,
  params: AuditLogQuery,
) {
  return requestClient.get<PageData<AuditLog>>(
    `/audit/logs/entity/${entityType}/${entityId}`,
    { params },
  );
}

export function getAuditLogsByUserId(userId: string, params: AuditLogQuery) {
  return requestClient.get<PageData<AuditLog>>(`/audit/logs/user/${userId}`, {
    params,
  });
}

export function getAuditLogsByCustomerId(
  customerId: string,
  params: AuditLogQuery,
) {
  return requestClient.get<PageData<AuditLog>>(
    `/audit/logs/customer/${customerId}`,
    { params },
  );
}
