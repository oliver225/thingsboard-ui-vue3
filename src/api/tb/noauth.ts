import { defHttp } from '/@/utils/http/axios';
import { PasswordPolicy } from './adminSetting';

export function getUserPasswordPolicy() {
  return defHttp.get<PasswordPolicy>({
    url: '/api/noauth/userPasswordPolicy',
  });
}
