/**
 * 通知模板(NotificationTemplate)接口
 * 契约参考:NotificationTemplateController.java
 */
import type {
  EntityType,
  NotificationDeliveryMethod,
  NotificationType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 单个投递方式的模板(DeliveryMethodNotificationTemplate) */
export interface DeliveryMethodNotificationTemplate {
  [key: string]: any;
  /** 正文 */
  body?: string;
  enabled?: boolean;
  method?: NotificationDeliveryMethod;
  /** 主题(WEB / EMAIL) */
  subject?: string;
}

/** 模板配置(NotificationTemplateConfig) */
export interface NotificationTemplateConfig {
  /** 以投递方式为 key 的模板集合 */
  deliveryMethodsTemplates?: Partial<
    Record<NotificationDeliveryMethod, DeliveryMethodNotificationTemplate>
  >;
}

/** 通知模板(NotificationTemplate) */
export interface NotificationTemplate extends BaseData<EntityType.NOTIFICATION_TEMPLATE> {
  configuration?: NotificationTemplateConfig;
  name?: string;
  notificationType?: NotificationType;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 模板分页查询参数 */
export interface NotificationTemplateQuery extends PageLink {
  /** 按通知类型过滤(逗号分隔) */
  notificationTypes?: string;
}

/** 通知模板分页列表(GET /api/notification/templates) */
export function getNotificationTemplates(params: NotificationTemplateQuery) {
  return requestClient.get<PageData<NotificationTemplate>>(
    '/notification/templates',
    { params },
  );
}

/** 通知模板详情(GET /api/notification/template/{id}) */
export function getNotificationTemplateById(notificationTemplateId: string) {
  return requestClient.get<NotificationTemplate>(
    `/notification/template/${notificationTemplateId}`,
  );
}

/** 保存通知模板(POST /api/notification/template,带 id 为更新) */
export function saveNotificationTemplate(template: NotificationTemplate) {
  return requestClient.post<NotificationTemplate>(
    '/notification/template',
    template,
  );
}

/** 删除通知模板(DELETE /api/notification/template/{id}) */
export function deleteNotificationTemplate(
  notificationTemplateId: string,
): Promise<void> {
  return requestClient.delete(
    `/notification/template/${notificationTemplateId}`,
  );
}
