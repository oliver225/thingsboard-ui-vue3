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

  export interface ChangePasswordParams {
    currentPassword: string;
    newPassword: string;
  }
  export interface ActivateUserParams {
    activateToken: string;
    password: string;
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
 * 修改密码
 */
export async function changePassword(data: AuthApi.ChangePasswordParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/changePassword', data);
}

/**
 * 激活用户
 */
export async function activateUser(data: AuthApi.ActivateUserParams) {
  return requestClient.post<AuthApi.LoginResult>('/noauth/activate', data, {
    withCredentials: false,
  });
}
