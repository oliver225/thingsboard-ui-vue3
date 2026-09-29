/** 实体查询接口与 JSON 契约，对应后端 EntityQueryController.java。 */
import type { AlarmInfo } from './alarm';
import type { TelemetryValue } from './telemetry';

import type {
  AlarmSearchStatus,
  AlarmSeverity,
  AttributeScope,
  EntityType,
  RelationDirection,
} from '#/enums';
import type { EntityId, PageData } from '#/types/tb';

import { requestClient } from '#/api/request';

export type AliasEntityType =
  | 'CURRENT_CUSTOMER'
  | 'CURRENT_TENANT'
  | 'CURRENT_USER'
  | 'CURRENT_USER_OWNER';

/** 普通实体必须有 id；当前用户等别名由后端解析，id 可省略。 */
export type AliasEntityId =
  | EntityId
  | { entityType: AliasEntityType; id?: string };

export interface SingleEntityFilter {
  type: 'singleEntity';
  singleEntity: AliasEntityId;
}

export interface EntityListFilter {
  type: 'entityList';
  entityType: EntityType;
  entityList: string[];
}

export interface EntityNameFilter {
  type: 'entityName';
  entityType: EntityType;
  entityNameFilter?: string;
}

export interface EntityTypeFilter {
  type: 'entityType';
  entityType: EntityType;
}

export interface AssetTypeFilter {
  type: 'assetType';
  assetType?: string;
  assetTypes?: string[];
  assetNameFilter?: string;
}

export interface DeviceTypeFilter {
  type: 'deviceType';
  deviceType?: string;
  deviceTypes?: string[];
  deviceNameFilter?: string;
}

export interface EdgeTypeFilter {
  type: 'edgeType';
  edgeType?: string;
  edgeTypes?: string[];
  edgeNameFilter?: string;
}

export interface EntityViewTypeFilter {
  type: 'entityViewType';
  entityViewType?: string;
  entityViewTypes?: string[];
  entityViewNameFilter?: string;
}

export interface ApiUsageStateFilter {
  type: 'apiUsageState';
  customerId?: EntityId<EntityType.CUSTOMER>;
}

export interface RelationEntityTypeFilter {
  relationType: string;
  entityTypes: EntityType[];
  negate?: boolean;
}

export interface RelationsQueryFilter {
  type: 'relationsQuery';
  rootEntity?: AliasEntityId;
  multiRoot?: boolean;
  multiRootEntitiesType?: EntityType;
  multiRootEntityIds?: string[];
  direction: RelationDirection;
  filters?: RelationEntityTypeFilter[];
  maxLevel?: number;
  fetchLastLevelOnly?: boolean;
  negate?: boolean;
  rootStateEntity?: boolean;
  defaultStateEntity?: AliasEntityId;
}

/** 各实体关系搜索筛选的公共字段。 */
export interface EntitySearchQueryFilter {
  rootEntity: AliasEntityId;
  relationType?: string;
  direction: RelationDirection;
  maxLevel?: number;
  fetchLastLevelOnly?: boolean;
  rootStateEntity?: boolean;
  defaultStateEntity?: AliasEntityId;
}

export interface AssetSearchQueryFilter extends EntitySearchQueryFilter {
  type: 'assetSearchQuery';
  assetTypes: string[];
}

export interface DeviceSearchQueryFilter extends EntitySearchQueryFilter {
  type: 'deviceSearchQuery';
  deviceTypes: string[];
}

export interface EntityViewSearchQueryFilter extends EntitySearchQueryFilter {
  type: 'entityViewSearchQuery';
  entityViewTypes: string[];
}

export interface EdgeSearchQueryFilter extends EntitySearchQueryFilter {
  type: 'edgeSearchQuery';
  edgeTypes: string[];
}

/** type 与后端 @JsonSubTypes 的名称保持一致。 */
export type EntityFilter =
  | ApiUsageStateFilter
  | AssetSearchQueryFilter
  | AssetTypeFilter
  | DeviceSearchQueryFilter
  | DeviceTypeFilter
  | EdgeSearchQueryFilter
  | EdgeTypeFilter
  | EntityListFilter
  | EntityNameFilter
  | EntityTypeFilter
  | EntityViewSearchQueryFilter
  | EntityViewTypeFilter
  | RelationsQueryFilter
  | SingleEntityFilter;
export type EntityFilterType = EntityFilter['type'];

export type EntityKeyType =
  | 'ALARM_FIELD'
  | 'ATTRIBUTE'
  | 'CLIENT_ATTRIBUTE'
  | 'ENTITY_FIELD'
  | 'SERVER_ATTRIBUTE'
  | 'SHARED_ATTRIBUTE'
  | 'TIME_SERIES';
export type EntityKeyValueType = 'BOOLEAN' | 'DATE_TIME' | 'NUMERIC' | 'STRING';

export interface EntityKey {
  type: EntityKeyType;
  key: string;
}

