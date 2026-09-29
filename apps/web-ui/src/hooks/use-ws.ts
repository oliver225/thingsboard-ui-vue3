import type { MaybeRefOrGetter } from 'vue';

import type { WsCommand, WsMessage, WsStatus } from '#/types/ws';

import {
  computed,
  onActivated,
  onDeactivated,
  ref,
  shallowRef,
  toValue,
  watch,
} from 'vue';

import { useAccessStore } from '@vben/stores';

import { useWebsocketStore } from '#/store/websocket';

/** 直接订阅 WS 命令，data 为服务端消息；连接与命令编号由 Store 管理。 */
export function useWs(command: MaybeRefOrGetter<undefined | WsCommand>) {
  const access = useAccessStore();
  const websocket = useWebsocketStore();
  const data = shallowRef<WsMessage>();
  const status = ref<WsStatus>('idle');
  const wsError = shallowRef<Error>();
  const active = ref(true);
  const revision = ref(0);
  const source = computed(() => toValue(command));
  const loggedIn = computed(() => !!access.accessToken);

  watch(
    [source, active, revision, loggedIn],
    ([command, isActive, , hasSession], _, onCleanup) => {
      data.value = undefined;
      wsError.value = undefined;
      status.value = 'idle';
      if (!command || !isActive || !hasSession) return;

      let cancelled = false;
      let unsubscribe: (() => void) | undefined;
      // 参数变化、刷新或组件销毁时，取消上一条订阅。
      onCleanup(() => {
        cancelled = true;
        unsubscribe?.();
      });

      try {
        unsubscribe = websocket.subscribe(command, {
          onReset: () => {
            if (!cancelled) data.value = undefined;
          },
          onData: (message) => {
            if (cancelled) return;
            data.value = message;
            wsError.value = undefined;
          },
          onStatus: (value) => {
            if (cancelled) return;
            status.value = value;
          },
          onError: (value) => {
            if (cancelled) return;
            wsError.value = value;
          },
        });
        if (cancelled) unsubscribe();
      } catch (error) {
        if (cancelled) return;
        status.value = 'error';
        wsError.value =
          error instanceof Error ? error : new Error(String(error));
      }
    },
    { immediate: true, flush: 'sync' },
  );

  onActivated(() => {
    active.value = true;
  });
  onDeactivated(() => {
    active.value = false;
  });

  function refresh() {
    revision.value++;
  }

  return {
    data,
    loading: computed(() => status.value === 'loading'),
    status,
    error: wsError,
    refresh,
  };
}
