import type { JwtPair } from '../types/tb';

import { RequestClient } from '@vben/request';

interface Session {
  accessToken: null | string;
  refreshToken: null | string;
}
interface ClientOptions {
  baseURL: string;
  expireSession: () => Promise<void>;
  getLocale: () => string;
  getSession: () => Session;
  refreshEnabled: () => boolean;
  reportError: (message: string, status?: number) => void;
  setTokens: (tokens: JwtPair) => void;
}

/** ThingsBoard returns bare JSON, including page objects with their own data field. */
export function createThingsBoardClients(options: ClientOptions) {
  const requestClient = new RequestClient({ baseURL: options.baseURL });
  const baseRequestClient = new RequestClient({ baseURL: options.baseURL });
  let refreshing: undefined | { token: string; promise: Promise<string> };
  let expiring: null | Promise<void> = null;
  function expire() {
    expiring ??= options.expireSession().finally(() => {
      expiring = null;
    });
    return expiring;
  }
  function refreshSession() {
    const { refreshToken } = options.getSession();
    if (!refreshToken || !options.refreshEnabled()) {
      return expire().then(() => {
        throw new Error('No active session');
      });
    }
    if (refreshing?.token === refreshToken) return refreshing.promise;
    const promise = baseRequestClient.instance
      .post<JwtPair>('/auth/token', { refreshToken })
      .then(({ data }) => {
        if (!data.token || !data.refreshToken)
          throw new Error('Invalid token response');
        if (options.getSession().refreshToken !== refreshToken)
          throw new Error('Session changed');
        options.setTokens(data);
        return data.token;
      })
      .catch(async (error) => {
        if (options.getSession().refreshToken === refreshToken) await expire();
        throw error;
      })
      .finally(() => {
        if (refreshing?.promise === promise) refreshing = undefined;
      });
    refreshing = { token: refreshToken, promise };
    return promise;
  }
  /** WS 建连前复用 HTTP 的刷新流程，正常刷新不重置会话。 */
  async function getAccessToken() {
    const { accessToken, refreshToken } = options.getSession();
    if (!accessToken) throw new Error('No active session');
    let expiresAt = 0;
    try {
      const payload = accessToken.split('.')[1] ?? '';
      expiresAt =
        JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/')))
          .exp * 1000;
    } catch {
      /* 格式错误由服务端鉴权拒绝。 */
    }
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
      const { accessToken } = options.getSession();
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
      if (!session.accessToken && !session.refreshToken) throw error;
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
      // A late response for the old token can reuse the already refreshed token.
      if (config.headers['X-Authorization'] !== `Bearer ${session.accessToken}`)
        return requestClient.instance(config);
      const token = await refreshSession();
      if (options.getSession().accessToken !== token)
        throw new Error('Session changed');
      return requestClient.instance(config);
    },
  });
  // Raw Axios is reserved for refresh/replay. Public methods unwrap and report once.
  for (const client of [requestClient, baseRequestClient]) {
    client.request = async (url, config) => {
      try {
        const response = await client.instance({ ...config, url });
        return config.responseReturn === 'raw' ? response : response.data;
      } catch (error: any) {
        const data = error?.response?.data;
        if (!('skipErrorHandler' in config && config.skipErrorHandler)) {
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