export type DynamicValueSourceType =
  | 'CURRENT_CUSTOMER'
  | 'CURRENT_DEVICE'
  | 'CURRENT_TENANT'
  | 'CURRENT_USER';

export interface DynamicValue<T> {
  sourceType: DynamicValueSourceType;
  sourceAttribute: string;
  inherit?: boolean;
  resolvedValue?: null | T;
}

export interface FilterPredicateValue<T> {
  defaultValue?: null | T;
  userValue?: null | T;
  dynamicValue?: DynamicValue<T> | null;
}

export type BooleanOperation = 'EQUAL' | 'NOT_EQUAL';
export type NumericOperation =
  | 'GREATER'
  | 'GREATER_OR_EQUAL'
  | 'LESS'
  | 'LESS_OR_EQUAL'
  | BooleanOperation;
export type StringOperation =
  | 'CONTAINS'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT_CONTAINS'
  | 'NOT_IN'
  | 'STARTS_WITH'
  | BooleanOperation;
export type ComplexOperation = 'AND' | 'OR';

export interface StringFilterPredicate {
  type: 'STRING';
  operation: StringOperation;
  value: FilterPredicateValue<string>;
  ignoreCase?: boolean;
}

export interface NumericFilterPredicate {
  type: 'NUMERIC';
  operation: NumericOperation;
  value: FilterPredicateValue<number>;
}

export interface BooleanFilterPredicate {
  type: 'BOOLEAN';
  operation: BooleanOperation;
  value: FilterPredicateValue<boolean>;
}

export type SimpleKeyFilterPredicate =
  | BooleanFilterPredicate
  | NumericFilterPredicate
  | StringFilterPredicate;

export interface ComplexFilterPredicate {
  type: 'COMPLEX';
  operation: ComplexOperation;
  predicates: KeyFilterPredicate[];
}

export type KeyFilterPredicate =
  | ComplexFilterPredicate
  | SimpleKeyFilterPredicate;
export type FilterPredicateType = KeyFilterPredicate['type'];

export interface KeyFilter {
  key: EntityKey;
  valueType: EntityKeyValueType;
  predicate: KeyFilterPredicate;
}

export interface EntityCountQuery {
  entityFilter: EntityFilter;
  keyFilters?: KeyFilter[];
}

export interface EntityDataSortOrder {
  key: EntityKey;
  direction: 'ASC' | 'DESC';
}

/** 与普通 PageLink 不同，sortOrder 使用实体键与排序方向对象。 */
export interface EntityDataPageLink {
  pageSize: number;
  page: number;
  textSearch?: string;
  sortOrder?: EntityDataSortOrder;
  dynamic?: boolean;
}

export interface AbstractDataQuery<
  T extends EntityDataPageLink,
> extends EntityCountQuery {
  pageLink: T;
  entityFields?: EntityKey[];
  latestValues?: EntityKey[];
}

export type EntityDataQuery = AbstractDataQuery<EntityDataPageLink>;

export interface AlarmFilter {
  startTs?: number;
  endTs?: number;
  timeWindow?: number;
  typeList?: string[];
  statusList?: AlarmSearchStatus[];
  severityList?: AlarmSeverity[];
  searchPropagatedAlarms?: boolean;
  assigneeId?: EntityId<EntityType.USER>;
}

export type AlarmCountQuery = AlarmFilter & EntityCountQuery;
export type AlarmDataPageLink = AlarmFilter & EntityDataPageLink;

export interface AlarmDataQuery extends AbstractDataQuery<AlarmDataPageLink> {
  alarmFields?: EntityKey[];
}

/** 查询响应的值为字符串，与 V2 键样本的原始 JSON 值不同。 */
export interface TsValue {
  ts: number;
  value: string;
  count?: null | number;
}

export interface ComparisonTsValue {
  current?: null | TsValue;
  previous?: null | TsValue;
}

export type EntityLatestValues = Partial<
  Record<EntityKeyType, Record<string, TsValue>>
>;

export interface EntityData {
  entityId: EntityId;
  latest: EntityLatestValues;
  timeseries?: null | Record<string, TsValue[]>;
  aggLatest?: null | Record<number, ComparisonTsValue>;
}

export interface AlarmData extends AlarmInfo {
  /** 匹配查询的实体，可能与告警 originator 不同。 */
  entityId: EntityId;
  latest: EntityLatestValues;
  assignTs?: number;
  originatorLabel?: string;
  originatorDisplayName?: string;
  propagateToOwner?: boolean;
  propagateToTenant?: boolean;
  propagateRelationTypes?: string[];
}

export interface AvailableEntityKeys {
  entityTypes: EntityType[];
  timeseries: string[];
  /** 旧版字段名为单数 attribute。 */
  attribute: string[];
}

export interface KeySample {
  ts: number;
  value: TelemetryValue;
}

export interface KeyInfo {
  key: string;
  sample?: KeySample;
}

