/**
 * 通知收件人组(NotificationTarget)接口
 * 契约参考:NotificationTargetController.java
 */
import type {
  EntityType,
  NotificationTargetConfigType,
  NotificationTargetType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 平台用户过滤(usersFilter) */
export interface NotificationUsersFilter {
  [key: string]: any;
  /** CUSTOMER_USERS */
  customerId?: string;
  /** TENANT_ADMINISTRATORS(系统管理员按租户配置过滤) */
  tenantProfilesIds?: string[];
  /** TENANT_ADMINISTRATORS(系统管理员按租户过滤) */
  tenantsIds?: string[];
  type: NotificationTargetConfigType;
  /** USER_LIST */
  usersIds?: string[];
}

/** 收件人组配置(NotificationTargetConfig / configuration) */
export interface NotificationTargetConfig {
  [key: string]: any;
  /** MICROSOFT_TEAMS:频道名 */
  channelName?: string;
  description?: string;
  type: NotificationTargetType;
  /** PLATFORM_USERS */
  usersFilter?: NotificationUsersFilter;
  /** MICROSOFT_TEAMS:是否使用旧版 API */
  useOldApi?: boolean;
  /** MICROSOFT_TEAMS:Webhook 地址 */
  webhookUrl?: string;
}

/** 收件人组(NotificationTarget) */
export interface NotificationTarget extends BaseData<EntityType.NOTIFICATION_TARGET> {
  configuration?: NotificationTargetConfig;
  name?: string;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 收件人组分页列表(GET /api/notification/targets) */
export function getNotificationTargets(params: PageLink) {
  return requestClient.get<PageData<NotificationTarget>>(
    '/notification/targets',
    { params },
  );
}

/** 收件人组详情(GET /api/notification/target/{id}) */
export function getNotificationTargetById(notificationTargetId: string) {
  return requestClient.get<NotificationTarget>(
    `/notification/target/${notificationTargetId}`,
  );
}

/** 保存收件人组(POST /api/notification/target,带 id 为更新) */
export function saveNotificationTarget(target: NotificationTarget) {
  return requestClient.post<NotificationTarget>('/notification/target', target);
}

/** 删除收件人组(DELETE /api/notification/target/{id}) */
export function deleteNotificationTarget(
  notificationTargetId: string,
): Promise<void> {
  return requestClient.delete(`/notification/target/${notificationTargetId}`);
}
