/** 前端契约对应后端 TelemetryController，包括兼容版本的路径。 */
import type { AttributeScope } from '#/enums';
import type { EntityId } from '#/types/tb';

import { requestClient } from '#/api/request';

export type TelemetryValue =
  | boolean
  | null
  | number
  | string
  | TelemetryValue[]
  | { [key: string]: TelemetryValue };
export type TelemetryValues = Record<string, TelemetryValue>;
export type WritableAttributeScope =
  | AttributeScope.SERVER_SCOPE
  | AttributeScope.SHARED_SCOPE;
export type Aggregation = 'AVG' | 'COUNT' | 'MAX' | 'MIN' | 'NONE' | 'SUM';
export type IntervalType =
  | 'MILLISECONDS'
  | 'MONTH'
  | 'QUARTER'
  | 'WEEK'
  | 'WEEK_ISO';

export interface AttributeData {
  key: string;
  lastUpdateTs: number;
  value: TelemetryValue;
}

export interface TsData {
  ts: number;
  /** 默认返回字符串；useStrictDataTypes=true 时保留原始 JSON 值类型。 */
  value: TelemetryValue;
}
export type Timeseries = Record<string, TsData[]>;

export interface TelemetryKeysQuery {
  /** 逗号分隔的键。键本身含逗号时请用 key。 */
  keys?: string;
  /** 重复的 key 查询参数，后端优先采用该参数，完整保留键中的逗号。 */
  key?: string[];
}

export interface LatestTimeseriesQuery extends TelemetryKeysQuery {
  useStrictDataTypes?: boolean;
}

export interface TimeseriesQuery extends LatestTimeseriesQuery {
  startTs: number;
  endTs: number;
  intervalType?: IntervalType;
  /** 聚合间隔（毫秒），默认 0。 */
  interval?: number;
  timeZone?: string;
  /** 非聚合查询的最大点数，默认 100。 */
  limit?: number;
  /** 默认 NONE。 */
  agg?: Aggregation;
  /** 默认 DESC。 */
  orderBy?: 'ASC' | 'DESC';
}

export interface TimestampedTelemetry {
  ts: number;
  values: TelemetryValues;
}
/** 当前时间的数据、指定时间的数据，或多组指定时间的数据。 */
export type SaveTelemetryRequest =
  | TelemetryValues
  | TimestampedTelemetry
  | TimestampedTelemetry[];

export type DeleteTimeseriesQuery = {
  /** 默认 true。 */
  deleteLatest?: boolean;
  /** 默认 false。 */
  rewriteLatestIfDeleted?: boolean;
} & TelemetryKeysQuery &
  (
    | { deleteAllDataForKeys: true; startTs?: number; endTs?: number }
    | {
        deleteAllDataForKeys?: false;
        startTs: number;
        endTs: number;
      }
  );

const telemetryUrl = '/plugins/telemetry';
function entityUrl(entityId: EntityId) {
  return `${telemetryUrl}/${entityId.entityType}/${entityId.id}`;
}

/** GET /{entityType}/{entityId}/keys/attributes：所有作用域的属性键。 */
export function getAttributeKeys(entityId: EntityId) {
  return requestClient.get<string[]>(`${entityUrl(entityId)}/keys/attributes`);
}

/** GET /{entityType}/{entityId}/keys/attributes/{scope}。 */
export function getAttributeKeysByScope(
  entityId: EntityId,
  scope: AttributeScope,
) {
  return requestClient.get<string[]>(
    `${entityUrl(entityId)}/keys/attributes/${scope}`,
  );
}

/** GET /{entityType}/{entityId}/values/attributes：不传键时读取全部属性。 */
export function getAttributes(entityId: EntityId, params?: TelemetryKeysQuery) {
  return requestClient.get<AttributeData[]>(
    `${entityUrl(entityId)}/values/attributes`,
    { params, paramsSerializer: { indexes: null } },
  );
}

/** GET /{entityType}/{entityId}/values/attributes/{scope}。 */
export function getAttributesByScope(
  entityId: EntityId,
  scope: AttributeScope,
  params?: TelemetryKeysQuery,
) {
  return requestClient.get<AttributeData[]>(
    `${entityUrl(entityId)}/values/attributes/${scope}`,
    { params, paramsSerializer: { indexes: null } },
  );
}

