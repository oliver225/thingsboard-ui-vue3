/**
 * 部件包接口(SYS_ADMIN / TENANT_ADMIN)
 * 契约参考:后端 WidgetsBundleController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 部件包实体(org.thingsboard.server.common.data.widget.WidgetsBundle) */
export interface WidgetsBundle extends BaseData<EntityType.WIDGETS_BUNDLE> {
  alias?: string;
  description?: string;
  externalId?: EntityId<EntityType.WIDGETS_BUNDLE>;
  image?: string;
  /** 与 title 相同,只读字段 */
  name?: string;
  order?: number;
  /** 是否包含 SCADA 符号部件 */
  scada?: boolean;
  tenantId?: EntityId<EntityType.TENANT>;
  title?: string;
}

/** 部件包详情(GET /api/widgetsBundle/{widgetsBundleId}) */
export function getWidgetsBundleById(
  widgetsBundleId: string,
  inlineImages = false,
) {
  return requestClient.get<WidgetsBundle>(`/widgetsBundle/${widgetsBundleId}`, {
    params: { inlineImages },
  });
}

/** 保存部件包(POST /api/widgetsBundle,带 id 为更新) */
export function saveWidgetsBundle(widgetsBundle: WidgetsBundle) {
  return requestClient.post<WidgetsBundle>('/widgetsBundle', widgetsBundle);
}

/** 删除部件包(DELETE /api/widgetsBundle/{widgetsBundleId}) */
export function deleteWidgetsBundle(widgetsBundleId: string): Promise<void> {
  return requestClient.delete(`/widgetsBundle/${widgetsBundleId}`);
}

/** 部件包分页列表(GET /api/widgetsBundles) */
export function getWidgetsBundles(pageLink: PageLink) {
  return requestClient.get<PageData<WidgetsBundle>>('/widgetsBundles', {
    params: { ...pageLink },
  });
}
