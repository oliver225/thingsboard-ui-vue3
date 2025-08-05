import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { NotificationType } from '/@/enums/notificationEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface NotificationRule extends BasicModel<EntityType.NOTIFICATION_RULE> {
  tenantId?: EntityId<EntityType.TENANT>;
  name?: string; //cannot be longer than 255 chars
  templateId?: EntityId<EntityType.NOTIFICATION_TEMPLATE>;
  triggerType?: NotificationType;
  triggerConfig?: Recordable;
  recipientsConfig?: { triggerType: NotificationType; targets?: [string]; escalationTable?: Map<number, [string]> };
  additionalConfig?: { description?: string };
}
export interface NotificationRuleInfo extends NotificationRule {
  templateName?: string;
  deliveryMethods?: [string];
}

export function notificationRuleInfoList(params: BasicQuery) {
  return defHttp.get<Page<NotificationRuleInfo>>({
    url: '/api/notification/rules',
    params,
  });
}

export function getNotificationRuleById(notificationRuleId: string) {
  return defHttp.get<NotificationRuleInfo>({
    url: `/api/notification/rule/${notificationRuleId}`,
  });
}

export function saveNotificationRule(data?: NotificationRule | any) {
  return defHttp.postJson<NotificationRule>({
    url: '/api/notification/rule',
    data,
  });
}

export function deleteNotificationRule(notificationRuleId: string) {
  return defHttp.delete<void>({
    url: `/api/notification/rule/${notificationRuleId}`,
  });
}
