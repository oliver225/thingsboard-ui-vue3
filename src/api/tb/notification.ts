import { BasicModel, BasicQuery, Page } from '../model/baseModel';
import { NotificationTemplate } from './notificationTemplate';
import { NotificationRequestStatus, NotificationStatus, NotificationType } from '/@/enums/notificationEnum';
import { defHttp } from '/@/utils/http/axios';
import { EntityType } from '/@/enums/entityTypeEnum';

export interface Notification extends BasicModel<EntityType.NOTIFICATION> {
  requestId?: EntityId<EntityType.NOTIFICATION_REQUEST>; //  entityType: "NOTIFICATION_REQUEST"
  recipientId?: EntityId<EntityType.USER>; //  entityType : "USER"
  subject?: string;
  type?: NotificationType;
  text?: string;
  info?: NotificationInfo;
  status?: NotificationStatus;
  additionalConfig?: NotificationConfig;
}

export interface NotificationConfig {
  actionButtonConfig: { enabled: boolean; text?: string; linkType?: string; link?: string };
  icon: { enabled?: boolean; icon?: string; color?: string };
  [key: string]: any;
}
export interface NotificationInfo {
  stateEntityId: EntityId<any>;
  templateData: Recordable;
  [key: string]: any;
}

export interface NotificationRequest extends BasicModel<EntityType.NOTIFICATION_REQUEST> {
  tenantId?: EntityId<EntityType.TENANT>;
  targets?: string[];
  templateId?: EntityId<EntityType.NOTIFICATION_TEMPLATE>;
  template?: NotificationTemplate;
  info?: NotificationInfo;
  additionalConfig?: { sendingDelayInSec: number; [key: string]: any };
  originatorEntityId: EntityId<any>;
  ruleId?: EntityId<EntityType.NOTIFICATION_RULE>; // entityType: NOTIFICATION_RULE
  status?: NotificationRequestStatus;
  stats?: {
    sent?: Map<string, number>;
    errors?: Map<string, string>;
    error?: string;
  };
}

export interface NotificationRequestInfo extends NotificationRequest {
  templateName: string;
  deliveryMethods: string[];
}
export interface NotificationRequestPreview {
  processedTemplates: Recordable;
  totalRecipientsCount: number;
  recipientsCountByTarget: Recordable;
  recipientsPreview: string[];
}
export interface NotificationSettings {
  prefs: Map<NotificationType, NotificationPref>;
}

export interface NotificationPref {
  enabled: boolean;
  enabledDeliveryMethods: Map<string, boolean>;
}

export function notificationList(params: BasicQuery, unreadOnly = true) {
  return defHttp.get<Page<Notification>>({
    url: `/api/notifications`,
    params: { ...params, unreadOnly: unreadOnly },
  });
}
export function markNotificationAsRead(notificationId: string) {
  return defHttp.put<void>({
    url: `/api/notification/${notificationId}/read`,
  });
}

export function markAllNotificationAsRead() {
  return defHttp.put<void>({
    url: `/api/notifications/read`,
  });
}

export function deleteNotification(notificationId: string) {
  return defHttp.delete<void>({
    url: `/api/notification/${notificationId}`,
  });
}
// 返回可以使用的 发送消息的方式
export function getDeliveryMethods() {
  return defHttp.get<[string]>({
    url: `/api/notification/deliveryMethods`,
  });
}

// NotificationRequest

export function notificationRequestList(params: BasicQuery) {
  return defHttp.get<Page<NotificationRequestInfo>>({
    url: `/api/notification/requests`,
    params,
  });
}

export function createNotificationRequest(data: NotificationRequest | any) {
  return defHttp.postJson<NotificationRequest>({
    url: `/api/notification/request`,
    data,
  });
}

export function getNotificationRequestById(notificationRequestId: string) {
  return defHttp.get<NotificationRequestInfo>({
    url: `/api/notification/request/${notificationRequestId}`,
  });
}

export function deleteNotificationRequest(notificationRequestId: string) {
  return defHttp.delete<void>({
    url: `/api/notification/request/${notificationRequestId}`,
  });
}

export function getNotificationRequestPreview(data: NotificationRequest | any, recipientsPreviewSize = 20) {
  return defHttp.postJson<NotificationRequestPreview>({
    url: `/api/notification/request/preview`,
    params: { recipientsPreviewSize: recipientsPreviewSize },
    data,
  });
}

export function getNotificationSettings() {
  return defHttp.get<NotificationSettings>({
    url: `/api/notification/settings`,
  });
}

export function saveNotificationSettings(data: NotificationSettings | any) {
  return defHttp.postJson<NotificationSettings>({
    url: `/api/notification/settings`,
    data,
  });
}

export function getUserNotificationSettings() {
  return defHttp.get<NotificationSettings>({
    url: `/api/notification/settings/user`,
  });
}

export function saveUserNotificationSettings(data: NotificationSettings | any) {
  return defHttp.postJson<NotificationSettings>({
    url: `/api/notification/settings/user`,
    data,
  });
}
