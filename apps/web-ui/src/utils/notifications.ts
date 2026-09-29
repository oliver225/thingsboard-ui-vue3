import type { Notification } from '#/api/tb/notification';
import type { NotificationMessage, WsNotifications } from '#/types/ws';

/** 合并全量快照和增量，拒绝同一订阅内重复或乱序的消息。 */
export function mergeNotifications(
  previous: undefined | WsNotifications,
  message: Partial<NotificationMessage>,
  limit = 6,
): WsNotifications {
  const state = previous ?? {
    notifications: [],
    totalUnreadCount: 0,
    sequenceNumber: -1,
  };
  if (
    message.sequenceNumber !== undefined &&
    message.sequenceNumber <= state.sequenceNumber
  )
    return state;
  let notifications = message.notifications ?? state.notifications;
  const update = message.update;
  const updateId = update?.id?.id;
  if (update && updateId) {
    notifications = notifications.filter((item) => item.id?.id !== updateId);
    if (update.status !== 'READ') notifications = [update, ...notifications];
  }
  const totalUnreadCount = message.totalUnreadCount ?? state.totalUnreadCount;
  return {
    notifications:
      totalUnreadCount === 0
        ? []
        : [
            ...new Map(
              notifications
                .filter((item) => item.id?.id && item.status !== 'READ')
                .map((item) => [item.id?.id, item]),
            ).values(),
          ]
            .toSorted((a, b) => (b.createdTime ?? 0) - (a.createdTime ?? 0))
            .slice(0, limit),
    totalUnreadCount,
    sequenceNumber: message.sequenceNumber ?? state.sequenceNumber,
  };
}

/** 通知可能带 HTML，作为纯文本展示，避免执行消息中的标记。 */
export function notificationText(value?: string) {
  if (!value) return '';
  const document = new DOMParser().parseFromString(value, 'text/html');
  document.querySelectorAll('script, style').forEach((node) => node.remove());
  document.querySelectorAll('br').forEach((node) => node.replaceWith('\n'));
  return document.body.textContent ?? '';
}

export function notificationLink(
  notification: Notification,
): string | undefined {
  const button = notification.additionalConfig?.actionButtonConfig;
  if (!button?.enabled) return;
  let link = button.link?.trim();
  if (button.linkType === 'DASHBOARD' && button.dashboardId) {
    link = `/dashboards/${encodeURIComponent(button.dashboardId)}`;
    if (button.dashboardState || button.setEntityIdInState) {
      const state = [
        {
          ...(button.dashboardState ? { id: button.dashboardState } : {}),
          params: button.setEntityIdInState
            ? { entityId: notification.info?.stateEntityId ?? null }
            : {},
        },
      ];
      const bytes = new TextEncoder().encode(JSON.stringify(state));
      const encoded = encodeURIComponent(btoa(String.fromCodePoint(...bytes)));
      link += `?state=${encoded}`;
    }
  }
  if (!link) return;
  if (link.startsWith('/') && !link.startsWith('//') && !link.includes('\\'))
    return link;
  try {
    const url = new URL(link);
    if (['http:', 'https:'].includes(url.protocol)) return url.href;
  } catch {
    /* 无效链接不显示操作按钮。 */
  }
}
