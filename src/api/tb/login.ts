import { defHttp } from '/@/utils/http/axios';
import { JwtPair, UserInfo } from '/#/store';
import { ErrorMessageMode } from '/#/axios';

export interface LoginParams {
  username: string;
  password: string;
}

export const loginApi = (params: LoginParams, mode: ErrorMessageMode = 'message') => {
  return defHttp.postJson<JwtPair>(
    {
      url: '/api/auth/login',
      data: params,
      timeout: 20 * 1000,
    },
    { errorMessageMode: mode },
  );
};

export const userInfoApi = (mode: ErrorMessageMode = 'message') =>
  defHttp.get<UserInfo>({ url: '/api/auth/user', timeout: 10 * 1000 }, { errorMessageMode: mode });

export function refreshTokenApi(refreshToken: string, mode: ErrorMessageMode = 'none') {
  return defHttp.postJson<JwtPair>(
    {
      url: '/api/auth/token',
      data: { refreshToken: refreshToken },
      timeout: 20 * 1000,
    },
    { errorMessageMode: mode },
  );
}
export const logoutApi = () => defHttp.post({ url: '/api/auth/logout' });
