import type { CalculatedFieldDefinition } from './form-schema';

import type {
  ArgumentValues,
  SourceValues,
} from '#/adapter/component/field-arguments/data';
import type {
  CalculatedField,
  CalculatedFieldConfiguration,
  CalculatedFieldMetric,
  CalculatedFieldOutput,
  CalculatedFieldZone,
} from '#/api/tb/calculated-field';
import type { SystemParams } from '#/api/tb/system-info';
import type { EntityDebugSettings } from '#/types/tb';

import {
  CalculatedFieldType,
  calculatedFieldTypeLabel,
  EntityType,
  entityTypeLabel,
} from '#/enums';
export const calculatedFieldDefaultScript =
  '// Sample script to convert temperature readings from Fahrenheit to Celsius\n' +
  'return {\n    "temperatureC": (temperatureF - 32) / 1.8\n};';
export const calculatedFieldTypes: CalculatedFieldType[] = [
  CalculatedFieldType.SIMPLE,
  CalculatedFieldType.SCRIPT,
  CalculatedFieldType.RELATED_ENTITIES_AGGREGATION,
  CalculatedFieldType.PROPAGATION,
  CalculatedFieldType.GEOFENCING,
  CalculatedFieldType.ENTITY_AGGREGATION,
];
export const calculatedFieldEntityTypes = [
  EntityType.DEVICE,
  EntityType.ASSET,
  EntityType.DEVICE_PROFILE,
  EntityType.ASSET_PROFILE,
];
export function getTypeOptions() {
  return calculatedFieldTypes.map((value) => ({
    value,
    label: calculatedFieldTypeLabel(value),
  }));
}
export function getEntityTypeOptions() {
  return calculatedFieldEntityTypes.map((value) => ({
    value,
    label: entityTypeLabel(value),
  }));
}
export interface MetricValues {
  rowId: string;
  name: string;
  function: CalculatedFieldMetric['function'];
  inputType: 'function' | 'key';
  inputKey: string;
  inputFunction: string;
  filterEnabled: boolean;
  filter: string;
  defaultValue: null | number;
}
export interface ZoneValues extends SourceValues {
  rowId: string;
  name: string;
  perimeterKeyName: string;
  reportStrategy: CalculatedFieldZone['reportStrategy'];
  createRelationsWithMatchedZones: boolean;
  relationType: string;
  direction: 'FROM' | 'TO';
}
export interface CalculatedFieldFormValues {
  _general?: string;
  _configuration?: string;
  name: string;
  type: CalculatedFieldType;
  entityType: EntityType;
  entityId: string;
  debugSettings: EntityDebugSettings;
  arguments: ArgumentValues[];
  metrics: MetricValues[];
  zones: ZoneValues[];
  expression: string;
  simpleExpression?: string;
  scriptExpression?: string;
  useLatestTs: boolean;
  outputType: CalculatedFieldOutput['type'];
  outputName: string;
  outputScope: 'SERVER_SCOPE' | 'SHARED_SCOPE';
  decimals: null | number;
  strategyType: 'IMMEDIATE' | 'RULE_CHAIN';
  saveTimeSeries: boolean;
  saveLatest: boolean;
  saveAttribute: boolean;
  sendWsUpdate: boolean;
  processCfs: boolean;
  updateAttributesOnlyOnValueChange: boolean;
  sendAttributesUpdatedNotification: boolean;
  customTtl: boolean;
  ttl: number;
  relationDirection: 'FROM' | 'TO';
  relationType: string;
  applyExpression: boolean;
  latitudeKey: string;
  longitudeKey: string;
  scheduledUpdate: boolean;
  scheduledUpdateInterval: number;
  deduplicationInterval: number;
  intervalType: NonNullable<CalculatedFieldConfiguration['interval']>['type'];
  timezone: string;
  duration: number;
  offsetEnabled: boolean;
  offset: number;
  watermarkEnabled: boolean;
  watermark: number;
  intermediate: boolean;
}
export function createDefaultMetricFormValues(): MetricValues {
  return {
    rowId: crypto.randomUUID(),
    name: '',
    function: 'AVG',
    inputType: 'key',
    inputKey: '',
    inputFunction:
      '// Sample map script to convert temperature from Fahrenheit to Celsius\n// Goal: Apply conversion per entity before aggregation (e.g., for average temperature)\n\nvar temperatureC = (temperature - 32) / 1.8;\nreturn toFixed(temperatureC, 2);',
    filterEnabled: false,
    filter:
      '// Sample filter script to include only active and unoccupied parking spaces\n// Goal: Count only parking spaces that are active and currently free\n\nreturn active == true && occupied == false;',
    defaultValue: null,
  };
}
export function createDefaultZoneFormValues(): ZoneValues {
  return {
    rowId: crypto.randomUUID(),
    name: '',
    sourceType: 'CURRENT',
    sourceId: '',
    levels: [{ direction: 'TO', relationType: '' }],
    perimeterKeyName: '',
    reportStrategy: 'REPORT_TRANSITION_EVENTS_AND_PRESENCE_STATUS',
    createRelationsWithMatchedZones: false,
    direction: 'TO',
    relationType: '',
  };
}
export function toCalculatedFieldFormValues(
  definition: CalculatedFieldDefinition,
  field?: CalculatedField,
  limits?: SystemParams,
  previous?: CalculatedFieldFormValues,
): CalculatedFieldFormValues {
  const config: Partial<CalculatedFieldConfiguration> =
    field?.configuration ?? {};
  const output = config.output;
  const strategy = output?.strategy;
  // The selected definition supplies its own fields; the schema only renders that type.
  return {
    name: field?.name ?? '',
    entityType: field?.entityId?.entityType ?? EntityType.DEVICE,
    entityId: field?.entityId?.id ?? '',
    debugSettings: {
      failuresEnabled: true,
      allEnabled: true,
      ...field?.debugSettings,
    },
    outputType: definition.output?.timeSeriesOnly
      ? 'TIME_SERIES'
      : (output?.type ?? 'TIME_SERIES'),
    outputName: output?.name ?? '',
    outputScope: output?.scope ?? 'SERVER_SCOPE',
    decimals: output?.decimalsByDefault ?? null,
    strategyType: strategy?.type ?? (output ? 'RULE_CHAIN' : 'IMMEDIATE'),
    saveTimeSeries: strategy?.saveTimeSeries ?? true,
    saveLatest: strategy?.saveLatest ?? true,
    saveAttribute: strategy?.saveAttribute ?? true,
    sendWsUpdate: strategy?.sendWsUpdate ?? true,
    processCfs: strategy?.processCfs ?? true,
    updateAttributesOnlyOnValueChange:
      strategy?.updateAttributesOnlyOnValueChange ?? true,
    sendAttributesUpdatedNotification:
      strategy?.sendAttributesUpdatedNotification ?? false,
    customTtl: !!strategy?.ttl,
    ttl: strategy?.ttl ?? 0,
    ...definition.getValues(config, limits, previous),
    type: definition.type,
  } as CalculatedFieldFormValues;
}
export function toMetricFormValues(
  config: Partial<CalculatedFieldConfiguration>,
): MetricValues[] {
  return Object.entries(config.metrics ?? {}).map(([name, m]) => ({
    ...createDefaultMetricFormValues(),
    name,
    function: m.function,
    inputType: m.input.type,
    inputKey: m.input.type === 'key' ? m.input.key : '',
    inputFunction:
      m.input.type === 'function'
        ? m.input.function
        : createDefaultMetricFormValues().inputFunction,
    filterEnabled: !!m.filter,
    filter: m.filter ?? createDefaultMetricFormValues().filter,
    defaultValue: m.defaultValue ?? null,
  }));
}
export function toCalculatedFieldConfiguration(
  definition: CalculatedFieldDefinition,
  formValues: CalculatedFieldFormValues,
  source?: CalculatedField,
  limits?: SystemParams,
): CalculatedFieldConfiguration {
  const outputType = definition.output?.timeSeriesOnly
    ? 'TIME_SERIES'
    : formValues.outputType;
  const output: CalculatedFieldOutput = {
    type: outputType,
    ...(outputType === 'ATTRIBUTES'
      ? {
          scope: [EntityType.DEVICE, EntityType.DEVICE_PROFILE].includes(
            formValues.entityType,
          )
            ? formValues.outputScope
            : 'SERVER_SCOPE',
        }
      : {}),
    ...(definition.output?.name
      ? {
          name: formValues.outputName.trim(),
          ...(formValues.decimals === null
            ? {}
            : { decimalsByDefault: formValues.decimals }),
        }
      : {}),
    strategy:
      formValues.strategyType === 'RULE_CHAIN'
        ? { type: 'RULE_CHAIN' }
        : {
            type: 'IMMEDIATE',
            sendWsUpdate: formValues.sendWsUpdate,
            processCfs: formValues.processCfs,
            ...(outputType === 'TIME_SERIES'
              ? {
                  saveTimeSeries: formValues.saveTimeSeries,
                  saveLatest: formValues.saveLatest,
                  ttl:
                    formValues.saveTimeSeries && formValues.customTtl
                      ? formValues.ttl
                      : 0,
                }
              : {
                  saveAttribute: formValues.saveAttribute,
                  updateAttributesOnlyOnValueChange:
                    formValues.updateAttributesOnlyOnValueChange,
                  sendAttributesUpdatedNotification:
                    formValues.sendAttributesUpdatedNotification,
                }),
          },
  };
  if (definition.output?.decimals && formValues.decimals !== null)
    output.decimalsByDefault = formValues.decimals;
  // 移除其他类型和当前隐藏分支的字段，避免切换类型后提交残留值。
  const configurationKeys = new Set([
    'applyExpressionToResolvedArguments',
    'arguments',
    'deduplicationIntervalInSec',
    'entityCoordinates',
    'expression',
    'interval',
    'metrics',
    'produceIntermediateResult',
    'relation',
    'scheduledUpdateEnabled',
    'scheduledUpdateInterval',
    'useLatestTs',
    'watermark',
    'zoneGroups',
  ]);
  const config: CalculatedFieldConfiguration = {
    ...Object.fromEntries(
      Object.entries(
        source?.type === formValues.type ? source.configuration : {},
      ).filter(([key]) => !configurationKeys.has(key)),
    ),
    type: formValues.type,
    output,
  };
  return { ...config, ...definition.toConfiguration(formValues, limits) };
}
export function toMetricPayload(
  metrics: MetricValues[],
  includeDefaultValue = true,
): NonNullable<CalculatedFieldConfiguration['metrics']> {
  return Object.fromEntries(
    metrics.map((m) => [
      m.name.trim(),
      {
        function: m.function,
        input:
          m.inputType === 'key'
            ? { type: 'key' as const, key: m.inputKey }
            : { type: 'function' as const, function: m.inputFunction.trim() },
        ...(m.filterEnabled ? { filter: m.filter.trim() } : {}),
        ...(includeDefaultValue ? { defaultValue: m.defaultValue } : {}),
      },
    ]),
  );
}

export function toCalculatedFieldPayload(
  definition: CalculatedFieldDefinition,
  formValues: CalculatedFieldFormValues,
  record: CalculatedField | null,
  importedRecord: CalculatedField | undefined,
  limits?: SystemParams,
): CalculatedField {
  const source = record ?? importedRecord;
  return {
    ...record,
    name: formValues.name.trim(),
    type: formValues.type,
    entityId: { entityType: formValues.entityType, id: formValues.entityId },
    configuration: toCalculatedFieldConfiguration(
      definition,
      formValues,
      source,
      limits,
    ),
    configurationVersion: source?.configurationVersion,
    additionalInfo: source?.additionalInfo,
    debugSettings: formValues.debugSettings,
  };
}
