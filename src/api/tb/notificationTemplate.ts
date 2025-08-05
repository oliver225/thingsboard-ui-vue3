import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { NotificationType } from '/@/enums/notificationEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface NotificationTemplate extends BasicModel<EntityType.NOTIFICATION_TEMPLATE> {
  tenantId?: EntityId<EntityType.TENANT>;
  name?: string; //cannot be longer than 255 chars
  notificationType?: NotificationType;
  configuration: { deliveryMethodsTemplates?: Recordable };
}

export function notificationTemplateList(params: BasicQuery, notificationTypes?: string) {
  return defHttp.get<Page<NotificationTemplate>>({
    url: '/api/notification/templates',
    params: { notificationTypes: notificationTypes, ...params },
  });
}

export function getNotificationTemplateById(notificationTemplateId: string) {
  return defHttp.get<NotificationTemplate>({
    url: `/api/notification/template/${notificationTemplateId}`,
  });
}

export function saveNotificationTemplate(data?: NotificationTemplate | any) {
  return defHttp.postJson<NotificationTemplate>({
    url: '/api/notification/template',
    data,
  });
}

export function deleteNotificationTemplate(notificationTemplateId: string) {
  return defHttp.delete<void>({
    url: `/api/notification/template/${notificationTemplateId}`,
  });
}
