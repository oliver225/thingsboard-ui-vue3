/**
 * 用户 / 账户相关接口
 * 契约参考:UserController.java
 */
import type { JwtPair, PageData, PageLink, TbUser } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 用户详情(GET /api/user/{userId}) */
export function getUserById(userId: string) {
  return requestClient.get<TbUser>(`/user/${userId}`);
}

/** 保存用户(POST /api/user,带 id 即更新);个人资料保存即更新自己 */
export function saveUser(user: TbUser, sendActivationMail = false) {
  return requestClient.post<TbUser>('/user', user, {
    params: { sendActivationMail },
  });
}

/** 删除用户(DELETE /api/user/{userId}) */
export function deleteUser(userId: string): Promise<void> {
  return requestClient.delete(`/user/${userId}`);
}

/** 获取用户激活链接(GET /api/user/{userId}/activationLink,text/plain) */
export function getUserActivationLink(userId: string) {
  return requestClient.get<string>(`/user/${userId}/activationLink`);
}

/** 用户激活链接信息(org.thingsboard.server.common.data.UserActivationLink) */
export interface UserActivationLink {
  /** 链接有效期(毫秒) */
  ttlMs: number;
  /** 激活链接 URL */
  value: string;
}

/** 获取用户激活链接信息(GET /api/user/{userId}/activationLinkInfo,含 TTL) */
export function getUserActivationLinkInfo(userId: string) {
  return requestClient.get<UserActivationLink>(
    `/user/${userId}/activationLinkInfo`,
  );
}

/** 租户管理员分页列表(GET /api/tenant/{tenantId}/users) */
export function getTenantAdmins(tenantId: string, pageLink: PageLink) {
  return requestClient.get<PageData<TbUser>>(`/tenant/${tenantId}/users`, {
    params: { ...pageLink },
  });
}

/** 客户用户分页列表(GET /api/customer/{customerId}/users) */
export function getCustomerUsers(customerId: string, pageLink: PageLink) {
  return requestClient.get<PageData<TbUser>>(`/customer/${customerId}/users`, {
    params: { ...pageLink },
  });
}

/** 用户分页列表(GET /api/users):返回当前租户/客户作用域内的用户 */
export function getUsers(pageLink: PageLink) {
  return requestClient.get<PageData<TbUser>>('/users', {
    params: { ...pageLink },
  });
}

/** 获取指定用户的登录令牌(GET /api/user/{userId}/token)→ 以该用户身份登录 */
export function getUserToken(userId: string) {
  return requestClient.get<JwtPair>(`/user/${userId}/token`);
}