export interface AvailableEntityKeysV2 {
  entityTypes: EntityType[];
  timeseries?: KeyInfo[];
  attributes?: Partial<Record<AttributeScope, KeyInfo[]>>;
}

export interface AvailableEntityKeysParams {
  timeseries: boolean;
  attributes: boolean;
  scope?: AttributeScope;
}

export interface AvailableEntityKeysV2Params {
  /** 默认 true；与 includeAttributes 至少一个为 true。 */
  includeTimeseries?: boolean;
  /** 默认 true。 */
  includeAttributes?: boolean;
  scopes?: AttributeScope[];
  /** 默认 false。 */
  includeSamples?: boolean;
}

/** 后端 ObjectType，包含 EDQS 同步请求可传入的对象类型。 */
export type ObjectType =
  | 'ALARM'
  | 'ALARM_COMMENT'
  | 'API_USAGE_STATE'
  | 'ASSET'
  | 'ASSET_PROFILE'
  | 'ATTRIBUTE_KV'
  | 'AUDIT_LOG'
  | 'CUSTOMER'
  | 'DASHBOARD'
  | 'DEVICE'
  | 'DEVICE_CREDENTIALS'
  | 'DEVICE_PROFILE'
  | 'EDGE'
  | 'ENTITY_ALARM'
  | 'ENTITY_VIEW'
  | 'EVENT'
  | 'LATEST_TS_KV'
  | 'NOTIFICATION_RULE'
  | 'NOTIFICATION_TARGET'
  | 'NOTIFICATION_TEMPLATE'
  | 'OAUTH2_CLIENT'
  | 'OAUTH2_DOMAIN'
  | 'OAUTH2_MOBILE'
  | 'OTA_PACKAGE'
  | 'QUEUE'
  | 'QUEUE_STATS'
  | 'RELATION'
  | 'RESOURCE'
  | 'RPC'
  | 'RULE_CHAIN'
  | 'RULE_NODE'
  | 'TENANT'
  | 'TENANT_PROFILE'
  | 'USER'
  | 'USER_SETTINGS'
  | 'WIDGET_TYPE'
  | 'WIDGETS_BUNDLE';

export interface EdqsSyncRequest {
  objectTypes?: null | ObjectType[];
}

export interface ToCoreEdqsRequest {
  syncRequest?: EdqsSyncRequest | null;
  apiEnabled?: boolean | null;
}

export type EdqsSyncStatus = 'FAILED' | 'FINISHED' | 'REQUESTED' | 'STARTED';
export type EdqsApiMode =
  | 'AUTO_DISABLED'
  | 'AUTO_ENABLED'
  | 'DISABLED'
  | 'ENABLED';

export interface EdqsState {
  edqsReady?: boolean | null;
  syncStatus?: EdqsSyncStatus | null;
  apiMode?: EdqsApiMode | null;
}

/** POST /api/entitiesQuery/count。 */
export function countEntitiesByQuery(query: EntityCountQuery) {
  return requestClient.post<number>('/entitiesQuery/count', query);
}

/** POST /api/entitiesQuery/find。 */
export function findEntityDataByQuery(query: EntityDataQuery) {
  return requestClient.post<PageData<EntityData>>('/entitiesQuery/find', query);
}

/** POST /api/alarmsQuery/find。 */
export function findAlarmDataByQuery(query: AlarmDataQuery) {
  return requestClient.post<PageData<AlarmData>>('/alarmsQuery/find', query);
}

/** POST /api/alarmsQuery/count。 */
export function countAlarmsByQuery(query: AlarmCountQuery) {
  return requestClient.post<number>('/alarmsQuery/count', query);
}

/**
 * POST /api/entitiesQuery/find/keys；后端最多采集 100 个实体。
 * @deprecated 使用 findAvailableEntityKeysByQueryV2。
 */
export function findAvailableEntityKeysByQuery(
  query: EntityDataQuery,
  params: AvailableEntityKeysParams,
) {
  return requestClient.post<AvailableEntityKeys>(
    '/entitiesQuery/find/keys',
    query,
    { params },
  );
}

/** POST /api/v2/entitiesQuery/find/keys；后端最多采集 100 个实体。 */
export function findAvailableEntityKeysByQueryV2(
  query: EntityDataQuery,
  params?: AvailableEntityKeysV2Params,
) {
  return requestClient.post<AvailableEntityKeysV2>(
    '/v2/entitiesQuery/find/keys',
    query,
    {
      params,
      paramsSerializer: { indexes: null },
    },
  );
}

/** POST /api/edqs/system/request；仅系统管理员可调用。 */
export function processSystemEdqsRequest(
  request: ToCoreEdqsRequest,
): Promise<void> {
  return requestClient.post('/edqs/system/request', request);
}

/** GET /api/edqs/state；仅系统管理员可调用。 */
export function getEdqsState() {
  return requestClient.get<EdqsState>('/edqs/state');
}
