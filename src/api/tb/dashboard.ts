import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface DashboardInfo extends BasicModel<EntityType.DASHBOARD> {
  tenantId?: EntityId<EntityType.TENANT>;
  title?: string;
  image?: string;
  mobileHide?: boolean;
  mobileOrder?: number;
  assignedCustomers?: [{ customerId?: EntityId<EntityType.CUSTOMER>; title?: string; public?: boolean }];
}

export interface UserDashboard extends Recordable {
  last: Array<{ id: string; lastVisited: number; starred: boolean; title: string }>;
  starred: Array<{ id: string; starredAt: number; title: string }>;
}

export function getDashboardInfoById(dashboardId: string) {
  return defHttp.get<DashboardInfo>({
    url: `/api/dashboard/info/${dashboardId}`,
  });
}

export function currentTenantDashboardList(params: BasicQuery) {
  return defHttp.get<Page<DashboardInfo>>({
    url: '/api/tenant/dashboards',
    params,
  });
}

export function tenantDashboardList(params: BasicQuery, tenantId: string) {
  return defHttp.get<Page<DashboardInfo>>({
    url: `/api/tenant/${tenantId}/dashboards`,
    params,
  });
}
export function customerDashboardList(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<DashboardInfo>>({
    url: `/api/customer/${customerId}/dashboards`,
    params,
  });
}

export function userDashboardList() {
  return defHttp.get<UserDashboard>({
    url: '/api/user/dashboards',
  });
}
