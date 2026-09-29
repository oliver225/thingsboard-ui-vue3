import type { MaybeRefOrGetter } from 'vue';

import type { WsCommand } from '#/types/ws';

import { computed, ref, shallowRef, toValue, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { useWebsocketStore } from '#/store/websocket';
import { mergeNotifications } from '#/utils/notifications';

import { useWs } from './use-ws';

/** 与 ui-ngx 一致：收起时订阅数量，展开时订阅最近六条未读通知。 */
export function useNotifications(expanded: MaybeRefOrGetter<boolean> = false) {
  const access = useAccessStore();
  const websocket = useWebsocketStore();
  const command = computed<WsCommand>(() =>
    toValue(expanded)
      ? { type: 'NOTIFICATIONS', limit: 6 }
      : { type: 'NOTIFICATIONS_COUNT' },
  );
  const stream = useWs(command);
  const state = shallowRef(mergeNotifications(undefined, {}));
  const actionError = ref(false);

  watch(
    () => !!access.accessToken,
    (loggedIn) => {
      if (!loggedIn) state.value = mergeNotifications(undefined, {});
    },
    { flush: 'sync' },
  );

  watch(
    stream.data,
    (message) => {
      if (!message) {
        // 新订阅/重连的序号从头开始，保留角标直至新的权威快照到达。
        state.value = { ...state.value, notifications: [], sequenceNumber: -1 };
        return;
      }
      if (
        message.cmdUpdateType !== 'NOTIFICATIONS' &&
        message.cmdUpdateType !== 'NOTIFICATIONS_COUNT'
      )
        return;
      state.value = mergeNotifications(state.value, message, 6);
      actionError.value = false;
    },
    { flush: 'sync' },
  );

  function markRead(id?: string) {
    actionError.value = false;
    try {
      websocket.send(
        id
          ? { type: 'MARK_NOTIFICATIONS_AS_READ', notifications: [id] }
          : { type: 'MARK_ALL_NOTIFICATIONS_AS_READ' },
      );
      // 写命令没有成功回执；列表与角标只根据服务端推送更新。
    } catch {
      actionError.value = true;
    }
  }

  return {
    ...stream,
    notifications: computed(() => state.value.notifications),
    unreadCount: computed(() => state.value.totalUnreadCount),
    actionError,
    markRead,
  };
}
