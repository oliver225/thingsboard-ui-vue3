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
  }
  export function tenantSaveApi(data?: any | TenantApi.Tenant) {
    return requestClient.post<Tenant>('/api/tenant', data);
  }

  export function getTenantByIdApi(tenantId: string, params?: any) {
    return requestClient.get<Tenant>(`/api/tenant/${tenantId}`, params);
  }

  export function getTenantInfoByIdApi(tenantId: string, params?: any) {
    return requestClient.get<TenantInfo>(
      `/api/tenant/info/${tenantId}`,
      params,
    );
  }

  export function tenantDeleteApi(tenantId: string) {
    return requestClient.delete(`/api/tenant/${tenantId}`);
  }

  export function tenantListApi(params: BasicQuery) {
    return requestClient.get<Page<Tenant>>('/api/tenants', params);
  }

  export function tenantInfoListApi(params: BasicQuery) {
    return requestClient.get<Page<TenantInfo>>('/api/tenantInfos', params);
  }
}