/** GET /{entityType}/{entityId}/keys/timeseries。 */
export function getTimeseriesKeys(entityId: EntityId) {
  return requestClient.get<string[]>(`${entityUrl(entityId)}/keys/timeseries`);
}

/** GET /{entityType}/{entityId}/values/timeseries：最新值。 */
export function getLatestTimeseries(
  entityId: EntityId,
  params?: LatestTimeseriesQuery,
) {
  return requestClient.get<Timeseries>(
    `${entityUrl(entityId)}/values/timeseries`,
    { params, paramsSerializer: { indexes: null } },
  );
}

/** 兼容历史路径；同一路径带 startTs/endTs 时查询历史数据。 */
export function getTimeseries(entityId: EntityId, params: TimeseriesQuery) {
  return requestClient.get<Timeseries>(
    `${entityUrl(entityId)}/values/timeseries`,
    { params, paramsSerializer: { indexes: null } },
  );
}

/** GET /{entityType}/{entityId}/values/timeseries/history。 */
export function getTimeseriesHistory(
  entityId: EntityId,
  params: TimeseriesQuery,
) {
  return requestClient.get<Timeseries>(
    `${entityUrl(entityId)}/values/timeseries/history`,
    { params, paramsSerializer: { indexes: null } },
  );
}

/** 兼容设备属性保存路径 POST /{deviceId}/{scope}。 */
export function saveDeviceAttributes(
  deviceId: string,
  scope: WritableAttributeScope,
  attributes: TelemetryValues,
): Promise<void> {
  return requestClient.post(`${telemetryUrl}/${deviceId}/${scope}`, attributes);
}

/** 兼容 V1 路径 POST /{entityType}/{entityId}/{scope}。 */
export function saveEntityAttributesV1(
  entityId: EntityId,
  scope: WritableAttributeScope,
  attributes: TelemetryValues,
): Promise<void> {
  return requestClient.post(`${entityUrl(entityId)}/${scope}`, attributes);
}

/** POST /{entityType}/{entityId}/attributes/{scope}。平台仅允许写服务端和共享属性。 */
export function saveEntityAttributesV2(
  entityId: EntityId,
  scope: WritableAttributeScope,
  attributes: TelemetryValues,
): Promise<void> {
  return requestClient.post(
    `${entityUrl(entityId)}/attributes/${scope}`,
    attributes,
  );
}

/** POST /{entityType}/{entityId}/timeseries/{scope}；scope 不参与后端处理。 */
export function saveEntityTelemetry(
  entityId: EntityId,
  data: SaveTelemetryRequest,
  scope = 'ANY',
): Promise<void> {
  return requestClient.post(
    `${entityUrl(entityId)}/timeseries/${encodeURIComponent(scope)}`,
    data,
  );
}

/** POST /{entityType}/{entityId}/timeseries/{scope}/{ttl}。TTL 单位秒，仅 Cassandra 生效。 */
export function saveEntityTelemetryWithTTL(
  entityId: EntityId,
  data: SaveTelemetryRequest,
  ttl: number,
  scope = 'ANY',
): Promise<void> {
  return requestClient.post(
    `${entityUrl(entityId)}/timeseries/${encodeURIComponent(scope)}/${ttl}`,
    data,
  );
}

/** DELETE /{entityType}/{entityId}/timeseries/delete。未选择全部删除时必须提供起止时间。 */
export function deleteEntityTimeseries(
  entityId: EntityId,
  params: DeleteTimeseriesQuery,
): Promise<void> {
  return requestClient.delete(`${entityUrl(entityId)}/timeseries/delete`, {
    params,
    paramsSerializer: { indexes: null },
  });
}

/** 兼容设备属性删除路径 DELETE /{deviceId}/{scope}。 */
export function deleteDeviceAttributes(
  deviceId: string,
  scope: AttributeScope,
  params: TelemetryKeysQuery,
): Promise<void> {
  return requestClient.delete(`${telemetryUrl}/${deviceId}/${scope}`, {
    params,
    paramsSerializer: { indexes: null },
  });
}

/** DELETE /{entityType}/{entityId}/{scope}，可删除客户端属性；忽略不存在的键。 */
export function deleteEntityAttributes(
  entityId: EntityId,
  scope: AttributeScope,
  params: TelemetryKeysQuery,
): Promise<void> {
  return requestClient.delete(`${entityUrl(entityId)}/${scope}`, {
    params,
    paramsSerializer: { indexes: null },
  });
}
