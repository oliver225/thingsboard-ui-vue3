import type {
  WsCommand,
  WsHandlers,
  WsMessage,
  WsRequestOptions,
} from '#/types/ws';

import { onScopeDispose, watch } from 'vue';

import { useAppConfig } from '@vben/hooks';
import { useAccessStore } from '@vben/stores';

import { useTimeoutFn, useWebSocket } from '@vueuse/core';
import { defineStore } from 'pinia';

import { getAccessToken } from '#/api/request';

interface Entry {
  cmdId: number;
  command: WsCommand;
  handlers: WsHandlers;
  persistent: boolean;
  sent: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

/** VueUse 管理连接；store 管理鉴权、消息分发和订阅记录。 */
export const useWebsocketStore = defineStore('websocket', () => {
  const access = useAccessStore();
  const entries = new Map<number, Entry>();
  let nextId = 0;
  let started = false;
  let ready = false;
  let closing = false;
  const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
  const url = new URL(
    `${apiURL.replace(/\/$/, '')}/ws`,
    window.location.origin,
  );
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  const socket = useWebSocket<string>(url.toString(), {
    immediate: false,
    autoConnect: false,
    autoReconnect: { retries: () => entries.size > 0, delay: 3000 },
    onConnected: authenticate,
    onDisconnected(ws, event) {
      if (ws !== socket.ws.value || closing) return;
      ready = false;
      // BAD_DATA 包含无效凭证/协议错误，不盲目刷新或无限重连。
      if ([1007, 1008, 4401, 4403].includes(event.code)) {
        close(event.reason || 'WebSocket access rejected');
        return;
      }
      for (const entry of [...entries.values()]) {
        if (!entries.has(entry.cmdId)) continue;
        clearTimeout(entry.timer);
        entry.sent = false;
        if (!entry.persistent) {
          fail(entry, new Error('WebSocket connection interrupted'));
          continue;
        }
        entries.delete(entry.cmdId);
        entry.cmdId = ++nextId;
        entries.set(entry.cmdId, entry);
        try {
          entry.handlers.onStatus?.('stale');
        } catch (error) {
          fail(entry, asError(error));
        }
      }
      checkIdle();
    },
    onMessage(ws, event) {
      if (ws === socket.ws.value && ready) receive(String(event.data));
    },
  });
  const idle = useTimeoutFn(
    () => {
      if (entries.size === 0) close();
    },
    5000,
    { immediate: false },
  );

  async function authenticate(ws: WebSocket) {
    try {
      const token = await getAccessToken();
      if (ws !== socket.ws.value || socket.status.value !== 'OPEN' || !started)
        return;
      // 服务端没有单独的鉴权成功回执；同一连接按帧顺序处理。
      write({ authCmd: { cmdId: 0, token } });
      ready = true;
      for (const entry of [...entries.values()]) publish(entry);
      checkIdle();
    } catch (error) {
      if (ws === socket.ws.value && started) close(asError(error).message);
    }
  }

  function write(message: unknown) {
    // 禁用发送缓冲，防止取消后的命令或写操作在重连后被重放。
    if (!socket.send(JSON.stringify(message), false))
      throw new Error('WebSocket is not connected');
  }

  function close(reason = 'WebSocket session closed') {
    if (closing) return;
    closing = true;
    ready = false;
    started = false;
    socket.close();
    idle.stop();
    for (const entry of [...entries.values()]) fail(entry, new Error(reason));
    closing = false;
  }

  function checkIdle() {
    if (closing || entries.size > 0) return;
    if (socket.status.value === 'OPEN') idle.start();
    else close();
  }

  function add(command: WsCommand, handlers: WsHandlers, persistent: boolean) {
    if (closing) throw new Error('WebSocket session is closing');
    if (entries.size >= 1000)
      throw new Error('Too many active WebSocket requests');
    const entry: Entry = {
      cmdId: ++nextId,
      command,
      handlers,
      persistent,
      sent: false,
    };
    entries.set(entry.cmdId, entry);
    idle.stop();
    try {
      handlers.onStatus?.('loading');
      if (entries.has(entry.cmdId)) {
        if (ready) publish(entry);
        else if (!started) {
          started = true;
          socket.open();
        }
      }
    } catch (error) {
      fail(entry, asError(error));
    }
    return () => remove(entry);
  }

  function publish(entry: Entry) {
    if (!ready || !entries.has(entry.cmdId)) return;
    try {
      entry.handlers.onReset?.();
      entry.handlers.onStatus?.('loading');
      if (!entries.has(entry.cmdId)) return;
      if (entry.persistent) {
        entry.timer = setTimeout(
          () => fail(entry, new Error('WebSocket subscription timed out')),
          15_000,
        );
      }
      write({ cmds: [{ ...entry.command, cmdId: entry.cmdId }] });
      entry.sent = true;
    } catch (error) {
      fail(entry, asError(error));
    }
  }

  function receive(raw: string) {
    let message: WsMessage;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('Invalid WebSocket message');
      message = parsed as WsMessage;
    } catch (error) {
      close(asError(error).message);
      return;
    }
    const id =
      'subscriptionId' in message ? message.subscriptionId : message.cmdId;
    if (id === 0 && message.errorCode) {
      close(message.errorMsg || 'WebSocket authentication failed');
      return;
    }
    const entry = id === undefined ? undefined : entries.get(id);
    if (!entry) return;
    if (message.errorCode) {
      fail(
        entry,
        new Error(message.errorMsg || `WebSocket error ${message.errorCode}`),
      );
      return;
    }
    clearTimeout(entry.timer);
    try {
      entry.handlers.onData(message);
      if (entries.has(entry.cmdId)) entry.handlers.onStatus?.('live');
    } catch (error) {
      fail(entry, asError(error));
    }
  }

  function remove(entry: Entry) {
    if (!entries.delete(entry.cmdId)) return;
    clearTimeout(entry.timer);
    if (entry.sent && ready) {
      const command = cancelCommand(entry.command, entry.cmdId);
      if (command) {
        try {
          write({ cmds: [command] });
        } catch (error) {
          close(asError(error).message);
        }
      }
    }
    checkIdle();
  }

  function fail(entry: Entry, error: Error) {
    if (!entries.has(entry.cmdId)) return;
    remove(entry);
    // 一个调用方的异常不能中断其他订阅的清理。
    try {
      entry.handlers.onStatus?.('error');
    } catch {}
    try {
      entry.handlers.onError?.(error);
    } catch {}
  }

  function request<T>(
    command: WsCommand,
    options: WsRequestOptions<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (options.signal?.aborted) {
        reject(new Error('WebSocket request aborted'));
        return;
      }
      let stop: (() => void) | undefined;
      let done = false;
      const finish = (error?: Error, value?: T) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
        stop?.();
        if (error) reject(error);
        else resolve(value as T);
      };
      const abort = () => finish(new Error('WebSocket request aborted'));
      const timer = setTimeout(
        () => finish(new Error('WebSocket request timed out')),
        options.timeout ?? 15_000,
      );
      options.signal?.addEventListener('abort', abort, { once: true });
      try {
        stop = add(
          command,
          {
            onData(message) {
              const value = options.select(message);
              if (value !== undefined) finish(undefined, value);
            },
            onError: (error) => finish(error),
          },
          false,
        );
        // 注册期间同步失败时，补做取消函数赋值前的清理。
        if (done) stop();
      } catch (error) {
        finish(asError(error));
      }
    });
  }

  /** 发送成功不表示服务端已执行；不自动重放写命令。 */
  function send(command: WsCommand) {
    if (!ready) throw new Error('WebSocket is not authenticated');
    write({ cmds: [{ ...command, cmdId: ++nextId }] });
    checkIdle();
  }

  watch(
    () => !!access.accessToken,
    (loggedIn) => {
      if (!loggedIn) close();
    },
    { flush: 'sync' },
  );
  onScopeDispose(close);
  return {
    subscribe: (command: WsCommand, handlers: WsHandlers) =>
      add(command, handlers, true),
    request,
    send,
    close,
    $reset: close,
  };
});

function cancelCommand(command: WsCommand, cmdId: number) {
  switch (command.type) {
    case 'ATTRIBUTES':
    case 'TIMESERIES': {
      return { ...command, cmdId, unsubscribe: true };
    }
    case 'ENTITY_DATA':
    case 'ENTITY_COUNT':
    case 'ALARM_DATA':
    case 'ALARM_COUNT':
    case 'ALARM_STATUS': {
      return { type: `${command.type}_UNSUBSCRIBE`, cmdId };
    }
    case 'NOTIFICATIONS':
    case 'NOTIFICATIONS_COUNT': {
      return { type: 'NOTIFICATIONS_UNSUBSCRIBE', cmdId };
    }
    default: {
      return undefined;
    }
  }
}
function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
