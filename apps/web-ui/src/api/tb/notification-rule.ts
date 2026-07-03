/**
 * 通知规则(NotificationRule)接口
 * 契约参考:NotificationRuleController.java
 */
import type {
  EntityType,
  NotificationDeliveryMethod,
  NotificationRuleTriggerType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 触发器配置(随 triggerType 变化) */
export type NotificationRuleTriggerConfig = Record<string, any>;

/** 收件人配置(随 triggerType 变化:普通 targets,或 ALARM 的 escalationTable) */
export interface NotificationRuleRecipientsConfig {
  [key: string]: any;
  /** ALARM:升级链 { 秒数: targetIds[] } */
  escalationTable?: Record<string, string[]>;
  /** 普通:收件人组 id 列表 */
  targets?: string[];
  triggerType?: NotificationRuleTriggerType;
}

/** 通知规则(NotificationRule) */
export interface NotificationRule extends BaseData<EntityType.NOTIFICATION_RULE> {
  additionalConfig?: { [key: string]: any; description?: string };
  enabled?: boolean;
  name?: string;
  recipientsConfig?: NotificationRuleRecipientsConfig;
  templateId?: EntityId<EntityType.NOTIFICATION_TEMPLATE>;
  tenantId?: EntityId<EntityType.TENANT>;
  triggerConfig?: NotificationRuleTriggerConfig;
  triggerType?: NotificationRuleTriggerType;
}

/** 规则信息(NotificationRuleInfo,列表展示用) */
export interface NotificationRuleInfo extends NotificationRule {
  deliveryMethods?: NotificationDeliveryMethod[];
  templateName?: string;
}

/** 通知规则分页列表(GET /api/notification/rules) */
export function getNotificationRules(params: PageLink) {
  return requestClient.get<PageData<NotificationRuleInfo>>(
    '/notification/rules',
    { params },
  );
}

/** 通知规则详情(GET /api/notification/rule/{id}) */
export function getNotificationRuleById(notificationRuleId: string) {
  return requestClient.get<NotificationRule>(
    `/notification/rule/${notificationRuleId}`,
  );
}

/** 保存通知规则(POST /api/notification/rule,带 id 为更新) */
export function saveNotificationRule(rule: NotificationRule) {
  return requestClient.post<NotificationRule>('/notification/rule', rule);
}

/** 删除通知规则(DELETE /api/notification/rule/{id}) */
export function deleteNotificationRule(
  notificationRuleId: string,
): Promise<void> {
  return requestClient.delete(`/notification/rule/${notificationRuleId}`);
}
