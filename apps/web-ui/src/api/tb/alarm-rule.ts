/**
 * 报警规则接口(TENANT_ADMIN)
 * 契约参考:后端 AlarmRuleController.java
 * 注:TB 4.x 的报警规则以「计算字段(ALARM 类型)」为底层实现,id 为 CalculatedFieldId。
 */
import type { CalculatedFieldTestResult } from './calculated-field';

import type { FieldArgument } from '#/adapter/component/field-arguments/data';
import type { AlarmSeverity, EntityType } from '#/enums';
import type {
  BaseData,
  EntityDebugSettings,
  EntityId,
  PageData,
  PageLink,
} from '#/types/tb';

import { requestClient } from '#/api/request';

/** 报警规则定义(org.thingsboard.server.common.data.cf.AlarmRuleDefinition) */
export interface AlarmRuleDefinition extends BaseData<EntityType.CALCULATED_FIELD> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
  };
  configuration: AlarmRuleConfiguration;
  debugSettings?: EntityDebugSettings;
  configurationVersion?: number;
  /** 关联的目标实体(设备/资产/设备配置等) */
  entityId?: EntityId;
  name: string;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 报警规则信息(AlarmRuleDefinitionInfo,列表展示用,含所属实体名称) */
export interface AlarmRuleDefinitionInfo extends AlarmRuleDefinition {
  entityName?: string;
}

/** 报警规则分页列表(GET /api/alarm/rules) */
export function getAlarmRules({ entities, ...pageLink }: AlarmRulesQuery) {
  return requestClient.get<PageData<AlarmRuleDefinitionInfo>>('/alarm/rules', {
    params: { ...pageLink, entities: entities?.join(',') || undefined },
  });
}

/** 查询指定实体的报警规则。 */
export function getAlarmRulesByEntityId(entityId: EntityId, params: PageLink) {
  return requestClient.get<PageData<AlarmRuleDefinitionInfo>>(
    `/alarm/rules/${entityId.entityType}/${entityId.id}`,
    { params },
  );
}

/** 报警规则详情(GET /api/alarm/rule/{alarmRuleId}) */
export function getAlarmRuleById(alarmRuleId: string) {
  return requestClient.get<AlarmRuleDefinition>(`/alarm/rule/${alarmRuleId}`);
}

/** 删除报警规则(DELETE /api/alarm/rule/{alarmRuleId}) */
export function deleteAlarmRule(alarmRuleId: string): Promise<void> {
  return requestClient.delete(`/alarm/rule/${alarmRuleId}`);
}

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteAlarmRules(alarmRuleIds: string[]) {
  const ids = [...new Set(alarmRuleIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteAlarmRule(id)),
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

export type AlarmRuleValue<T> = {
  staticValue?: T;
  dynamicValueArgument?: string;
};
export type AlarmRuleTimeUnit = 'DAYS' | 'HOURS' | 'MINUTES' | 'SECONDS';
export interface AlarmRulePredicate {
  type: 'BOOLEAN' | 'COMPLEX' | 'NO_DATA' | 'NUMERIC' | 'STRING';
  operation: string;
  value?: AlarmRuleValue<boolean | number | string>;
  ignoreCase?: boolean;
  predicates?: AlarmRulePredicate[];
  unit?: AlarmRuleTimeUnit;
  duration?: AlarmRuleValue<number>;
}
export interface AlarmRuleFilter {
  argument: string;
  valueType: 'BOOLEAN' | 'DATE_TIME' | 'NUMERIC' | 'STRING';
  operation: 'AND' | 'OR';
  predicates: AlarmRulePredicate[];
}
export interface AlarmRuleSchedule {
  dynamicValueArgument?: string;
  staticValue?: {
    type: 'ANY_TIME' | 'CUSTOM' | 'SPECIFIC_TIME';
    timezone?: string;
    daysOfWeek?: number[];
    startsOn?: number;
    endsOn?: number;
    items?: {
      dayOfWeek: number;
      enabled: boolean;
      startsOn: number;
      endsOn: number;
    }[];
  };
}
export interface AlarmRule {
  condition: {
    type: 'DURATION' | 'REPEATING' | 'SIMPLE';
    expression: {
      type: 'SIMPLE' | 'TBEL';
      expression?: string;
      operation?: 'AND' | 'OR';
      filters?: AlarmRuleFilter[];
    };
    schedule?: AlarmRuleSchedule;
    unit?: AlarmRuleTimeUnit;
    value?: AlarmRuleValue<number>;
    count?: AlarmRuleValue<number>;
  };
  alarmDetails?: string;
  dashboardId?: EntityId<EntityType.DASHBOARD> | null;
}
export interface AlarmRuleConfiguration extends Record<string, unknown> {
  type: 'ALARM';
  arguments: Record<string, FieldArgument>;
  createRules: Partial<Record<AlarmSeverity, AlarmRule>>;
  clearRule?: AlarmRule | null;
  propagate?: boolean;
  propagateToOwner?: boolean;
  propagateToTenant?: boolean;
  propagateRelationTypes?: null | string[];
}
export interface AlarmRulesQuery extends PageLink {
  entityType?: EntityType;
  entities?: string[];
}
export function saveAlarmRule(rule: AlarmRuleDefinition) {
  return requestClient.post<AlarmRuleDefinition>('/alarm/rule', rule);
}
export function getAlarmRuleNames(params: PageLink) {
  return requestClient.get<PageData<string>>('/alarm/rules/names', { params });
}
export function getLatestAlarmRuleDebugEvent(id: string, signal?: AbortSignal) {
  const config = { signal, skipErrorHandler: true };
  return requestClient.get<null | { arguments?: string }>(
    `/alarm/rule/${id}/debug`,
    config,
  );
}
export function testAlarmRuleScript(
  expression: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const config = { signal, skipErrorHandler: true };
  return requestClient.post<CalculatedFieldTestResult>(
    '/alarm/rule/testScript',
    { expression, arguments: args },
    config,
  );
}
