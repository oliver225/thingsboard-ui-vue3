/**
 * 认证接口(/api/auth/** 与 /api/noauth/**)
 * 契约参考:后端 AuthController.java
 */
import type { JwtPair, TbUser } from '#/types/tb';

import { baseRequestClient, requestClient } from '#/api/request';

/** 获取当前登录用户原始实体(GET /api/auth/user) */
export function getCurrentUser() {
  return requestClient.get<TbUser>('/auth/user');
}

/** 请求密码重置邮件；后端对已注册和未注册邮箱均返回成功。 */
export function resetPasswordByEmail(email: string): Promise<void> {
  return baseRequestClient.post('/noauth/resetPasswordByEmail', { email });
}

/** 激活用户并设置密码，成功返回登录凭证。 */
export function activateUser(data: {
  activateToken: string;
  password: string;
}) {
  return baseRequestClient.post<JwtPair>('/noauth/activate', data, {
    params: { sendActivationMail: false },
  });
}

/** 使用邮件中的令牌重置密码，成功后需要重新登录。 */
export function resetPassword(data: {
  password: string;
  resetToken: string;
}): Promise<void> {
  return baseRequestClient.post('/noauth/resetPassword', data);
}

/** 修改密码请求(ChangePasswordRequest) */
export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

/** 修改密码(POST /api/auth/changePassword)→ 新的 JwtPair */
export function changePassword(data: ChangePasswordParams) {
  return requestClient.post<JwtPair>('/auth/changePassword', data);
}

/** 密码策略(UserPasswordPolicy) */
export interface UserPasswordPolicy {
  allowWhitespaces?: boolean;
  forceUserToResetPasswordIfNotValid?: boolean;
  maximumLength?: number;
  minimumDigits?: number;
  minimumLength?: number;
  minimumLowercaseLetters?: number;
  minimumSpecialCharacters?: number;
  minimumUppercaseLetters?: number;
  passwordExpirationPeriodDays?: number;
  passwordReuseFrequencyDays?: number;
}

/** 获取密码策略(GET /api/noauth/userPasswordPolicy,免登录) */
export function getUserPasswordPolicy() {
  return baseRequestClient.get<UserPasswordPolicy>(
    '/noauth/userPasswordPolicy',
  );
}
