import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    refreshToken: string;
    token: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data, {
    withCredentials: false,
  });
}

export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/auth/user');
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(refreshToken: string) {
  return requestClient.post<AuthApi.LoginResult>(
    '/auth/token',
    { refreshToken },
    {
      withCredentials: false,
    },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

/**
 * 获取用户权限码
 */
// export async function getAccessCodesApi() {
//   return requestClient.get<string[]>('/auth/codes');
// }
