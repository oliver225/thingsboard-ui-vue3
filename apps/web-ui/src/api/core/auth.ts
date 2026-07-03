/**
 * ThingsBoard 认证接口
 * 契约参考:后端 AuthController.java + ThingsboardSecurityConfiguration
 * - 登录:    POST /api/auth/login   (security filter) → JwtPair
 * - 刷新:    POST /api/auth/token   (security filter) → JwtPair
 * - 用户信息: GET  /api/auth/user
 * - 登出:    POST /api/auth/logout
 */
import type { JwtPair } from '#/types/tb';

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录参数(TB 用户名为邮箱) */
  export interface LoginParams {
    password: string;
    username: string;
  }
}

/** 登录 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<JwtPair>('/auth/login', data);
}

/** 刷新 accessToken(用 baseRequestClient,避免 401 拦截递归) */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<JwtPair>('/auth/token', { refreshToken });
}

/** 退出登录 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}
