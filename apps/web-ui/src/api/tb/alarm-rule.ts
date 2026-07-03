/**
 * 报警规则接口(TENANT_ADMIN)
 * 契约参考:后端 AlarmRuleController.java
 * 注:TB 4.x 的报警规则以「计算字段(ALARM 类型)」为底层实现,id 为 CalculatedFieldId。
 */
import type { EntityType } from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 报警规则定义(org.thingsboard.server.common.data.cf.AlarmRuleDefinition) */
export interface AlarmRuleDefinition extends BaseData<EntityType.CALCULATED_FIELD> {
  additionalInfo?: {
    [key: string]: any;
    description?: string;
  };
  configuration?: Record<string, any>;
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
export function getAlarmRules(pageLink: PageLink) {
  return requestClient.get<PageData<AlarmRuleDefinitionInfo>>('/alarm/rules', {
    params: { ...pageLink },
  });
}

/** 报警规则详情(GET /api/alarm/rule/{alarmRuleId}) */
export function getAlarmRuleById(alarmRuleId: string) {
  return requestClient.get<AlarmRuleDefinition>(`/alarm/rule/${alarmRuleId}`);
}

/** 删除报警规则(DELETE /api/alarm/rule/{alarmRuleId}) */
export function deleteAlarmRule(alarmRuleId: string): Promise<void> {
  return requestClient.delete(`/alarm/rule/${alarmRuleId}`);
}
