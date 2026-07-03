/**
 * 部件(部件类型)接口(SYS_ADMIN / TENANT_ADMIN)
 */
import type { EntityType, WidgetCategory } from '#/enums';
import type {
  BaseData,
  EntityId,
  EntityInfo,
  PageData,
  PageLink,
} from '#/types/tb';

import { requestClient } from '#/api/request';

/** 部件类型基础信息(org.thingsboard.server.common.data.widget.BaseWidgetType) */
export interface BaseWidgetType extends BaseData<EntityType.WIDGET_TYPE> {
  deprecated?: boolean;
  /** 唯一 FQN,在仪表板中引用部件类型 */
  fqn?: string;
  name?: string;
  scada?: boolean;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 部件类型详情(org.thingsboard.server.common.data.widget.WidgetTypeDetails) */
export interface WidgetTypeDetails extends BaseWidgetType {
  description?: string;
  /** 描述部件类型的复杂 JSON 对象 */
  descriptor?: Record<string, any>;
  externalId?: EntityId<EntityType.WIDGET_TYPE>;
  image?: string;
  resources?: any[];
  tags?: string[];
}

/** 部件类型摘要(org.thingsboard.server.common.data.widget.WidgetTypeInfo) */
export interface WidgetTypeInfo extends BaseWidgetType {
  /** 所属部件包(EntityInfo:id + name) */
  bundles?: EntityInfo[];
  description?: string;
  image?: string;
  tags?: string[];
  /** 部件类别(timeseries / latest / rpc / alarm / static) */
  widgetType?: WidgetCategory;
}

/** 部件类型详情(GET /api/widgetType/{widgetTypeId}) */
export function getWidgetTypeById(
  widgetTypeId: string,
  includeResources = false,
) {
  return requestClient.get<WidgetTypeDetails>(`/widgetType/${widgetTypeId}`, {
    params: { includeResources },
  });
}

/** 保存部件类型(POST /api/widgetType,带 id 为更新) */
export function saveWidgetType(
  widgetType: WidgetTypeDetails,
  updateExistingByFqn = false,
) {
  return requestClient.post<WidgetTypeDetails>('/widgetType', widgetType, {
    params: { updateExistingByFqn },
  });
}

/** 删除部件类型(DELETE /api/widgetType/{widgetTypeId}) */
export function deleteWidgetType(widgetTypeId: string): Promise<void> {
  return requestClient.delete(`/widgetType/${widgetTypeId}`);
}

/** 部件类型分页列表(GET /api/widgetTypes,可按 widgetTypeList 类别筛选;多个用逗号分隔) */
export function getWidgetTypes(
  pageLink: PageLink & { widgetTypeList?: string | string[] },
) {
  return requestClient.get<PageData<WidgetTypeInfo>>('/widgetTypes', {
    params: { ...pageLink },
  });
}
