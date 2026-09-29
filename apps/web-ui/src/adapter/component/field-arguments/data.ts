import type { EntityFilter } from '#/api/tb/entity-query';
import type { FormValidationIssue } from '#/types/form';
import type { EntityId } from '#/types/tb';

import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { EntityType, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';
export interface RelationPathLevel {
  direction: 'FROM' | 'TO';
  relationType: string;
}

export interface ArgumentSource {
  refEntityId?: EntityId;
  refDynamicSourceConfiguration?: {
    type: 'CURRENT_OWNER' | 'RELATION_PATH_QUERY';
    levels?: RelationPathLevel[];
  };
}

/** 参数的数据契约，与编辑器的行标识、显示名称等界面状态分开。 */
export interface FieldArgument extends ArgumentSource {
  refEntityKey: {
    type: 'ATTRIBUTE' | 'TS_LATEST' | 'TS_ROLLING';
    key: string;
    scope?: 'CLIENT_SCOPE' | 'SERVER_SCOPE' | 'SHARED_SCOPE';
  };
  defaultValue?: string;
  limit?: number;
  timeWindow?: number;
}

export type SourceType =
  | 'CURRENT'
  | 'CURRENT_OWNER'
  | 'RELATION_PATH_QUERY'
  | EntityType;

export interface SourceValues {
  sourceType: SourceType;
  sourceId: string;
  levels: RelationPathLevel[];
}

export interface ArgumentValues extends SourceValues {
  sourceName?: string;
  rowId: string;
  name: string;
  key: string;
  keyType: FieldArgument['refEntityKey']['type'];
  scope: 'CLIENT_SCOPE' | 'SERVER_SCOPE' | 'SHARED_SCOPE';
  defaultValue: string;
  limit: number;
  timeWindow: number;
}

export interface ArgumentEditorOptions {
  entityId: EntityId;
  entityName?: string;
  ownerId?: EntityId;
  onlyCurrentEntity?: boolean;
  latestTelemetryOnly?: boolean;
  allowRolling?: boolean;
  hideDefaultValue?: boolean;
  defaultValueRequired?: boolean;
  maxArguments?: number;
  maxDataPoints?: number;
  forbiddenNames?: string[];
  watchKeyChange?: boolean;
  hideSource?: boolean;
  hideKeyType?: boolean;
  predefinedEntityFilter?: EntityFilter;
}

export interface ArgumentFormData extends ArgumentEditorOptions {
  value?: ArgumentValues;
  usedNames: string[];
}

/** 弹窗与调用方保存时共用的参数校验。 */
export function validateArgumentValues(
  formValues: ArgumentValues,
  options: Partial<ArgumentEditorOptions>,
  usedNames: string[] = [],
) {
  const issues: ArgumentValidationIssue[] = [];
  const addIssue = (fieldName: string, message: string) =>
    issues.push({ fieldName, message });
  const name = formValues.name.trim();
  if (
    !/^[a-zA-Z_]\w*$/.test(name) ||
    name.length > 255 ||
    (options.forbiddenNames ?? ['ctx', 'e', 'pi']).includes(name)
  )
    addIssue('name', $t('tb.components.fieldArguments.validation.name'));
  else if (usedNames.some((used) => used.toLowerCase() === name.toLowerCase()))
    addIssue('name', $t('tb.components.fieldArguments.validation.duplicate'));
  if (!formValues.key.trim())
    addIssue('key', $t('tb.components.fieldArguments.validation.required'));
  if (
    sourceEntityTypes.some((type) => type === formValues.sourceType) &&
    !formValues.sourceId
  )
    addIssue('sourceId', $t('tb.components.fieldArguments.validation.entity'));
  if (options.onlyCurrentEntity && formValues.sourceType !== 'CURRENT')
    addIssue(
      'sourceType',
      $t('tb.components.fieldArguments.validation.currentSource'),
    );
  if (formValues.sourceType === 'RELATION_PATH_QUERY')
    addIssue(
      'sourceType',
      $t('tb.components.fieldArguments.validation.relationSource'),
    );
  if (options.latestTelemetryOnly && formValues.keyType !== 'TS_LATEST')
    addIssue(
      'keyType',
      $t('tb.components.fieldArguments.validation.latestOnly'),
    );
  if (formValues.keyType === 'TS_ROLLING') {
    if (!options.allowRolling)
      addIssue(
        'keyType',
        $t('tb.components.fieldArguments.validation.rolling'),
      );
    for (const [fieldName, value, max] of [
      ...(options.maxDataPoints
        ? [['limit', formValues.limit, options.maxDataPoints] as const]
        : []),
      ['timeWindow', formValues.timeWindow, Number.MAX_SAFE_INTEGER],
    ] as const) {
      if (!Number.isSafeInteger(value) || value < 1 || value > max)
        addIssue(
          fieldName,
          $t('tb.components.fieldArguments.validation.range', { min: 1, max }),
        );
    }
  } else if (options.defaultValueRequired && !formValues.defaultValue.trim())
    addIssue(
      'defaultValue',
      $t('tb.components.fieldArguments.validation.required'),
    );
  return issues;
}

export async function getSourceEntityName(entityId: EntityId) {
  const result = await findEntityDataByQuery({
    entityFilter: { type: 'singleEntity', singleEntity: entityId },
    pageLink: { page: 0, pageSize: 1 },
    entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
  });
  return result.data[0]?.latest.ENTITY_FIELD?.name?.value || entityId.id;
}

export function createDefaultArgumentFormValues(
  options: Pick<ArgumentEditorOptions, 'maxDataPoints'> = {},
): ArgumentValues {
  return {
    rowId: crypto.randomUUID(),
    name: '',
    key: '',
    keyType: 'TS_LATEST',
    scope: 'SERVER_SCOPE',
    sourceType: 'CURRENT',
    sourceId: '',
    levels: [],
    defaultValue: '',
    limit: Math.max(1, Math.floor((options.maxDataPoints || 1000) / 10)),
    timeWindow: 900_000,
  };
}

export const sourceEntityTypes = [
  EntityType.DEVICE,
  EntityType.ASSET,
  EntityType.CUSTOMER,
  EntityType.TENANT,
];

export function sourceOptions(relationPath = false) {
  return [
    {
      value: 'CURRENT',
      label: $t('tb.components.fieldArguments.options.CURRENT'),
    },
    {
      value: 'CURRENT_OWNER',
      label: $t('tb.components.fieldArguments.options.CURRENT_OWNER'),
    },
    ...(relationPath
      ? [
          {
            value: 'RELATION_PATH_QUERY',
            label: $t(
              'tb.components.fieldArguments.options.RELATION_PATH_QUERY',
            ),
          },
        ]
      : []),
    ...sourceEntityTypes.map((value) => ({
      value,
      label: entityTypeLabel(value),
    })),
  ];
}

export type ArgumentValidationIssue = FormValidationIssue;

export function toSourceFormValues(value: ArgumentSource): SourceValues {
  return {
    sourceType:
      value.refDynamicSourceConfiguration?.type ??
      value.refEntityId?.entityType ??
      'CURRENT',
    sourceId: value.refEntityId?.id ?? '',
    levels: (
      value.refDynamicSourceConfiguration?.levels ?? [
        { direction: 'TO' as const, relationType: '' },
      ]
    ).map((level) => ({ ...level })),
  };
}

export function toArgumentFormValues(
  args: Record<string, FieldArgument> | undefined,
  options: Pick<ArgumentEditorOptions, 'maxDataPoints'> = {},
): ArgumentValues[] {
  return Object.entries(args ?? {}).map(([name, argument]) => {
    const defaults = createDefaultArgumentFormValues(options);
    return {
      ...defaults,
      ...toSourceFormValues(argument),
      name,
      key: argument.refEntityKey?.key ?? '',
      keyType: argument.refEntityKey?.type ?? defaults.keyType,
      scope: argument.refEntityKey?.scope ?? defaults.scope,
      defaultValue: argument.defaultValue ?? '',
      limit: argument.limit ?? defaults.limit,
      timeWindow: argument.timeWindow ?? defaults.timeWindow,
    };
  });
}

export function toSourcePayload(row: SourceValues): ArgumentSource {
  if (row.sourceType === 'CURRENT') return {};
  if (row.sourceType === 'CURRENT_OWNER')
    return {
      refDynamicSourceConfiguration: { type: 'CURRENT_OWNER' as const },
    };
  if (row.sourceType === 'RELATION_PATH_QUERY')
    return {
      refDynamicSourceConfiguration: {
        type: 'RELATION_PATH_QUERY' as const,
        levels: row.levels.map((level) => ({
          ...level,
          relationType: level.relationType.trim(),
        })),
      },
    };
  return { refEntityId: { entityType: row.sourceType, id: row.sourceId } };
}

export function toArgumentPayload(
  args: ArgumentValues[],
  options: { includeDefaultValue?: boolean; maxDataPoints?: number } = {},
): Record<string, FieldArgument> {
  return Object.fromEntries(
    args.map((a) => [
      a.name.trim(),
      {
        ...toSourcePayload(a),
        refEntityKey: {
          type: a.keyType,
          key: a.key.trim(),
          ...(a.keyType === 'ATTRIBUTE' ? { scope: a.scope } : {}),
        },
        ...(a.keyType === 'TS_ROLLING'
          ? {
              ...(options.maxDataPoints === 0 ? {} : { limit: a.limit }),
              timeWindow: a.timeWindow,
            }
          : {}),
        ...(a.keyType !== 'TS_ROLLING' && options.includeDefaultValue !== false
          ? { defaultValue: a.defaultValue.trim() }
          : {}),
      },
    ]),
  );
}

export function validateArguments(
  args: ArgumentValues[],
  options: Partial<ArgumentEditorOptions> = {},
): ArgumentValidationIssue[] {
  const issues: ArgumentValidationIssue[] = [];
  if (args.length === 0)
    issues.push({
      fieldName: 'arguments',
      message: $t('tb.components.fieldArguments.validation.arguments'),
    });
  if (options.maxArguments && args.length > options.maxArguments)
    issues.push({
      fieldName: 'arguments',
      message: $t('tb.components.fieldArguments.validation.maxItems', {
        count: options.maxArguments,
      }),
    });
  args.forEach((argument, index) =>
    issues.push(
      ...validateArgumentValues(
        argument,
        options,
        args.slice(0, index).map((row) => row.name.trim()),
      ).map((issue) => ({
        ...issue,
        fieldName: `arguments[${index}].${issue.fieldName}`,
      })),
    ),
  );
  return issues;
}

export interface ArgumentScriptParameter {
  name: string;
  type?: string;
  description?: string;
  properties?: ArgumentScriptParameter[];
}
function rollingProperties(): ArgumentScriptParameter[] {
  return [
    { name: 'values', type: '{ ts: number; value: any }[]' },
    {
      name: 'timeWindow',
      type: 'object',
      properties: [
        { name: 'startTs', type: 'number' },
        { name: 'endTs', type: 'number' },
      ],
    },
  ];
}
/** Match ui-ngx: direct single values, envelopes under ctx.args, rolling objects. */
export function createScriptParameters(
  args: ArgumentValues[],
): ArgumentScriptParameter[] {
  const names = new Set<string>(['ctx', 'e', 'pi']);
  const validArgs = args.filter((argument) => {
    const name = argument.name.trim();
    if (!/^[a-zA-Z_]\w*$/.test(name) || names.has(name)) return false;
    names.add(name);
    return true;
  });
  const parameters: ArgumentScriptParameter[] = validArgs.map((argument) => ({
    name: argument.name.trim(),
    description: argument.key,
    type: argument.keyType === 'TS_ROLLING' ? 'object' : 'any',
    ...(argument.keyType === 'TS_ROLLING'
      ? { properties: rollingProperties() }
      : {}),
  }));
  return [
    {
      name: 'ctx',
      type: 'object',
      properties: [
        {
          name: 'args',
          type: 'object',
          properties: validArgs.map((argument) => ({
            name: argument.name.trim(),
            type: 'object',
            properties:
              argument.keyType === 'TS_ROLLING'
                ? rollingProperties()
                : [
                    { name: 'ts', type: 'number' },
                    { name: 'value', type: 'any' },
                  ],
          })),
        },
        { name: 'latestTs', type: 'number' },
      ],
    },
    ...parameters,
  ];
}
/** 保留单值和滚动时间序列的测试数据结构。 */
export function createTestArguments(
  args: ArgumentValues[],
  ts = Date.now(),
  samples?: Record<string, unknown>,
) {
  return Object.fromEntries(
    args
      .filter((argument) => argument.name.trim())
      .map((argument) => {
        const candidate = samples?.[argument.name.trim()];
        const sample =
          candidate &&
          typeof candidate === 'object' &&
          !Array.isArray(candidate)
            ? (candidate as Record<string, unknown>)
            : undefined;
        return [
          argument.name.trim(),
          argument.keyType === 'TS_ROLLING'
            ? {
                type: 'TS_ROLLING',
                timeWindow: sample?.timeWindow ?? {},
                values: sample?.values ?? [],
              }
            : {
                type: 'SINGLE_VALUE',
                ts: sample && 'ts' in sample ? sample.ts : ts,
                value: sample && 'value' in sample ? sample.value : '',
              },
        ];
      }),
  );
}
