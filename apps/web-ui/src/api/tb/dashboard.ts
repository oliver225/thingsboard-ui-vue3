/**
 * 仪表板、客户分配与首页设置接口。
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
  image?: null | string;
  mobileHide?: boolean;
  mobileOrder?: null | number;
  name?: string;
  title: string;
  tenantId?: EntityId<EntityType.TENANT>;
  version?: number;
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

/** 导出完整仪表板，可同时包含图片等依赖资源。 */
export function exportDashboard(dashboardId: string, includeResources = true) {
  return requestClient.get<Dashboard>(`/dashboard/${dashboardId}`, {
    params: { includeResources },
  });
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

/** 替换仪表板的客户分配。 */
export function updateDashboardCustomers(
  dashboardId: string,
  customerIds: string[],
) {
  return requestClient.post<Dashboard>(
    `/dashboard/${dashboardId}/customers`,
    customerIds,
  );
}

/** 追加客户分配，不影响其他已分配客户。 */
export function addDashboardCustomers(
  dashboardId: string,
  customerIds: string[],
) {
  return requestClient.post<Dashboard>(
    `/dashboard/${dashboardId}/customers/add`,
    customerIds,
  );
}

/** 仅移除指定客户的分配。 */
export function removeDashboardCustomers(
  dashboardId: string,
  customerIds: string[],
) {
  return requestClient.post<Dashboard>(
    `/dashboard/${dashboardId}/customers/remove`,
    customerIds,
  );
}

export function makeDashboardPublic(dashboardId: string) {
  return requestClient.post<Dashboard>(
    `/customer/public/dashboard/${dashboardId}`,
  );
}

export function makeDashboardPrivate(dashboardId: string) {
  return requestClient.delete<Dashboard>(
    `/customer/public/dashboard/${dashboardId}`,
  );
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

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteDashboards(dashboardIds: string[]) {
  const ids = [...new Set(dashboardIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteDashboard(id)),
  );
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    const id = ids[index];
    if (!id) return;
    (result.status === 'fulfilled' ? deletedIds : failedIds).push(id);
  });
  return { deletedIds, failedIds };
}
