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

/**
 * 通过邮箱请求重置密码(POST /api/noauth/resetPasswordByEmail)
 * 后端出于安全考虑总是返回 200:若邮箱存在则发送重置链接邮件
 */
export function resetPasswordByEmail(email: string): Promise<void> {
  return requestClient.post('/noauth/resetPasswordByEmail', { email });
}

/** 激活用户请求(ActivateUserRequest) */
export interface ActivateUserParams {
  password: string;
  activateToken: string;
}

/**
 * 激活用户并设置密码(POST /api/noauth/activate)
 * 校验激活 token 并设置密码,成功后直接返回 JwtPair(可免再次登录)
 */
export function activateUser(
  params: ActivateUserParams,
  sendActivationMail = false,
) {
  return requestClient.post<JwtPair>('/noauth/activate', params, {
    params: { sendActivationMail },
  });
}

/** 重置密码请求(ResetPasswordRequest) */
export interface ResetPasswordParams {
  password: string;
  resetToken: string;
}

/**
 * 通过重置 token 设置新密码(POST /api/noauth/resetPassword)
 * 返回 void:成功后旧会话失效,需用新密码重新登录(不自动登录)
 */
export function resetPassword(params: ResetPasswordParams): Promise<void> {
  return requestClient.post('/noauth/resetPassword', params);
}

/** 获取密码策略(GET /api/noauth/userPasswordPolicy,免登录) */
export function getUserPasswordPolicy() {
  return baseRequestClient.get<UserPasswordPolicy>(
    '/noauth/userPasswordPolicy',
  );
}
