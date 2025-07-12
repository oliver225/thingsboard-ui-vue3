import type { EntityId, EntityType } from '@vben/constants';

import type { BasicQuery, Page } from '#/api/model';

import { requestClient } from '#/api/request';

export namespace TenantApi {
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
}
export async function tenantSaveApi(data?: any | TenantApi.Tenant) {
  return requestClient.post<TenantApi.Tenant>('/tenant', data);
}

export async function getTenantByIdApi(tenantId: string, params?: any) {
  return requestClient.get<TenantApi.Tenant>(`/tenant/${tenantId}`, params);
}

export async function getTenantInfoByIdApi(tenantId: string, params?: any) {
  return requestClient.get<TenantApi.TenantInfo>(
    `/tenant/info/${tenantId}`,
    params,
  );
}

export async function tenantDeleteApi(tenantId: string) {
  return requestClient.delete(`/tenant/${tenantId}`);
}

export async function tenantListApi(params: BasicQuery) {
  return requestClient.get<Page<TenantApi.Tenant>>('/tenants', params);
}

export async function tenantInfoListApi(params: BasicQuery) {
  return requestClient.get<Page<TenantApi.TenantInfo>>('/tenantInfos', params);
}
