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

export interface Dashboard extends DashboardInfo {
  configuration: Recordable;
  externalId?: EntityId<EntityType.DASHBOARD>;
}

export interface UserDashboard extends Recordable {
  last: Array<{ id: string; lastVisited: number; starred: boolean; title: string }>;
  starred: Array<{ id: string; starredAt: number; title: string }>;
}

export interface HomeDashboardInfo {
  dashboardId: EntityId<EntityType.TENANT>;
  hideDashboardToolbar: boolean;
}

export function getServerTime() {
  return defHttp.get<number>({
    url: '/api/dashboard/serverTime',
  });
}

export function getMaxDatapointsLimit() {
  return defHttp.get<number>({
    url: '/api/dashboard/maxDatapointsLimit',
  });
}

export function getDashboardInfoById(dashboardId: string) {
  return defHttp.get<DashboardInfo>({
    url: `/api/dashboard/info/${dashboardId}`,
  });
}

export function getDashboardById(dashboardId: string) {
  return defHttp.get<Dashboard>({
    url: `/api/dashboard/${dashboardId}`,
  });
}

export function saveDashboard(data: Dashboard | any) {
  return defHttp.postJson<any>({
    url: '/api/dashboard',
    data,
  });
}

export function deleteDashboard(dashboardId: string) {
  return defHttp.delete<any>({
    url: `/api/dashboard/${dashboardId}`,
  });
}

export function assignDashboardToCustomer(customerId: string, dashboardId: string) {
  return defHttp.postJson<Dashboard>({
    url: `/api/customer/${customerId}/dashboard/${dashboardId}`,
  });
}

export function assignDashboardToPublicCustomer(dashboardId: string) {
  return defHttp.postJson<Dashboard>({
    url: `/api/customer/public/dashboard/${dashboardId}`,
  });
}

export function unassignDashboardFromCustomer(customerId: string, dashboardId: string) {
  return defHttp.delete<Dashboard>({
    url: `/api/customer/${customerId}/dashboard/${dashboardId}`,
  });
}

export function unassignDashboardFromPublicCustomer(dashboardId: string) {
  return defHttp.delete<Dashboard>({
    url: `/api/customer/public/dashboard/${dashboardId}`,
  });
}

export function updateDashboardCustomers(dashboardId: string, customerIds: string[]) {
  return defHttp.postJson<Dashboard>({
    url: `/api/dashboard/${dashboardId}/customers`,
    data: customerIds,
  });
}

export function addDashboardCustomers(dashboardId: string, customerIds: string[]) {
  return defHttp.postJson<Dashboard>({
    url: `/api/dashboard/${dashboardId}/customers/add`,
    data: customerIds,
  });
}

export function removeDashboardCustomers(dashboardId: string, customerIds: string[]) {
  return defHttp.postJson<Dashboard>({
    url: `/api/dashboard/${dashboardId}/customers/remove`,
    data: customerIds,
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

export function getHomeDashboardInfo() {
  return defHttp.get<HomeDashboardInfo>({
    url: '/api/dashboard/home/info',
  });
}

export function getTenantHomeDashboardInfo() {
  return defHttp.get<HomeDashboardInfo>({
    url: '/api/tenant/dashboard/home/info',
  });
}

export function setTenantHomeDashboardInfo(data: HomeDashboardInfo | any) {
  return defHttp.postJson<HomeDashboardInfo>({
    url: '/api/tenant/dashboard/home/info',
    data,
  });
}

export function getHomeDashboard() {
  return defHttp.get<any>({
    url: '/api/dashboard/home',
  });
}

export function userDashboardList() {
  return defHttp.get<UserDashboard>({
    url: '/api/user/dashboards',
  });
}
