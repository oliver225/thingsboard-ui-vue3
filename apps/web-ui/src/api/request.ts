/**
 * ThingsBoard 请求客户端
 * - 认证头:X-Authorization: Bearer {jwt}
 * - TB 响应为裸 JSON(无 {code,data} 包装),responseReturn 用 'body'
 * - 401 + errorCode=11(JWT_TOKEN_EXPIRED)时走 refreshToken 刷新并重放请求
 */
import type { RequestClientOptions } from '@vben/request';

import type { TbErrorResponse } from '#/types/tb';

import { alert } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import { TB_ERROR_CODE } from '#/types/tb';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function formatToken(token: null | string) {
  return token ? `Bearer ${token}` : null;
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /** 重新认证:token 失效且无法刷新时,弹窗或回登录页 */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /** 刷新 token:POST /auth/token,返回新的 JwtPair */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const jwtPair = await refreshTokenApi(accessStore.refreshToken as string);
    accessStore.setAccessToken(jwtPair.token);
    accessStore.setRefreshToken(jwtPair.refreshToken);
    return jwtPair.token;
  }

  // 请求头:X-Authorization + Accept-Language;并清理空查询参数
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const token = formatToken(accessStore.accessToken);
      if (token) {
        config.headers['X-Authorization'] = token;
      }
      config.headers['Accept-Language'] = preferences.app.locale;

      // 剔除查询参数中为空字符串 / null / undefined 的字段,避免给后端传无意义的空值
      // (保留 0、false 等有效假值,如 page=0、unreadOnly=false)
      if (config.params && typeof config.params === 'object') {
        config.params = Object.fromEntries(
          Object.entries(config.params).filter(
            ([, value]) =>
              value !== '' && value !== null && value !== undefined,
          ),
        );
      }
      return config;
    },
  });

  // 响应解包:responseReturn='body' 时直接返回响应体(TB 为裸 JSON)
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // 401 处理:仅 JWT 过期(errorCode=11)走刷新;其余 401 视情况重新认证或抛出
  client.addResponseInterceptor({
    rejected: async (error) => {
      const { config, response } = error;
      if (response?.status !== 401) {
        throw error;
      }

      const accessStore = useAccessStore();
      const errorCode = (response?.data as TbErrorResponse)?.errorCode;

      // 未持有任何 token(如登录接口本身失败),直接抛给调用方提示
      if (!accessStore.accessToken && !accessStore.refreshToken) {
        throw error;
      }

      // 非 token 过期、未启用刷新、或已重试过 → 重新认证
      if (
        errorCode !== TB_ERROR_CODE.JWT_TOKEN_EXPIRED ||
        !preferences.app.enableRefreshToken ||
        config.__isRetryRequest
      ) {
        await doReAuthenticate();
        throw error;
      }

      // 正在刷新:挂入队列,刷新完成后重放(重放会经过请求拦截器拿到新 token)
      if (client.isRefreshing) {
        return new Promise((resolve) => {
          client.refreshTokenQueue.push(() => {
            resolve(client.request(config.url, { ...config }));
          });
        });
      }

      client.isRefreshing = true;
      config.__isRetryRequest = true;
      try {
        const newToken = await doRefreshToken();
        client.refreshTokenQueue.forEach((callback) => callback(newToken));
        client.refreshTokenQueue = [];
        return client.request(error.config.url, { ...error.config });
      } catch (refreshError) {
        client.refreshTokenQueue.forEach((callback) => callback(''));
        client.refreshTokenQueue = [];
        console.error('Refresh token failed, please login again.');
        await doReAuthenticate();
        throw refreshError;
      } finally {
        client.isRefreshing = false;
      }
    },
  });

  // 5XX 服务端错误用 Modal 弹窗(更醒目),其余用顶部 message 提示
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 调用方声明自行处理错误时,不弹全局提示
      if (error?.config?.skipErrorHandler) {
        return;
      }
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.message ?? '';
      const content = errorMessage || msg;
      const status = error?.response?.status;
      if (status && status >= 500 && status < 600) {
        alert({
          content,
          icon: 'error',
          title: $t('tb.common.systemTip'),
        }).catch(() => {});
      } else {
        message.error(content);
      }
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'body',
});

/** 原始客户端:不带认证头/401 拦截(用于刷新 token 等请求),仅做响应体解包 */
export const baseRequestClient = new RequestClient({
  baseURL: apiURL,
  responseReturn: 'body',
});
baseRequestClient.addResponseInterceptor(
  defaultResponseInterceptor({
    codeField: 'code',
    dataField: 'data',
    successCode: 0,
  }),
);
