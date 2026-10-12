/** ThingsBoard 免登录接口（/api/noauth）。 */
import type { LoginResponse } from '#/api/tb/auth';

import { baseRequestClient } from '#/api/request';

export interface OAuth2LoginClient {
  name: string;
  icon: string;
  url: string;
}

export function getOAuth2LoginClients() {
  return baseRequestClient.post<OAuth2LoginClient[]>(
    '/noauth/oauth2Clients',
    undefined,
    { params: { platform: 'WEB' }, skipErrorHandler: true },
  );
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
  return baseRequestClient.post<LoginResponse>('/noauth/activate', data, {
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

export interface SetupInfo {
  // 保留未知状态供页面报告环境不匹配，不回退成 READY。
  status: string;
}

export function getSetupState() {
  return baseRequestClient.get<SetupInfo>('/noauth/setup/state', {
    skipErrorHandler: true,
  });
}

export function completeSetup(data: {
  email: string;
  password: string;
  loadDemo: boolean;
}): Promise<void> {
  return baseRequestClient.post('/noauth/setup/complete', data, {
    skipErrorHandler: true,
  });
}
