import type {
  ArgumentSource,
  FieldArgument,
  RelationPathLevel,
} from '#/adapter/component/field-arguments/data';
import type { CalculatedFieldType, EntityType } from '#/enums';
import type {
  BaseData,
  EntityDebugSettings,
  EntityId,
  PageData,
  PageLink,
} from '#/types/tb';

import { requestClient } from '#/api/request';

export interface CalculatedFieldMetric {
  function: 'AVG' | 'COUNT' | 'COUNT_UNIQUE' | 'MAX' | 'MIN' | 'SUM';
  input: { type: 'function'; function: string } | { type: 'key'; key: string };
  filter?: string;
  defaultValue?: null | number;
}

export interface CalculatedFieldZone extends ArgumentSource {
  perimeterKeyName: string;
  reportStrategy:
    | 'REPORT_PRESENCE_STATUS_ONLY'
    | 'REPORT_TRANSITION_EVENTS_AND_PRESENCE_STATUS'
    | 'REPORT_TRANSITION_EVENTS_ONLY';
  createRelationsWithMatchedZones: boolean;
  relationType?: string;
  direction?: 'FROM' | 'TO';
}

export interface CalculatedFieldOutput {
  type: 'ATTRIBUTES' | 'TIME_SERIES';
  name?: string;
  scope?: 'SERVER_SCOPE' | 'SHARED_SCOPE';
  decimalsByDefault?: null | number;
  strategy?: {
    type: 'IMMEDIATE' | 'RULE_CHAIN';
    ttl?: number;
    saveTimeSeries?: boolean;
    saveLatest?: boolean;
    saveAttribute?: boolean;
    sendWsUpdate?: boolean;
    processCfs?: boolean;
    updateAttributesOnlyOnValueChange?: boolean;
    sendAttributesUpdatedNotification?: boolean;
  };
}

/** 六种计算字段配置的公共读取契约，具体必填条件由各类型表单校验。 */
export interface CalculatedFieldConfiguration extends Record<string, unknown> {
  type: CalculatedFieldType;
  arguments?: Record<string, FieldArgument>;
  expression?: string;
  useLatestTs?: boolean;
  output: CalculatedFieldOutput;
  relation?: RelationPathLevel;
  applyExpressionToResolvedArguments?: boolean;
  entityCoordinates?: { latitudeKeyName: string; longitudeKeyName: string };
  zoneGroups?: Record<string, CalculatedFieldZone>;
  scheduledUpdateEnabled?: boolean;
  scheduledUpdateInterval?: number;
  deduplicationIntervalInSec?: number;
  metrics?: Record<string, CalculatedFieldMetric>;
  interval?: {
    type:
      | 'CUSTOM'
      | 'DAY'
      | 'HOUR'
      | 'MONTH'
      | 'QUARTER'
      | 'WEEK'
      | 'WEEK_SUN_SAT'
      | 'YEAR';
    tz: string;
    durationSec?: number;
    offsetSec?: number;
  };
  watermark?: { duration: number };
  produceIntermediateResult?: boolean;
}

export interface CalculatedFieldTestResult {
  output?: string;
  error?: string;
}

export function testCalculatedFieldScript(
  expression: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
) {
  // Callers with cancellation own their error display; legacy callers use the global handler.
  const config = signal ? { signal, skipErrorHandler: true } : undefined;
  return requestClient.post<CalculatedFieldTestResult>(
    '/calculatedField/testScript',
    { expression, arguments: args },
    config,
  );
}

/** 契约对应 ui-ngx CalculatedFieldsService / CalculatedFieldController。 */
export interface CalculatedField extends BaseData<EntityType.CALCULATED_FIELD> {
  name: string;
  type: CalculatedFieldType;
  entityId: EntityId;
  configuration: Record<string, unknown>;
  configurationVersion?: number;
  additionalInfo?: Record<string, unknown>;
  debugSettings?: EntityDebugSettings;
  tenantId?: EntityId<EntityType.TENANT>;
}

export interface CalculatedFieldInfo extends CalculatedField {
  entityName?: string;
}

export interface CalculatedFieldsQuery extends PageLink {
  types?: CalculatedFieldType[];
  entityType?: EntityType;
  entities?: string[];
}

export function getCalculatedFields({
  types,
  entities,
  ...params
}: CalculatedFieldsQuery) {
  return requestClient.get<PageData<CalculatedFieldInfo>>('/calculatedFields', {
    params: {
      ...params,
      types: types?.join(',') || undefined,
      entities: entities?.join(',') || undefined,
    },
  });
}

export function getCalculatedFieldsByEntityId(
  entityId: EntityId,
  {
    types,
    entities: _entities,
    entityType: _entityType,
    ...params
  }: CalculatedFieldsQuery,
) {
  return requestClient.get<PageData<CalculatedFieldInfo>>(
    `/${entityId.entityType}/${entityId.id}/calculatedFields`,
    { params: { ...params, type: types?.[0] } },
  );
}

export function getLatestCalculatedFieldDebugEvent(
  id: string,
  signal?: AbortSignal,
) {
  const config = { signal, skipErrorHandler: true };
  return requestClient.get<null | { arguments?: string }>(
    `/calculatedField/${id}/debug`,
    config,
  );
}

export function getCalculatedFieldById(id: string) {
  return requestClient.get<CalculatedField>(`/calculatedField/${id}`);
}

export function saveCalculatedField(field: CalculatedField) {
  return requestClient.post<CalculatedField>('/calculatedField', field);
}

export function deleteCalculatedField(id: string): Promise<void> {
  return requestClient.delete(`/calculatedField/${id}`);
}

export async function deleteCalculatedFields(calculatedFieldIds: string[]) {
  const ids = [...new Set(calculatedFieldIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteCalculatedField(id)),
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
