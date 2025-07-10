import type { Recordable, UserInfo } from '@vben/types';

import type { AuthApi } from '#/api/core';
import type { BasicQuery, Page } from '#/api/model';

import { requestClient } from '#/api/request';

export const userInfoApi = () =>
  requestClient.get<UserInfo>('/auth/user', {}, { timeout: 10 * 1000 });

export function getUserByIdApi(userId: string) {
  return requestClient.get<UserInfo>(`/user/${userId}`);
}

export function isUserTokenAccessEnabledApi() {
  return requestClient.get<boolean>('/user/tokenAccessEnabled');
}

export function getActivationLinkApi(userId: string) {
  return requestClient.get<string>(`/user/${userId}/activationLink`);
}

export function sendActivationEmailApi(email: string) {
  return requestClient.post(`/user/sendActivationMail?email=${email}`);
}

export function getUserTokenApi(userId: string) {
  return requestClient.get<AuthApi.LoginResult>(`/user/${userId}/token`);
}

export function saveUserApi(data: any | UserInfo, sendActivationMail = false) {
  return requestClient.post<UserInfo>('/user', data, {
    params: { sendActivationMail },
  });
}

export function getUserListApi(params: BasicQuery) {
  return requestClient.get<Page<UserInfo>>('/users', params);
}

export function deleteUserApi(userId: string) {
  return requestClient.delete(`/user/${userId}`);
}

export function setUserCredentialsEnabled(userId: string, enabled = true) {
  return requestClient.post(`/user/${userId}/userCredentialsEnabled`, {
    userCredentialsEnabled: enabled,
  });
}

export function getTenantAdminListApi(params: BasicQuery, tenantId: string) {
  return requestClient.get<Page<UserInfo>>(`/tenant/${tenantId}/users`, params);
}
export function getCustomerUserList(params: BasicQuery, customerId: string) {
  return requestClient.get<Page<UserInfo>>(
    `/customer/${customerId}/users`,
    params,
  );
}

export function getUsersForAssignApi(params: BasicQuery, alarmId: string) {
  return requestClient.get<Page<UserInfo>>(`/users/assign/${alarmId}`, params);
}

export function saveUserSettingsApi(data: Recordable<any>) {
  return requestClient.post<Recordable<any>>('/user/settings', data);
}

export function putUserSettingsApi(data: Recordable<any>) {
  return requestClient.put('/user/settings', data);
}

export function getUserSettingsApi() {
  return requestClient.get<Recordable<any>>('/user/settings');
}

export function deleteUserSettingsApi(paths: string) {
  return requestClient.delete(`/user/settings/${paths}`);
}

export function putUserSettingsByTypeApi(type: string, data: Recordable<any>) {
  return requestClient.put(`/user/settings/${type}`, data);
}

export function gutUserSettingsByTypeApi(type: string) {
  return requestClient.get<Recordable<any>>(`/user/settings/${type}`);
}

export function deleteUserSettingsByTypeApi(type: string, paths: string) {
  return requestClient.delete(`/user/settings/${type}/${paths}`);
}
