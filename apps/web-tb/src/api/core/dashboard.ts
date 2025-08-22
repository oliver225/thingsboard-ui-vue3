import type { Recordable } from '@vben/types';

import type { BasicQuery, Page } from '../model';

import type { EntityType } from '#/constants';

import { requestClient } from '#/api/request';

export interface DashboardInfo {
  id: EntityId<EntityType.DASHBOARD>;
  tenantId?: EntityId<EntityType.TENANT>;
  title?: string;
  image?: string;
  mobileHide?: boolean;
  mobileOrder?: number;
  assignedCustomers?: [
    {
      customerId?: EntityId<EntityType.CUSTOMER>;
      public?: boolean;
      title?: string;
    },
  ];
  createdTime: number;
}

export interface Dashboard extends DashboardInfo {
  configuration: Recordable<any>;
  resources: Array<any>;
}

export interface HomeDashboard extends Recordable<any> {
  hideDashboardToolbar: boolean;
}

export interface HomeDashboardInfo {
  dashboardId: EntityId<EntityType.DASHBOARD>;
  hideDashboardToolbar: boolean;
}

export function getServerTimeApi() {
  return requestClient.get<number>('/dashboard/serverTime');
}

export function getMaxDatapointsLimitApi() {
  return requestClient.get<number>('/dashboard/maxDatapointsLimit');
}

export function getDashboardInfoById(dashboardId: string) {
  return requestClient.get<DashboardInfo>(`/dashboard/info/${dashboardId}`);
}

export function getDashboardById(dashboardId: string) {
  return requestClient.get<Dashboard>(`/dashboard/${dashboardId}`);
}
export function saveDashboardApi(dashboard: any | Dashboard) {
  return requestClient.post<any>('/dashboard', dashboard);
}

export function deleteDashboard(dashboardId: string) {
  return requestClient.delete<any>(`/dashboard/${dashboardId}`);
}

export function assignDashboardToCustomer(
  customerId: string,
  dashboardId: string,
) {
  return requestClient.post<Dashboard>(
    `/customer/${customerId}/dashboard/${dashboardId}`,
  );
}

export function unAssignDashboardToCustomer(
  customerId: string,
  dashboardId: string,
) {
  return requestClient.delete<Dashboard>(
    `/customer/${customerId}/dashboard/${dashboardId}`,
  );
}

export function updateDashboardCustomers(
  dashboardId: string,
  customerIds: string[],
) {
  return requestClient.post<Dashboard>(`/dashboard/${dashboardId}/customers`, {
    strCustomerIds: customerIds,
  });
}

export function addDashboardCustomers(
  dashboardId: string,
  customerIds: string[],
) {
  return requestClient.post<Dashboard>(
    `/dashboard/${dashboardId}/customers/add`,
    {
      strCustomerIds: customerIds,
    },
  );
}

export function removeDashboardCustomers(
  dashboardId: string,
  customerIds: string[],
) {
  return requestClient.post<Dashboard>(
    `/dashboard/${dashboardId}/customers/remove`,
    {
      strCustomerIds: customerIds,
    },
  );
}

export function assignDashboardToPublicCustomer(dashboardId: string) {
  return requestClient.post<Dashboard>(
    `/customer/public/dashboard/${dashboardId}`,
  );
}

export function unAssignDashboardToPublicCustomer(dashboardId: string) {
  return requestClient.delete<Dashboard>(
    `/customer/public/dashboard/${dashboardId}`,
  );
}

export function tenantDashboardList(params: BasicQuery, tenantId: string) {
  return requestClient.get<Page<DashboardInfo>>(
    `/tenant/${tenantId}/dashboards`,
    {
      params,
    },
  );
}

export function currentTenantDashboardList(params: BasicQuery) {
  return requestClient.get<Page<DashboardInfo>>('/tenant/dashboards', {
    params,
  });
}
export function customerDashboardList(params: BasicQuery, customerId: string) {
  return requestClient.get<Page<DashboardInfo>>(
    `/customer/${customerId}/dashboards`,
    {
      params,
    },
  );
}

export function getHomeDashboard() {
  return requestClient.get<HomeDashboard>('/dashboard/home');
}

export function getHomeDashboardInfo() {
  return requestClient.get<HomeDashboardInfo>('/dashboard/home/info');
}

export function getTenantHomeDashboardInfo() {
  return requestClient.get<HomeDashboardInfo>('/tenant/dashboard/home/info');
}

export function setTenantHomeDashboardInfo(
  homeDashboardInfo: any | HomeDashboardInfo,
) {
  return requestClient.post<any>(
    '/tenant/dashboard/home/info',
    homeDashboardInfo,
  );
}
