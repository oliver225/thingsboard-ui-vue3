import { JwtPair } from '/#/store';
import { defHttp } from '/@/utils/http/axios';

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface ActivateUserParams {
  activateToken: string;
  password: string;
}
export function changePassword(data: ChangePasswordParams | any) {
  return defHttp.postJson<JwtPair>({
    url: '/api/auth/changePassword',
    data,
  });
}

/**
 * 激活用户
 */
export function activateUser(data: ActivateUserParams) {
  return defHttp.postJson<JwtPair>(
    {
      url: '/api/noauth/activate',
      data,
    },
    { withToken: false },
  );
}
