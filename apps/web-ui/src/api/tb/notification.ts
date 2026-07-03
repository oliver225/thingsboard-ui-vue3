/**
 * 通知接口
 * 契约参考:NotificationController.java
 */
import type {
  EntityType,
  NotificationRequestStatus,
  NotificationStatus,
  NotificationType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';
import { NotificationDeliveryMethod } from '#/enums';

/** 通知附带信息(NotificationInfo) */
export interface NotificationInfo {
  [key: string]: any;
  stateEntityId?: EntityId;
  templateData?: Record<string, any>;
}

/** 通知额外配置(additionalConfig) */
export interface NotificationConfig {
  [key: string]: any;
  actionButtonConfig?: {
    [key: string]: any;
    enabled?: boolean;
    link?: string;
    linkType?: string;
    text?: string;
  };
  icon?: { color?: string; enabled?: boolean; icon?: string };
}

/** 通知实体(org.thingsboard.server.common.data.notification.Notification) */
export interface Notification extends BaseData<EntityType.NOTIFICATION> {
  additionalConfig?: NotificationConfig;
  deliveryMethod?: NotificationDeliveryMethod;
  info?: NotificationInfo;
  recipientId?: EntityId<EntityType.USER>;
  requestId?: EntityId<EntityType.NOTIFICATION_REQUEST>;
  status?: NotificationStatus;
  subject?: string;
  text?: string;
  type?: NotificationType;
}

/** 收件箱分页查询参数 */
export interface NotificationQuery extends PageLink {
  /** 投递方式,收件箱固定为 WEB */
  deliveryMethod?: NotificationDeliveryMethod;
  /** 仅未读 */
  unreadOnly?: boolean;
}

/** 当前用户通知分页列表(GET /api/notifications) */
export function getNotifications(params: NotificationQuery) {
  return requestClient.get<PageData<Notification>>('/notifications', {
    params: {
      deliveryMethod: NotificationDeliveryMethod.WEB,
      unreadOnly: false,
      ...params,
    },
  });
}

/** 未读通知数(GET /api/notifications/unread/count) */
export function getUnreadNotificationsCount(
  deliveryMethod: NotificationDeliveryMethod = NotificationDeliveryMethod.WEB,
) {
  return requestClient.get<number>('/notifications/unread/count', {
    params: { deliveryMethod },
  });
}

/** 标记单条通知为已读(PUT /api/notification/{id}/read) */
export function markNotificationAsRead(notificationId: string): Promise<void> {
  return requestClient.put(`/notification/${notificationId}/read`);
}

/** 标记全部通知为已读(PUT /api/notifications/read) */
export function markAllNotificationsAsRead(
  deliveryMethod: NotificationDeliveryMethod = NotificationDeliveryMethod.WEB,
): Promise<void> {
  return requestClient.put('/notifications/read', undefined, {
    params: { deliveryMethod },
  });
}

/** 删除通知(DELETE /api/notification/{id}) */
export function deleteNotification(notificationId: string): Promise<void> {
  return requestClient.delete(`/notification/${notificationId}`);
}

/**
 * 发送统计(NotificationRequestStats)
 * 注:后端 `totalSent` 标了 @JsonIgnore,不会下发;成功总数需对 `sent` 求和。
 */
export interface NotificationRequestStats {
  [key: string]: any;
  /** 整体错误信息(整条请求失败时) */
  error?: string;
  /** 各投递方式失败:{ 方式: { 收件人: 错误信息 } } */
  errors?: Record<string, Record<string, string>>;
  /** 各投递方式成功数:{ 方式: 数量 } */
  sent?: Record<string, number>;
  /** 失败总数(后端序列化字段,errors 为空时为 0) */
  totalErrors?: number;
}

/** 通知发送请求(NotificationRequest) */
export interface NotificationRequest extends BaseData<EntityType.NOTIFICATION_REQUEST> {
  additionalConfig?: { [key: string]: any; sendingDelayInSec?: number };
  info?: NotificationInfo;
  originatorEntityId?: EntityId;
  ruleId?: EntityId<EntityType.NOTIFICATION_RULE>;
  status?: NotificationRequestStatus;
  stats?: NotificationRequestStats;
  targets?: string[];
  templateId?: EntityId<EntityType.NOTIFICATION_TEMPLATE>;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 发送请求信息(NotificationRequestInfo,列表展示用) */
export interface NotificationRequestInfo extends NotificationRequest {
  deliveryMethods?: NotificationDeliveryMethod[];
  templateName?: string;
}

/** 发送记录分页列表(GET /api/notification/requests) */
export function getNotificationRequests(params: PageLink) {
  return requestClient.get<PageData<NotificationRequestInfo>>(
    '/notification/requests',
    { params },
  );
}

/** 发送请求详情(GET /api/notification/request/{id}) */
export function getNotificationRequestById(notificationRequestId: string) {
  return requestClient.get<NotificationRequestInfo>(
    `/notification/request/${notificationRequestId}`,
  );
}

/** 删除发送请求(DELETE /api/notification/request/{id}) */
export function deleteNotificationRequest(
  notificationRequestId: string,
): Promise<void> {
  return requestClient.delete(`/notification/request/${notificationRequestId}`);
}

/** 单个通知类型的偏好(UserNotificationSettings.NotificationPref) */
export interface NotificationPref {
  enabled: boolean;
  /** 各投递方式开关:WEB / EMAIL / SMS / MOBILE_APP */
  enabledDeliveryMethods: Record<string, boolean>;
}

/** 用户通知设置(UserNotificationSettings):prefs 以通知类型为 key */
export interface UserNotificationSettings {
  prefs: Record<string, NotificationPref>;
}

/** 获取当前用户通知设置(GET /api/notification/settings/user) */
export function getUserNotificationSettings() {
  return requestClient.get<UserNotificationSettings>(
    '/notification/settings/user',
  );
}

/** 保存当前用户通知设置(POST /api/notification/settings/user) */
export function saveUserNotificationSettings(
  settings: UserNotificationSettings,
) {
  return requestClient.post<UserNotificationSettings>(
    '/notification/settings/user',
    settings,
  );
}

/** 单个投递方式的系统级配置(NotificationDeliveryMethodConfig) */
export interface NotificationDeliveryMethodConfig {
  /** Slack 机器人令牌(method = SLACK) */
  botToken?: string;
  method: NotificationDeliveryMethod;
  [key: string]: any;
}

/**
 * 系统通知设置(NotificationSettings)
 * deliveryMethodsConfigs 以投递方式为 key,目前社区版可配置 SLACK(机器人令牌)
 */
export interface NotificationSettings {
  deliveryMethodsConfigs: Partial<
    Record<NotificationDeliveryMethod, NotificationDeliveryMethodConfig>
  >;
}

/** 获取系统通知设置(GET /api/notification/settings) */
export function getNotificationSettings() {
  return requestClient.get<NotificationSettings>('/notification/settings');
}

/** 保存系统通知设置(POST /api/notification/settings) */
export function saveNotificationSettings(settings: NotificationSettings) {
  return requestClient.post<NotificationSettings>(
    '/notification/settings',
    settings,
  );
}
