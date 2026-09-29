import type { ArgumentValues } from '#/adapter/component/field-arguments/data';
import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type {
  AlarmRule,
  AlarmRuleConfiguration,
  AlarmRuleDefinition,
  AlarmRuleFilter,
  AlarmRulePredicate,
  AlarmRuleSchedule,
  AlarmRuleValue,
} from '#/api/tb/alarm-rule';
import type { FormValidationIssue } from '#/types/form';
import type { EntityDebugSettings } from '#/types/tb';

import { AlarmSeverity, EntityType, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

export { alarmSeverityColors as severityColors } from '#/enums';

export interface AlarmRuleFormData {
  alarmRuleId?: string;
  entityName?: string;
  value?: AlarmRuleDefinition;
}
export interface AlarmRuleScriptTestRequest {
  expression: string;
  open: (data: ScriptTestData) => void;
  onApply: (expression: string) => void;
}
export interface AlarmRuleFormValues {
  name: string;
  entityType: EntityType;
  entityId: string;
  debugSettings: EntityDebugSettings;
}
export interface AlarmRuleDraft extends AlarmRuleFormValues {
  arguments: ArgumentValues[];
  configuration: AlarmRuleConfiguration;
}
export const entityTypeOptions = () =>
  [
    EntityType.DEVICE,
    EntityType.ASSET,
    EntityType.CUSTOMER,
    EntityType.DEVICE_PROFILE,
    EntityType.ASSET_PROFILE,
  ].map((value) => ({ value, label: entityTypeLabel(value) }));
export const severities = [
  AlarmSeverity.CRITICAL,
  AlarmSeverity.MAJOR,
  AlarmSeverity.MINOR,
  AlarmSeverity.WARNING,
  AlarmSeverity.INDETERMINATE,
];
export const options = (formValues: string[]) =>
  formValues.map((value) => ({
    value,
    label: $t(`alarm-rule.options.${value}`),
  }));
export const units = ['SECONDS', 'MINUTES', 'HOURS', 'DAYS'];
export function createDefaultAlarmRuleConfiguration(): AlarmRuleConfiguration {
  return {
    type: 'ALARM',
    arguments: {},
    createRules: {},
    clearRule: null,
    propagate: false,
    propagateRelationTypes: [],
    propagateToOwner: false,
    propagateToTenant: false,
  };
}
export function createDefaultAlarmRule(): AlarmRule {
  return {
    condition: {
      type: 'SIMPLE',
      expression: { type: 'SIMPLE', operation: 'AND', filters: [] },
      schedule: { staticValue: { type: 'ANY_TIME' } },
    },
  };
}
export function createDefaultRuleValue(
  type: 'POSITIVE' | AlarmRuleFilter['valueType'],
) {
  if (type === 'BOOLEAN') return false;
  if (type === 'STRING') return '';
  if (type === 'DATE_TIME') return Date.now();
  if (type === 'POSITIVE') return 1;
  return 0;
}
export function createDefaultPredicate(
  type: AlarmRuleFilter['valueType'],
): AlarmRulePredicate {
  return {
    type: type === 'DATE_TIME' ? 'NUMERIC' : type,
    operation: type === 'STRING' ? 'STARTS_WITH' : 'EQUAL',
    value: {
      staticValue: createDefaultRuleValue(type),
    },
    ...(type === 'STRING' ? { ignoreCase: false } : {}),
  };
}
export function predicateOperations(type: AlarmRuleFilter['valueType']) {
  const operations = ['EQUAL', 'NOT_EQUAL'];
  if (type === 'STRING') {
    operations.push(
      'STARTS_WITH',
      'ENDS_WITH',
      'CONTAINS',
      'NOT_CONTAINS',
      'IN',
      'NOT_IN',
    );
  } else if (type !== 'BOOLEAN') {
    operations.push('GREATER', 'LESS', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL');
  }
  return [...operations, 'NO_DATA'];
}
export function hasNoData(items: AlarmRulePredicate[]): boolean {
  return items.some(
    (item) => item.type === 'NO_DATA' || hasNoData(item.predicates ?? []),
  );
}
export function isRuleValueValid(
  value: AlarmRuleValue<unknown> | undefined,
  type: 'BOOLEAN' | 'NUMERIC' | 'POSITIVE' | 'STRING',
  names: string[],
  excluded?: string,
): boolean {
  if (typeof value?.dynamicValueArgument === 'string')
    return (
      names.includes(value.dynamicValueArgument) &&
      value.dynamicValueArgument !== excluded
    );
  const v = value?.staticValue;
  if (type === 'POSITIVE')
    return Number.isInteger(v) && Number(v) > 0 && Number(v) <= 2_147_483_647;
  if (type === 'NUMERIC') return typeof v === 'number' && Number.isFinite(v);
  if (type === 'BOOLEAN') return typeof v === 'boolean';
  // ui-ngx permits empty static strings, including comparisons with an empty value.
  return typeof v === 'string';
}
function getPredicateError(
  item: AlarmRulePredicate,
  type: AlarmRuleFilter['valueType'],
  names: string[],
  argument: string,
): string | undefined {
  if (item.type === 'COMPLEX') {
    if (!['AND', 'OR'].includes(item.operation) || !item.predicates?.length)
      return $t('alarm-rule.validation.group');
    return item.predicates
      .map((p) => getPredicateError(p, type, names, argument))
      .find(Boolean);
  }
  if (!predicateOperations(type).includes(item.operation))
    return $t('alarm-rule.validation.operator');
  if (item.type === 'NO_DATA')
    return item.operation === 'NO_DATA' &&
      units.includes(item.unit ?? '') &&
      isRuleValueValid(item.duration, 'POSITIVE', names, argument)
      ? undefined
      : $t('alarm-rule.validation.duration');
  if (
    item.type !== (type === 'DATE_TIME' ? 'NUMERIC' : type) ||
    item.operation === 'NO_DATA'
  )
    return $t('alarm-rule.validation.operator');
  return isRuleValueValid(
    item.value,
    type === 'DATE_TIME' ? 'NUMERIC' : type,
    names,
    argument,
  )
    ? undefined
    : $t('alarm-rule.validation.value');
}
function getFilterError(
  filter: AlarmRuleFilter,
  names: string[],
): string | undefined {
  if (!names.includes(filter.argument))
    return $t('alarm-rule.validation.argument');
  if (
    !['AND', 'OR'].includes(filter.operation) ||
    filter.predicates.length === 0
  )
    return $t('alarm-rule.validation.group');
  return filter.predicates
    .map((item) =>
      getPredicateError(item, filter.valueType, names, filter.argument),
    )
    .find(Boolean);
}
function getConditionError(
  condition: AlarmRule['condition'],
  names: string[],
): string | undefined {
  const expression = condition.expression;
  if (expression.type === 'TBEL') {
    if (!expression.expression?.trim())
      return $t('alarm-rule.validation.script');
  } else {
    if (!expression.filters?.length) return $t('alarm-rule.validation.filters');
    if (
      new Set(expression.filters.map((f) => f.argument)).size !==
      expression.filters.length
    )
      return $t('alarm-rule.validation.duplicateFilter');
    const error = expression.filters
      .map((filter) => getFilterError(filter, names))
      .find(Boolean);
    if (error) return error;
    if (
      expression.filters.some((filter) => hasNoData(filter.predicates)) &&
      condition.type !== 'SIMPLE'
    )
      return $t('alarm-rule.messages.noDataHint');
  }
  if (
    condition.type === 'DURATION' &&
    (!isRuleValueValid(condition.value, 'POSITIVE', names) ||
      !units.includes(condition.unit ?? ''))
  )
    return $t('alarm-rule.validation.duration');
  if (
    condition.type === 'REPEATING' &&
    !isRuleValueValid(condition.count, 'POSITIVE', names)
  )
    return $t('alarm-rule.validation.count');
}
function getScheduleError(
  schedule: AlarmRuleSchedule | undefined,
  names: string[],
): string | undefined {
  if (!schedule) return;
  const error = $t('alarm-rule.validation.schedule');
  if (typeof schedule.dynamicValueArgument === 'string')
    return names.includes(schedule.dynamicValueArgument) ? undefined : error;
  const time = schedule.staticValue;
  if (!time) return error;
  if (time.type === 'ANY_TIME') return;
  if (!time.timezone) return error;
  try {
    Intl.DateTimeFormat('en', { timeZone: time.timezone }).resolvedOptions();
  } catch {
    return error;
  }
  const day = (v: number) => Number.isInteger(v) && v >= 1 && v <= 7;
  const validTime = (v: number | undefined) =>
    Number.isInteger(v) && Number(v) >= 0 && Number(v) < 86_400_000;
  // Equal times mean a full day; overnight ranges remain valid.
  if (time.type === 'SPECIFIC_TIME')
    return time.daysOfWeek?.length &&
      time.daysOfWeek.every(day) &&
      validTime(time.startsOn) &&
      validTime(time.endsOn)
      ? undefined
      : error;
  const active = time.items?.filter((item) => item.enabled);
  return time.type === 'CUSTOM' &&
    active?.length &&
    active.every(
      (item) =>
        day(item.dayOfWeek) &&
        validTime(item.startsOn) &&
        validTime(item.endsOn),
    )
    ? undefined
    : error;
}
function getRuleError(rule: AlarmRule, names: string[]) {
  return (
    getConditionError(rule.condition, names) ??
    getScheduleError(rule.condition.schedule, names)
  );
}
export function conditionSummary(condition: AlarmRule['condition']) {
  const expression = condition.expression;
  let summary = $t('alarm-rule.actions.addCondition');
  if (expression.type === 'TBEL') {
    summary = `${$t('alarm-rule.options.TBEL')}: ${expression.expression || $t('alarm-rule.actions.set')}`;
  } else if (expression.filters?.length) {
    summary = expression.filters
      .map(filterSummary)
      .join(` ${$t(`alarm-rule.options.${expression.operation ?? 'AND'}`)} `);
  }
  if (condition.type === 'SIMPLE') return summary;
  const amount = valueSummary(
    condition.type === 'DURATION' ? condition.value : condition.count,
  );
  return `${$t(`alarm-rule.options.${condition.type}`)} ${amount}${condition.type === 'DURATION' ? ` ${$t(`alarm-rule.options.${condition.unit}`)}` : ''}: ${summary}`;
}
function valueSummary(value?: AlarmRuleValue<unknown>): string {
  return typeof value?.dynamicValueArgument === 'string'
    ? value.dynamicValueArgument
    : (JSON.stringify(value?.staticValue) ?? $t('alarm-rule.actions.set'));
}
export function predicateSummary(
  item: AlarmRulePredicate,
  argument: string,
): string {
  if (item.type === 'COMPLEX')
    return `(${item.predicates?.map((child) => predicateSummary(child, argument)).join(` ${$t(`alarm-rule.options.${item.operation}`)} `) || $t('alarm-rule.validation.group')})`;
  if (item.type === 'NO_DATA')
    return `${argument} ${$t('alarm-rule.options.NO_DATA')} ${valueSummary(item.duration)} ${$t(`alarm-rule.options.${item.unit}`)}`;
  return `${argument} ${$t(`alarm-rule.options.${item.operation}`)} ${valueSummary(item.value)}`;
}
export function filterSummary(filter: AlarmRuleFilter): string {
  return (
    filter.predicates
      .map((item) => predicateSummary(item, filter.argument))
      .join(` ${$t(`alarm-rule.options.${filter.operation}`)} `) ||
    filter.argument
  );
}
export function scheduleSummary(schedule?: AlarmRuleSchedule) {
  if (typeof schedule?.dynamicValueArgument === 'string')
    return `${$t('alarm-rule.options.dynamic')}: ${schedule.dynamicValueArgument}`;
  const time = schedule?.staticValue;
  if (!time || time.type === 'ANY_TIME')
    return $t('alarm-rule.options.ANY_TIME');
  const format = (value?: number) =>
    Number.isFinite(value)
      ? `${String(Math.floor(Number(value) / 3_600_000)).padStart(2, '0')}:${String(Math.floor(Number(value) / 60_000) % 60).padStart(2, '0')}`
      : '--:--';
  const day = (value: number) => $t(`alarm-rule.options.weekdays.${value - 1}`);
  const range =
    time.type === 'SPECIFIC_TIME'
      ? `${time.daysOfWeek?.map(day).join(', ')} ${format(time.startsOn)}–${format(time.endsOn)}`
      : time.items
          ?.filter((item) => item.enabled)
          .map(
            (item) =>
              `${day(item.dayOfWeek)} ${format(item.startsOn)}–${format(item.endsOn)}`,
          )
          .join('; ');
  return `${$t(`alarm-rule.options.${time.type}`)} · ${range || $t('alarm-rule.actions.set')} · ${time.timezone ?? ''}`;
}
function cleanValue<T>(
  value: AlarmRuleValue<T> | undefined,
): AlarmRuleValue<T> | undefined {
  if (!value) return;
  return typeof value.dynamicValueArgument === 'string'
    ? { dynamicValueArgument: value.dynamicValueArgument }
    : { staticValue: value.staticValue };
}
function toPredicatePayload(item: AlarmRulePredicate): AlarmRulePredicate {
  if (item.type === 'COMPLEX')
    return {
      type: item.type,
      operation: item.operation,
      predicates: item.predicates?.map(toPredicatePayload),
    };
  if (item.type === 'NO_DATA')
    return {
      type: item.type,
      operation: 'NO_DATA',
      duration: cleanValue(item.duration),
      unit: item.unit,
    };
  return {
    type: item.type,
    operation: item.operation,
    value: cleanValue(item.value),
    ...(item.type === 'STRING' ? { ignoreCase: !!item.ignoreCase } : {}),
  };
}
/** Strip inactive editor modes; the root preserves definition/configuration metadata. */
export function toRulePayload(rule: AlarmRule): AlarmRule {
  const c = rule.condition;
  const schedule = cleanValue(c.schedule);
  return {
    alarmDetails: rule.alarmDetails,
    dashboardId: rule.dashboardId ?? null,
    condition: {
      type: c.type,
      expression:
        c.expression.type === 'TBEL'
          ? { type: 'TBEL', expression: c.expression.expression }
          : {
              type: 'SIMPLE',
              operation: c.expression.operation ?? 'AND',
              filters: c.expression.filters?.map((filter) => ({
                ...filter,
                predicates: filter.predicates.map(toPredicatePayload),
              })),
            },
      ...(schedule ? { schedule } : {}),
      ...(c.type === 'DURATION'
        ? { value: cleanValue(c.value), unit: c.unit }
        : {}),
      ...(c.type === 'REPEATING' ? { count: cleanValue(c.count) } : {}),
    },
  };
}

export function toAlarmRulePayload(
  formValues: AlarmRuleFormValues,
  configuration: AlarmRuleConfiguration,
  argumentValues: AlarmRuleConfiguration['arguments'],
  original?: AlarmRuleDefinition,
): AlarmRuleDefinition {
  return {
    ...original,
    name: formValues.name.trim(),
    entityId: { entityType: formValues.entityType, id: formValues.entityId },
    debugSettings: formValues.debugSettings,
    configuration: {
      ...configuration,
      type: 'ALARM',
      arguments: argumentValues,
      createRules: Object.fromEntries(
        Object.entries(configuration.createRules)
          .filter((entry): entry is [string, AlarmRule] => !!entry[1])
          .map(([severity, rule]) => [severity, toRulePayload(rule)]),
      ),
      clearRule: configuration.clearRule
        ? toRulePayload(configuration.clearRule)
        : null,
    },
  };
}

export function validatePredicate(
  ...args: Parameters<typeof getPredicateError>
): FormValidationIssue[] {
  const message = getPredicateError(...args);
  return message ? [{ fieldName: 'predicate', message }] : [];
}

export function validateFilter(
  ...args: Parameters<typeof getFilterError>
): FormValidationIssue[] {
  const message = getFilterError(...args);
  return message ? [{ fieldName: 'filter', message }] : [];
}

export function validateCondition(
  ...args: Parameters<typeof getConditionError>
): FormValidationIssue[] {
  const message = getConditionError(...args);
  return message ? [{ fieldName: 'condition', message }] : [];
}

export function validateSchedule(
  ...args: Parameters<typeof getScheduleError>
): FormValidationIssue[] {
  const message = getScheduleError(...args);
  return message ? [{ fieldName: 'schedule', message }] : [];
}

export function validateRule(
  ...args: Parameters<typeof getRuleError>
): FormValidationIssue[] {
  const message = getRuleError(...args);
  return message ? [{ fieldName: 'rule', message }] : [];
}
