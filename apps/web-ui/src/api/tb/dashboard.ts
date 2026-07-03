/**
 * 仪表板接口(本批仅用于个人资料的「主页仪表板」下拉)
 * 契约参考:DashboardController.java
 */
import type { EntityType } from '#/enums';
import type { EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 分配的客户摘要(ShortCustomerInfo) */
export interface ShortCustomerInfo {
  customerId?: EntityId<EntityType.CUSTOMER>;
  public?: boolean;
  title?: string;
}

/** 仪表板摘要(DashboardInfo) */
export interface DashboardInfo {
  assignedCustomers?: ShortCustomerInfo[];
  createdTime?: number;
  id: EntityId<EntityType.DASHBOARD>;
  image?: string;
  mobileHide?: boolean;
  mobileOrder?: null | number;
  name?: string;
  title: string;
}

/** 仪表板实体(Dashboard,含完整配置 configuration) */
export interface Dashboard extends DashboardInfo {
  /** 布局/部件/实体别名等完整配置,结构复杂,编辑器另做 */
  configuration?: Record<string, any>;
}

/** 租户仪表板分页(GET /api/tenant/dashboards) */
export function getTenantDashboards(pageLink: PageLink) {
  return requestClient.get<PageData<DashboardInfo>>('/tenant/dashboards', {
    params: { ...pageLink },
  });
}

/** 仪表板摘要详情(GET /api/dashboard/info/{dashboardId}) */
export function getDashboardInfoById(dashboardId: string) {
  return requestClient.get<DashboardInfo>(`/dashboard/info/${dashboardId}`);
}

/** 仪表板详情(GET /api/dashboard/{dashboardId},含完整配置) */
export function getDashboardById(dashboardId: string) {
  return requestClient.get<Dashboard>(`/dashboard/${dashboardId}`);
}

/** 保存仪表板(POST /api/dashboard,带 id 为更新;新建时无 id) */
export function saveDashboard(
  dashboard: Partial<Dashboard> & { title: string },
) {
  return requestClient.post<Dashboard>('/dashboard', dashboard);
}

/** 删除仪表板(DELETE /api/dashboard/{dashboardId}) */
export function deleteDashboard(dashboardId: string): Promise<void> {
  return requestClient.delete(`/dashboard/${dashboardId}`);
}

/** 客户仪表板分页(GET /api/customer/{customerId}/dashboards) */
export function getCustomerDashboards(customerId: string, pageLink: PageLink) {
  return requestClient.get<PageData<DashboardInfo>>(
    `/customer/${customerId}/dashboards`,
    {
      params: { ...pageLink },
    },
  );
}

/** 首页仪表板信息(HomeDashboardInfo) */
export interface HomeDashboardInfo {
  dashboardId?: EntityId<EntityType.DASHBOARD> | null;
  hideDashboardToolbar?: boolean;
}

/** 获取当前租户的首页仪表板设置(GET /api/tenant/dashboard/home/info,TENANT_ADMIN) */
export function getTenantHomeDashboardInfo() {
  return requestClient.get<HomeDashboardInfo>('/tenant/dashboard/home/info');
}

/** 保存当前租户的首页仪表板设置(POST /api/tenant/dashboard/home/info,TENANT_ADMIN) */
export function setTenantHomeDashboardInfo(
  info: HomeDashboardInfo,
): Promise<void> {
  return requestClient.post('/tenant/dashboard/home/info', info);
}
