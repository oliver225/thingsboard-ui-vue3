import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { EntityType } from '/@/enums/entityTypeEnum';
import { defHttp } from '/@/utils/http/axios';

export interface ResourceInfo extends BasicModel<EntityType.TB_RESOURCE> {
  tenantId?: EntityId<EntityType.TENANT>;
  title?: string;
  resourceType?: 'LWM2M_MODEL' | 'JKS' | 'PKCS_12';
  resourceKey?: string;
  public?: boolean;
  publicResourceKey?: string;
  searchText?: string;
  etag?: string;
  fileName?: string;
  descriptor?: Recordable;
  externalId?: EntityId<EntityType.TB_RESOURCE>;
}

export interface Resource extends ResourceInfo {
  fileName?: string;
  data?: string;
}

export interface LwM2mResourceObserve {
  id?: number;
  name: string;
  observe: boolean;
  attribute: boolean;
  telemetry: boolean;
  keyName: string;
}

export interface LwM2mInstance {
  resources?: [LwM2mResourceObserve];
}

export interface LwM2mObject {
  id?: number; //LwM2M Object id
  keyId: string; //LwM2M Object key id
  name: string;
  multiple: boolean;
  mandatory: boolean;
  instances: [LwM2mInstance];
}

export function saveResource(data?: Resource | any) {
  return defHttp.post<Resource>({
    url: '/api/resource',
    data,
  });
}

export function getResourceById(resourceId: string) {
  return defHttp.get<Resource>({
    url: `/api/resource/${resourceId}`,
  });
}

export function getResourceInfoById(resourceId: string) {
  return defHttp.get<Resource>({
    url: `/api/resource/info/${resourceId}`,
  });
}

export function resourceDownload(resourceId: string) {
  return defHttp.get<any>({
    url: `/api/resource/${resourceId}/download`,
  });
}

export function deleteResource(resourceId: string) {
  return defHttp.delete<void>({
    url: `/api/resource/${resourceId}`,
  });
}

export function resourceList(params: BasicQuery) {
  return defHttp.get<Page<ResourceInfo>>({
    url: `/api/resource`,
    params,
  });
}

export function getLwm2mByObjects(params: { sortProperty: string; sortOrder: 'ASC' | 'DESC'; objectIds?: [string] }) {
  return defHttp.get<[LwM2mObject]>({
    url: `/api/resource/lwm2m`,
    params,
  });
}

export function lwm2mObjectList(params: BasicQuery) {
  return defHttp.get<[LwM2mObject]>({
    url: `/api/resource/lwm2m/page`,
    params,
  });
}
