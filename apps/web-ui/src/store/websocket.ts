/**
 * ThingsBoard WebSocket 客户端(/api/ws)
 * - 连接建立后先发 authCmd 鉴权:{ authCmd: { cmdId: 0, token } }
 * - 响应按 subscriptionId / cmdId 分发到注册的回调
 * 参考:旧项目 src/store/modules/websocket.ts(@vueuse/core useWebSocket)
 */
import type { UseWebSocketReturn } from '@vueuse/core';

import { ref, shallowRef } from 'vue';

import { useAccessStore } from '@vben/stores';

import { useWebSocket } from '@vueuse/core';
import { defineStore } from 'pinia';

const WS_PATH = '/api/ws';

function buildWsUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${location.host}${WS_PATH}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useWebsocketStore = defineStore('tb-websocket', () => {
  const cmdId = ref(0);
  const websocket = shallowRef<null | UseWebSocketReturn<any>>(null);
  const callbackMap = new Map<number, (data: any) => void>();

  /** 取下一个命令 ID(自增) */
  function getAndIncrementCmdId(): number {
    cmdId.value += 1;
    return cmdId.value;
  }

  function onMessage(_ws: WebSocket, { data }: MessageEvent) {
    const dataObj = JSON.parse(data);
    if (Object.hasOwn(dataObj, 'subscriptionId')) {
      callbackMap.get(dataObj.subscriptionId)?.(dataObj);
    } else if (Object.hasOwn(dataObj, 'cmdId')) {
      callbackMap.get(dataObj.cmdId)?.(dataObj);
    }
  }

  function initWebsocket() {
    const accessStore = useAccessStore();
    websocket.value = useWebSocket<any>(buildWsUrl(), {
      autoClose: false,
      autoReconnect: false,
      onConnected: (ws) => {
        ws.send(
          JSON.stringify({
            authCmd: { cmdId: 0, token: accessStore.accessToken },
          }),
        );
      },
      onMessage,
    });
    return websocket.value.ws;
  }

  /** 发送订阅/命令,并为 cmdId 注册回调 */
  async function send(
    id: Array<number> | number,
    data: any,
    callback?: (data: any) => void,
  ): Promise<boolean> {
    if (websocket.value === null) {
      initWebsocket();
    }
    if (websocket.value === null) return false;
    if (websocket.value.status.value === 'CLOSED') {
      websocket.value.open();
      await sleep(500);
    }
    if (callback) {
      const ids = Array.isArray(id) ? id : [id];
      ids.forEach((i) => callbackMap.set(i, callback));
    }
    return websocket.value.send(JSON.stringify(data));
  }

  /** 退订并清理回调 */
  async function unsubscribe(id: Array<number> | number, data: any) {
    if (websocket.value !== null) {
      if (websocket.value.status.value === 'CLOSED') {
        websocket.value.open();
        await sleep(250);
      }
      websocket.value.send(JSON.stringify(data));
    }
    const ids = Array.isArray(id) ? id : [id];
    ids.forEach((i) => callbackMap.delete(i));
  }

  function close() {
    websocket.value?.close();
    websocket.value = null;
    callbackMap.clear();
  }

  function $reset() {
    close();
    cmdId.value = 0;
  }

  return {
    $reset,
    close,
    getAndIncrementCmdId,
    send,
    unsubscribe,
  };
});
