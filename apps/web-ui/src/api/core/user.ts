import type { UserInfo } from '@vben/types';

import type { TbUser } from '#/types/tb';

import { requestClient } from '#/api/request';

/** 携带 TB 原始用户实体的 UserInfo */
export type TbUserInfo = UserInfo & { tbUser: TbUser };

/**
 * 获取当前登录用户(GET /api/auth/user),并映射为 vben UserInfo
 */
export async function getUserInfoApi(): Promise<TbUserInfo> {
  const user = await requestClient.get<TbUser>('/auth/user');
  const realName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.name ||
    user.email;
  return {
    avatar: user.additionalInfo?.avatarUrl,
    desc: user.additionalInfo?.description ?? '',
    homePath: user.additionalInfo?.homePath ?? '/analytics',
    realName,
    roles: [user.authority],
    tbUser: user,
    token: '',
    userId: user.id?.id ?? '',
    username: user.email,
  };
}
