import { AuditLogQueryParam, Page } from '../model/baseModel';
import { ActionType, EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface AuditLog {
  id?: { id: string };
  createdTime?: number;
  tenantId?: EntityId<EntityType.TENANT>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  entityId?: EntityId<any>;
  entityName?: string;
  userId: EntityId<EntityType.USER>;
  userName?: string;
  actionType?: ActionType;
  actionStatus?: 'SUCCESS' | 'FAILURE';
  actionData?: Recordable;
  actionFailureDetails?: string;
}

export function auditLogList(params: AuditLogQueryParam) {
  return defHttp.get<Page<AuditLog>>({
    url: '/api/audit/logs',
    params,
  });
}

export function getAuditLogByEntityId(params: AuditLogQueryParam, entityType: EntityType, entityId: string) {
  return defHttp.get<Page<AuditLog>>({
    url: `/api/audit/logs/entity/${entityType}/${entityId}`,
    params,
  });
}

export function getAuditLogByUserId(params: AuditLogQueryParam, userId: string) {
  return defHttp.get<Page<AuditLog>>({
    url: `/api/audit/logs/user/${userId}`,
    params,
  });
}

export function getAuditLogByCustomerId(params: AuditLogQueryParam, customerId: string) {
  return defHttp.get<Page<AuditLog>>({
    url: `/api/audit/logs/customer/${customerId}`,
    params,
  });
}
