import type { JwtPair } from '../types/tb';

import { RequestClient } from '@vben/request';

import { getTokenClaims } from '../utils/auth';

declare module '@vben/request' {
  interface AxiosRequestConfig {
    /** 由页面展示错误，跳过全局提示。 */
    skipErrorHandler?: boolean;
  }
}

interface Session {
  accessToken: null | string;
  refreshToken: null | string;
  sessionVersion: number;
}
interface ClientOptions {
  baseURL: string;
  expireSession: () => Promise<void>;
  getLocale: () => string;
  getSession: () => Session;
  refreshEnabled: () => boolean;
  reportError: (message: string, status?: number) => void;
  setupRequired?: () => Promise<void>;
  setTokens: (tokens: JwtPair) => void;
}

/** ThingsBoard returns bare JSON, including page objects with their own data field. */
export function createThingsBoardClients(options: ClientOptions) {
  const requestClient = new RequestClient({ baseURL: options.baseURL });
  const baseRequestClient = new RequestClient({ baseURL: options.baseURL });
  let refreshing:
    | undefined
    | { token: string; promise: Promise<string>; version: number };
  let setupPending: null | Promise<void> = null;
  let expiring: null | Promise<void> = null;
  function expire() {
    expiring ??= options.expireSession().finally(() => {
      expiring = null;
    });
    return expiring;
  }
  function refreshSession() {
    const { refreshToken, sessionVersion } = options.getSession();
    if (!refreshToken || !options.refreshEnabled()) {
      return expire().then(() => {
        throw new Error('No active session');
      });
    }
    if (
      refreshing?.token === refreshToken &&
      refreshing.version === sessionVersion
    )
      return refreshing.promise;
    const promise = baseRequestClient.instance
      .post<JwtPair>('/auth/token', { refreshToken })
      .then(({ data }) => {
        if (!data.token || !data.refreshToken)
          throw new Error('Invalid token response');
        if (
          options.getSession().refreshToken !== refreshToken ||
          options.getSession().sessionVersion !== sessionVersion
        )
          throw new Error('Session changed');
        options.setTokens(data);
        return data.token;
      })
      .catch(async (error) => {
        if (
          options.getSession().refreshToken === refreshToken &&
          options.getSession().sessionVersion === sessionVersion
        )
          await expire();
        throw error;
      })
      .finally(() => {
        if (refreshing?.promise === promise) refreshing = undefined;
      });
    refreshing = { token: refreshToken, promise, version: sessionVersion };
    return promise;
  }
  /** WS 建连前复用 HTTP 的刷新流程，正常刷新不重置会话。 */
  async function getAccessToken() {
    const { accessToken, refreshToken } = options.getSession();
    if (!accessToken) throw new Error('No active session');
    const expiresAt = getTokenClaims(accessToken).exp * 1000;
    if (
      refreshing?.token === refreshToken ||
      (expiresAt &&
        expiresAt <= Date.now() + (options.refreshEnabled() ? 30_000 : 0))
    ) {
      return refreshSession();
    }
    return accessToken;
  }
  requestClient.addRequestInterceptor({
    fulfilled(config) {
      const { accessToken, sessionVersion } = options.getSession();
      Object.assign(config, { __tbSessionVersion: sessionVersion });
      if (accessToken)
        config.headers['X-Authorization'] = `Bearer ${accessToken}`;
      else delete config.headers['X-Authorization'];
      config.headers['Accept-Language'] = options
        .getLocale()
        .replaceAll('_', '-');
      if (
        config.params &&
        Object.getPrototypeOf(config.params) === Object.prototype
      ) {
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
  requestClient.addResponseInterceptor({
    rejected: async (error) => {
      const { config, response } = error;
      if (response?.status !== 401 || !config) throw error;
      const session = { ...options.getSession() };
      // 上一账号的迟到响应不得退出新账号，也不能携带新账号凭据重放旧请求。
      if (config.__tbSessionVersion !== session.sessionVersion) throw error;
      if (!session.accessToken && !session.refreshToken) throw error;
      // 改密或刷新后，旧凭据的拒绝响应不能注销当前有效凭据。
      if (
        config.headers['X-Authorization'] !== `Bearer ${session.accessToken}`
      ) {
        if (response.data?.errorCode !== 11 || config.__isRetryRequest)
          throw error;
        config.__isRetryRequest = true;
        return requestClient.instance(config);
      }
      if (
        response.data?.errorCode !== 11 ||
        !options.refreshEnabled() ||
        !session.refreshToken ||
        config.__isRetryRequest
      ) {
        await expire();
        throw error;
      }
      config.__isRetryRequest = true;
      const token = await refreshSession();
      if (
        options.getSession().accessToken !== token ||
        options.getSession().sessionVersion !== session.sessionVersion
      )
        throw new Error('Session changed');
      return requestClient.instance(config);
    },
  });
  // Raw Axios is reserved for refresh/replay. Public methods unwrap and report once.
  for (const client of [requestClient, baseRequestClient]) {
    client.addResponseInterceptor({
      rejected: async (error) => {
        if (
          error.response?.status === 423 &&
          error.response.data?.errorCode === 47 &&
          error.config?.url !== '/noauth/setup/state' &&
          options.setupRequired
        ) {
          const version = error.config?.__tbSessionVersion;
          if (
            version === undefined ||
            version === options.getSession().sessionVersion
          ) {
            setupPending ??= options.setupRequired().finally(() => {
              setupPending = null;
            });
            await setupPending;
          }
        }
        throw error;
      },
    });
    client.request = async (url, config) => {
      try {
        const response = await client.instance({ ...config, url });
        return config.responseReturn === 'raw' ? response : response.data;
      } catch (error: any) {
        const data = error?.response?.data;
        if (!config.skipErrorHandler) {
          options.reportError(
            data?.message || error?.message || '请求失败，请稍后重试',
            error?.response?.status,
          );
        }
        throw error;
      }
    };
  }
  return { baseRequestClient, requestClient, getAccessToken };
}
