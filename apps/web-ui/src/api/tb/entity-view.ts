/**
 * 实体视图接口
 * 契约参考:后端 EntityViewController.java
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 暴露的遥测 / 属性键集合(TelemetryEntityView) */
export interface TelemetryEntityView {
  attributes?: {
    /** 客户端属性 */
    cs?: string[];
    /** 共享属性 */
    sh?: string[];
    /** 服务端属性 */
    ss?: string[];
  };
  timeseries?: string[];
}

/** 实体视图实体(org.thingsboard.server.common.data.EntityView) */
export interface EntityView extends BaseData<EntityType.ENTITY_VIEW> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
  };
  customerId?: EntityId<EntityType.CUSTOMER>;
  endTimeMs?: number;
  /** 关联的目标实体(设备或资产) */
  entityId?: EntityId<EntityType.ASSET | EntityType.DEVICE>;
  keys?: TelemetryEntityView;
  name: string;
  startTimeMs?: number;
  tenantId?: EntityId<EntityType.TENANT>;
  type: string;
}

/** 实体视图信息(EntityViewInfo extends EntityView,列表展示用) */
export interface EntityViewInfo extends EntityView {
  customerIsPublic?: boolean;
  customerTitle?: string;
}

/** 实体子类型(EntitySubtype),用于类型下拉 */
export interface EntitySubtype {
  entityType: EntityType;
  tenantId?: EntityId<EntityType.TENANT>;
  type: string;
}

/** 租户实体视图分页列表(GET /api/tenant/entityViewInfos) */
export function getTenantEntityViewInfos(
  pageLink: PageLink,
  params?: { type?: string },
) {
  return requestClient.get<PageData<EntityViewInfo>>(
    '/tenant/entityViewInfos',
    {
      params: { ...pageLink, ...params },
    },
  );
}

/** 客户实体视图分页列表(GET /api/customer/{customerId}/entityViewInfos) */
export function getCustomerEntityViewInfos(
  customerId: string,
  pageLink: PageLink,
) {
  return requestClient.get<PageData<EntityViewInfo>>(
    `/customer/${customerId}/entityViewInfos`,
    {
      params: { ...pageLink },
    },
  );
}

/** 实体视图详情(GET /api/entityView/{entityViewId}) */
export function getEntityViewById(entityViewId: string) {
  return requestClient.get<EntityView>(`/entityView/${entityViewId}`);
}

/** 实体视图信息详情(GET /api/entityView/info/{entityViewId}) */
export function getEntityViewInfoById(entityViewId: string) {
  return requestClient.get<EntityViewInfo>(`/entityView/info/${entityViewId}`);
}

/** 保存实体视图(POST /api/entityView,带 id 为更新) */
export function saveEntityView(entityView: EntityView) {
  return requestClient.post<EntityView>('/entityView', entityView);
}

/** 删除实体视图(DELETE /api/entityView/{entityViewId}) */
export function deleteEntityView(entityViewId: string): Promise<void> {
  return requestClient.delete(`/entityView/${entityViewId}`);
}

/** 分配实体视图给客户(POST /api/customer/{customerId}/entityView/{entityViewId}) */
export function assignEntityViewToCustomer(
  customerId: string,
  entityViewId: string,
) {
  return requestClient.post<EntityView>(
    `/customer/${customerId}/entityView/${entityViewId}`,
  );
}

/** 取消分配(DELETE /api/customer/entityView/{entityViewId}) */
export function unassignEntityViewFromCustomer(entityViewId: string) {
  return requestClient.delete<EntityView>(
    `/customer/entityView/${entityViewId}`,
  );
}

/** 实体视图类型列表(GET /api/entityView/types) */
export function getEntityViewTypes() {
  return requestClient.get<EntitySubtype[]>('/entityView/types');
}
