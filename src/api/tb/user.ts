import { BasicQuery, Page } from '../model/baseModel';
import { JwtPair, UserInfo } from '/#/store';
import { defHttp } from '/@/utils/http/axios';

export const userInfoApi = () => defHttp.get<UserInfo>({ url: '/auth/user', timeout: 10 * 1000 });

export function getUserById(userId: string) {
  return defHttp.get<UserInfo>({
    url: `/api/user/${userId}`,
  });
}

export function saveUser(data: UserInfo | any, sendActivationMail = false) {
  return defHttp.postJson<UserInfo>({
    url: '/api/user',
    params: { sendActivationMail: sendActivationMail },
    data,
  });
}

export function userList(params: BasicQuery) {
  return defHttp.get<Page<UserInfo>>({
    url: '/api/users',
    params,
  });
}

export function getUsersForAssign(params: BasicQuery, alarmId: string) {
  return defHttp.get<Page<UserInfo>>({
    url: `/api/users/assign/${alarmId}`,
    params,
  });
}

export function deleteUser(userId: string) {
  return defHttp.delete<void>({
    url: `/api/user/${userId}`,
  });
}

export function getTenantAdmins(params: BasicQuery, tenantId: string) {
  return defHttp.get<Page<UserInfo>>({
    url: `/api/tenant/${tenantId}/users`,
    params,
  });
}
export function getCustomerUsers(params: BasicQuery, customerId: string) {
  return defHttp.get<Page<UserInfo>>({
    url: `/api/customer/${customerId}/users`,
    params,
  });
}

export function getActivationLink(userId: string) {
  return defHttp.get<string>({
    url: `/api/user/${userId}/activationLink`,
  });
}

export function sendActivationEmail(email: string) {
  return defHttp.postJson<void>({
    url: `/api/user/sendActivationMail?email=${email}`,
  });
}

export function getUserToken(userId: string) {
  return defHttp.get<JwtPair>({
    url: `/api/user/${userId}/token`,
  });
}
