import { JwtPair } from "/#/store";
import { defHttp } from "/@/utils/http/axios";

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}


export function changePassword(data: ChangePasswordParams | any) {
  return defHttp.postJson<JwtPair>({
    url: '/api/auth/changePassword',
    data,
  });
}