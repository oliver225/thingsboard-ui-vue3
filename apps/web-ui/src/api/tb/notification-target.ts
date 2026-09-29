/**
 * 通知收件人组(NotificationTarget)接口
 * 契约参考:NotificationTargetController.java
 */
import type {
  EntityType,
  NotificationRuleTriggerType,
  NotificationTargetConfigType,
  NotificationTargetType,
  NotificationType,
} from '#/enums';
import type { BaseData, EntityId, PageData, PageLink } from '#/types/tb';

import { requestClient } from '#/api/request';

export type SlackConversationType =
  | 'DIRECT'
  | 'PRIVATE_CHANNEL'
  | 'PUBLIC_CHANNEL';

export interface SlackConversation {
  id: string;
  title: string;
  name: string;
  wholeName: string;
  email: string;
  type: string;
}

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
  /** SLACK:会话类型及接收会话 */
  conversationType?: SlackConversationType;
  conversation?: SlackConversation;
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
export function getNotificationTargets(
  params: PageLink & {
    notificationType?: NotificationRuleTriggerType | NotificationType;
  },
) {
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

/** Slack 集成下可用的频道或私信会话。 */
export function getSlackConversations(
  type: SlackConversationType,
  token?: string,
) {
  return requestClient.get<SlackConversation[]>(
    '/notification/slack/conversations',
    {
      params: { type, token },
    },
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

/** 逐项删除并返回失败 ID，供列表仅重试失败项。 */
export async function deleteNotificationTargets(
  notificationTargetIds: string[],
) {
  const ids = [...new Set(notificationTargetIds)];
  const results = await Promise.allSettled(
    ids.map((id) => deleteNotificationTarget(id)),
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
