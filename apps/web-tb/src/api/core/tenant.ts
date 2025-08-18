import type { BasicQuery, Page } from '#/api/model';
import type { EntityType } from '#/constants';

import { requestClient } from '#/api/request';

export interface Tenant {
  id: EntityId<EntityType.TENANT>;
  title?: string;
  region?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
  zip?: string;
  phone?: string;
  email?: string;
  tenantProfileId?: EntityId<EntityType.TENANT_PROFILE>;
  additionalInfo?: {
    description?: string;
    homeDashboardHideToolbar: boolean;
    homeDashboardId?: any;
  };
  createdTime?: number;
}
export interface TenantInfo extends Tenant {
  tenantProfileName: string;
  areaList?: Array<string>;
}

export async function tenantSaveApi(data?: any | Tenant) {
  return requestClient.post<Tenant>('/tenant', data);
}

export async function getTenantByIdApi(tenantId: string) {
  return requestClient.get<Tenant>(`/tenant/${tenantId}`);
}

export async function getTenantInfoByIdApi(tenantId: string) {
  return requestClient.get<TenantInfo>(`/tenant/info/${tenantId}`);
}

export async function tenantDeleteApi(tenantId: string) {
  return requestClient.delete(`/tenant/${tenantId}`);
}

export async function tenantListApi(params: BasicQuery) {
  return requestClient.get<Page<Tenant>>('/tenants', { params });
}

export async function tenantInfoListApi(params: BasicQuery) {
  return requestClient.get<Page<TenantInfo>>('/tenantInfos', { params });
}
