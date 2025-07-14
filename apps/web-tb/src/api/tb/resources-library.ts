import type { EntityId, EntityType } from '@vben/constants';
import type { Recordable } from '@vben/types';

import type { BasicQuery, Page } from '#/api/model';

import { requestClient } from '#/api/request';

export namespace Resource {
  export interface ResourceInfo {
    id: EntityId<EntityType.TB_RESOURCE>;
    tenantId?: EntityId<EntityType.TENANT>;
    title?: string;
    resourceType?:
      | 'DASHBOARD'
      | 'IMAGE'
      | 'JKS'
      | 'JS_MODULE'
      | 'LWM2M_MODEL'
      | 'PKCS_12';
    resourceSubType?: 'EXTENSION' | 'IMAGE' | 'MODULE' | 'SCADA_SYMBOL';
    resourceKey?: string;
    imageType?: 'system' | 'tenant';
    public?: boolean;
    link?: string;
    publicLink?: string;
    publicResourceKey?: string;
    searchText?: string;
    etag?: string;
    fileName?: string;
    descriptor?: Recordable<any>;
    externalId?: EntityId<EntityType.TB_RESOURCE>;
    createdTime?: number;
  }

  export interface Resource extends ResourceInfo {
    preview?: string;
    data?: any;
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
    id?: number; // LwM2M Object id
    keyId: string; // LwM2M Object key id
    name: string;
    multiple: boolean;
    mandatory: boolean;
    instances: [LwM2mInstance];
  }

  export interface ResourceQuery extends BasicQuery {
    resourceType?: 'JKS' | 'JS_MODULE' | 'LWM2M_MODEL' | 'PKCS_12';
    resourceSubType?: 'EXTENSION' | 'MODULE';
  }
}

export function getResourceListApi(params: Resource.ResourceQuery) {
  return requestClient.get<Page<Resource.ResourceInfo>>('/resource', params);
}

export function getTenantResourceListApi(params: Resource.ResourceQuery) {
  return requestClient.get<Page<Resource.ResourceInfo>>(
    '/resource/tenant',
    params,
  );
}

export function getLwm2mListObjectsPageApi(params: BasicQuery) {
  return requestClient.get<[Resource.LwM2mObject]>(
    '/resource/lwm2m/page',
    params,
  );
}

export function getLwm2mListObjectsApi(params: {
  objectIds?: [string];
  sortOrder: 'ASC' | 'DESC';
  sortProperty: string;
}) {
  return requestClient.get<[Resource.LwM2mObject]>('/resource/lwm2m', params);
}

export function saveResourceApi(data?: any | Resource.Resource) {
  return requestClient.post<Resource.ResourceInfo>('/resource', data);
}

export function getResourceByIdApi(resourceId: string) {
  return requestClient.get<Resource.Resource>(`/api/resource/${resourceId}`);
}

export function getResourceInfoByIdApi(resourceId: string) {
  return requestClient.get<Resource.ResourceInfo>(
    `/resource/info/${resourceId}`,
  );
}

export function getResourceInfoApi(
  resourceType: 'dashboard' | 'jks' | 'js_module' | 'lwm2m_model' | 'pkcs_12',
  scope: 'system' | 'tenant',
  key: string,
) {
  return requestClient.get<Resource.ResourceInfo>(
    `/resource/${resourceType}/${scope}/${key}/info`,
  );
}

export function deleteResourceApi(resourceId: string) {
  return requestClient.delete<{
    references: Recordable<any>;
    success: boolean;
  }>(`/resource/${resourceId}`);
}

export function downloadResourceApi(resourceId: string) {
  return requestClient.get<any>(`/resource/${resourceId}/download`);
}
