import { Function } from './deviceProfile';
import { Scope } from '/@/enums/telemetryEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface LastTelemetrySubscription extends Recordable {
  subscriptionId?: number;
  errorCode?: number;
  errorMsg?: string;
  data?: Record<string, Array<number | string>>;
  latestValues?: Record<string, number>;
}
export interface kvEntity extends Recordable {
  key?: string;
  value?: object;
  lastUpdateTs?: number;
  property?: Function;
}

export interface TsData extends Recordable {
  ts: number;
  value: object;
}

export type TsKvEntity = Record<string, { data: Array<TsData>; property?: Function }>;

export interface TelemetryQuery extends Recordable {
  entityType: EntityType;
  entityId: string;
  keys: string; // 逗号分隔
  startTs: number;
  endTs: number;
  interval?: number;
  limit?: number;
  agg?: 'MIN' | 'MAX' | 'AVG' | 'SUM' | 'COUNT' | 'NONE';
  orderBy?: 'ASC' | 'DESC';
  useStrictDataTypes?: boolean; // 格式化成字符串
}

export interface TelemetryDelete extends Recordable {
  entityType: EntityType;
  entityId: string;
  keys: string; // 逗号分隔
  deleteAllDataForKeys?: boolean; // 删除所有
  startTs?: number;
  endTs?: number;
  rewriteLatestIfDeleted?: boolean; // 重写最新数据
}

export function getAttributeKeys(entityId: EntityId<any>) {
  return defHttp.get<Array<string>>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/keys/attributes`,
  });
}

export function getAttributeKeysByScope(entityId: EntityId<any>, scope: Scope) {
  return defHttp.get<Array<string>>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/keys/attributes/${scope}`,
  });
}

export function getTimeseriesKeys(entityId: EntityId<any>) {
  return defHttp.get<Array<string>>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/keys/timeseries`,
  });
}

export function getAttributes(entityId: EntityId<any>, keys?: string) {
  return defHttp.get<Array<kvEntity>>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/values/attributes`,
    params: { keys: keys },
  });
}

export function getAttributesByScope(entityId: EntityId<any>, scope: Scope) {
  return defHttp.get<Array<kvEntity>>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/values/attributes/${scope}`,
  });
}

export function getLatestTimeseries(entityId: EntityId<any>, keys?: string, useStrictDataTypes?: boolean) {
  //useStrictDataTypes  数值转换为字符串
  return defHttp.get<TsKvEntity>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/values/timeseries`,
    params: { keys: keys, useStrictDataTypes: useStrictDataTypes },
  });
}

export function getTimeseries(params: TelemetryQuery) {
  return defHttp.get<TsKvEntity>({
    url: `/api/plugins/telemetry/${params.entityType}/${params.entityId}/values/timeseries`,
    params,
  });
}

export function deleteDeviceAttributes(deviceId: string, scope: Scope, keys: Array<string>) {
  return defHttp.delete<void>({
    url: `/api/plugins/telemetry/${deviceId}/${scope}`,
    params: { keys: keys.join(',') },
  });
}

export function deleteEntityAttributes(entityId: EntityId<any>, scope: Scope, keys: Array<string>) {
  return defHttp.delete<void>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/${scope}`,
    params: { keys: keys.join(',') },
  });
}

export function saveDeviceAttributes(deviceId: string, scope: Scope.SERVER_SCOPE | Scope.SHARED_SCOPE, data: any) {
  return defHttp.postJson<void>({
    url: `/api/plugins/telemetry/${deviceId}/${scope}`,
    data,
  });
}

export function saveEntityAttributesV1(
  entityId: EntityId<any>,
  scope: Scope.SERVER_SCOPE | Scope.SHARED_SCOPE,
  data: any,
) {
  return defHttp.postJson<void>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/${scope}`,
    data,
  });
}
export function saveEntityAttributesV2(
  entityId: EntityId<any>,
  scope: Scope.SERVER_SCOPE | Scope.SHARED_SCOPE,
  data: any,
) {
  return defHttp.postJson<void>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/attributes/${scope}`,
    data,
  });
}

export function saveEntityTelemetry(entityId: EntityId<any>, data: any) {
  return defHttp.postJson<void>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/timeseries/any`,
    data,
  });
}

export function saveEntityTelemetryWithTTL(entityId: EntityId<any>, ttl: number, data: any) {
  return defHttp.postJson<void>({
    url: `/api/plugins/telemetry/${entityId.entityType}/${entityId.id}/timeseries/any/${ttl}`,
    data,
  });
}

export function deleteEntityTimeseries(params: TelemetryDelete) {
  return defHttp.delete<void>({
    url: `/api/plugins/telemetry/${params.entityType}/${params.entityId}/timeseries/delete`,
    params,
  });
}
