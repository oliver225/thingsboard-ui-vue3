/**
 * 租户接口(SYS_ADMIN)
 * 契约参考:后端 TenantController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 租户实体(org.thingsboard.server.common.data.Tenant,继承 ContactBased) */
export interface Tenant extends BaseData<EntityType.TENANT> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
    homeDashboardHideToolbar?: boolean;
    homeDashboardId?: string;
  };
  address?: string;
  address2?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  region?: string;
  state?: string;
  tenantProfileId?: EntityId<EntityType.TENANT_PROFILE>;
  title: string;
  zip?: string;
}

/** 租户信息(TenantInfo extends Tenant,列表展示用) */
export interface TenantInfo extends Tenant {
  tenantProfileName?: string;
}

/** 租户详情(GET /api/tenant/{tenantId}) */
export function getTenantById(tenantId: string) {
  return requestClient.get<Tenant>(`/tenant/${tenantId}`);
}

/** 租户信息详情(GET /api/tenant/info/{tenantId},含租户配置名) */
export function getTenantInfoById(tenantId: string) {
  return requestClient.get<TenantInfo>(`/tenant/info/${tenantId}`);
}

/** 保存租户(POST /api/tenant,带 id 为更新) */
export function saveTenant(tenant: Tenant) {
  return requestClient.post<Tenant>('/tenant', tenant);
}

/** 删除租户(DELETE /api/tenant/{tenantId}) */
export function deleteTenant(tenantId: string): Promise<void> {
  return requestClient.delete(`/tenant/${tenantId}`);
}

/** 租户分页列表(GET /api/tenants) */
export function getTenants(pageLink: PageLink) {
  return requestClient.get<PageData<Tenant>>('/tenants', {
    params: { ...pageLink },
  });
}

/** 租户信息分页列表(GET /api/tenantInfos) */
export function getTenantInfos(pageLink: PageLink) {
  return requestClient.get<PageData<TenantInfo>>('/tenantInfos', {
    params: { ...pageLink },
  });
}

/**
 * 按 id 批量获取租户(GET /api/tenants/list?tenantIds=a,b)
 */
export function getTenantsByIds(tenantIds: string[]) {
  return requestClient.get<Tenant[]>('/tenants/list', {
    params: { tenantIds: tenantIds.join(',') },
  });
}
