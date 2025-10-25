import { defHttp } from '/@/utils/http/axios';
import { PasswordPolicy } from './adminSetting';

export function getUserPasswordPolicy() {
  return defHttp.get<PasswordPolicy>({
    url: '/api/noauth/userPasswordPolicy',
  });
}

export function resetPasswordByEmail(email: string) {
  return defHttp.postJson<void>({
    url: '/api/noauth/resetPasswordByEmail',
    data: { email: email },
  });
}
