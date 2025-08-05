import { BasicModel, BasicQuery, EntitySubtype, Page, RelationsSearchParameters } from '../model/baseModel';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface AttributesEntityView {
  cs?: Array<string>;
  ss?: Array<string>;
  sh?: Array<string>;
}

export interface TelemetryEntityView {
  timeseries: Array<string>;
  attributes: AttributesEntityView;
}

export interface EntityView extends BasicModel<EntityType.ENTITY_VIEW> {
  entityId: EntityId<any>;
  tenantId?: EntityId<EntityType.TENANT>;
  customerId?: EntityId<EntityType.CUSTOMER>;
  name?: string;
  type?: string;
  keys: TelemetryEntityView;
  startTimeMs?: number;
  endTimeMs?: number;
  externalId?: EntityId<EntityType.ENTITY_VIEW>;
  additionalInfo?: any;
}

export interface EntityViewInfo extends EntityView {
  customerTitle?: string;
  customerIsPublic?: boolean;
}

export interface EntityViewSearchQuery {
  parameters?: RelationsSearchParameters;
  relationType?: string;
  entityViewTypes?: Array<string>;
}

export function getEntityViewById(entityViewId: string) {
  return defHttp.get<EntityView>({
    url: `/api/entityView/${entityViewId}`,
  });
}

export function getEntityViewInfoById(entityViewId: string) {
  return defHttp.get<EntityViewInfo>({
    url: `/api/entityView/info/${entityViewId}`,
  });
}

export function geTenantEntityView(entityViewName: string) {
  return defHttp.get<EntityView>({
    url: '/api/tenant/entityViews',
    params: { entityViewName: entityViewName },
  });
}

export function assignEntityViewToCustomer(customerId: string, entityViewId: string) {
  return defHttp.post<EntityView>({
    url: `/api/customer/${customerId}/entityView/${entityViewId}`,
  });
}

export function assignEntityViewToPublicCustomer(entityViewId: string) {
  return defHttp.post<EntityView>({
    url: `/api/customer/public/entityView/${entityViewId}`,
  });
}

export function unAssignEntityViewFromCustomer(entityViewId: string) {
  return defHttp.delete<void>({
    url: `/api/customer/entityView/${entityViewId}`,
  });
}

export function assignEntityViewToEdge(edgeId: string, entityViewId: string) {
  return defHttp.post<EntityView>({
    url: `/api/edge/${edgeId}/entityView/${entityViewId}`,
  });
}

export function unAssignEntityViewFromEdge(edgeId: string, entityViewId: string) {
  return defHttp.delete<void>({
    url: `/api/edge/${edgeId}/entityView/${entityViewId}`,
  });
}

export function getEdgeEntityViews(params: BasicQuery, edgeId: string) {
  return defHttp.get<Page<EntityView>>({
    url: `/api/edge/${edgeId}/entityViews`,
    params,
  });
}

export function getCustomerEntityViews(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<EntityView>>({
    url: `/api/customer/${customerId}/entityViews`,
    params,
  });
}

export function getCustomerEntityViewInfos(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<EntityViewInfo>>({
    url: `/api/customer/${customerId}/entityViewInfos`,
    params,
  });
}

export function getTenantEntityViews(params: BasicQuery) {
  return defHttp.get<Page<EntityView>>({
    url: '/api/tenant/entityViews',
    params,
  });
}

export function getTenantEntityViewInfos(params: BasicQuery) {
  return defHttp.get<Page<EntityViewInfo>>({
    url: '/api/tenant/entityViewInfos',
    params,
  });
}

export function findEntityViewByQuery(data: EntityViewSearchQuery | any) {
  return defHttp.postJson<Array<EntityViewInfo>>({
    url: '/api/entityViews',
    data,
  });
}

export function getEntityViewTypes() {
  return defHttp.get<Array<EntitySubtype>>({
    url: '/api/entityView/types',
  });
}

export function saveEntityView(data: EntityView | any) {
  return defHttp.postJson<EntityView>({
    url: `/api/entityView`,
    data,
  });
}

export function deleteEntityView(entityViewId: string) {
  return defHttp.delete<void>({
    url: `/api/entityView/${entityViewId}`,
  });
}
