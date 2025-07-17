import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { DashboardInfo } from './dashboard';
import { EntityId } from '/#/store';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface Tenant extends BasicModel<EntityType.TENANT> {
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
    homeDashboardId?: DashboardInfo;
    homeDashboardHideToolbar: boolean;
  };
}

export interface TenantInfo extends Tenant {
  tenantProfileName?: string;
}

export function tenantSave(data?: Tenant | any) {
  return defHttp.postJson<Tenant>({
    url: '/tenant',
    data,
  });
}

export function tenantById(tenantId: string, params?: any) {
  return defHttp.get<Tenant>({
    url: `/tenant/${tenantId}`,
    params,
  });
}

export function tenantInfoById(tenantId: string, params?: any) {
  return defHttp.get<TenantInfo>({
    url: `/tenant/info/${tenantId}`,
    params,
  });
}

export function tenantDelete(tenantId: string) {
  return defHttp.delete<void>({
    url: `/tenant/${tenantId}`,
  });
}

export function tenantList(params: BasicQuery) {
  return defHttp.get<Page<Tenant>>({
    url: `/tenants`,
    params,
  });
}

export function tenantInfoList(params: BasicQuery) {
  return defHttp.get<Page<TenantInfo>>({
    url: `/tenantInfos`,
    params,
  });
}
