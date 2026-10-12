/**  认证接口（/api/auth）。 */
import type { JwtPair, TbUser } from '#/types/tb';

import { useAccessStore } from '@vben/stores';

import { baseRequestClient, requestClient } from '#/api/request';

/** MFA 阶段只有受限 access token，没有 refresh token。 */
export type LoginResponse = Omit<JwtPair, 'refreshToken'> & {
  refreshToken?: string;
};

export namespace AuthApi {
  /** 登录参数(TB 用户名为邮箱) */
  export interface LoginParams {
    password: string;
    username: string;
  }
}

/** 登录 */
export async function loginApi(data: AuthApi.LoginParams) {
  return baseRequestClient.post<LoginResponse>('/auth/login', data);
}

/** 刷新 accessToken(用 baseRequestClient,避免 401 拦截递归) */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<JwtPair>('/auth/token', { refreshToken });
}

/** 退出登录 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', undefined, {
    headers: { 'X-Authorization': `Bearer ${useAccessStore().accessToken}` },
  });
}

/** 获取当前登录用户原始实体(GET /api/auth/user) */
export function getCurrentUser() {
  return requestClient.get<TbUser>('/auth/user');
}

/** 修改密码请求(ChangePasswordRequest) */
export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

/** 修改密码(POST /api/auth/changePassword)→ 新的 JwtPair */
export function changePassword(data: ChangePasswordParams) {
  return requestClient.post<JwtPair>('/auth/changePassword', data);
}
