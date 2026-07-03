/**
 * 后端 AdminController.java
 */
import type { EntityType } from '#/enums';
import type { EntityId, JwtPair } from '#/types/tb';

import { requestClient } from '#/api/request';

/**
 * 管理设置实体(org.thingsboard.server.common.data.AdminSettings)
 * 不同 key 对应不同的 jsonValue 结构(general / connectivity / mail ...)
 */
export interface AdminSettings<T = Record<string, any>> {
  createdTime?: number;
  id?: EntityId<EntityType>;
  jsonValue: T;
  key: string;
  tenantId?: EntityId<EntityType.TENANT>;
}

/** 常规设置(key = general) */
export interface GeneralSettings {
  baseUrl: string;
  prohibitDifferentUrl?: boolean;
}

/** 设备连接支持的协议 */
export type DeviceConnectivityProtocol =
  | 'coap'
  | 'coaps'
  | 'http'
  | 'https'
  | 'mqtt'
  | 'mqtts';

/** 单个协议的连接信息 */
export interface DeviceConnectivityInfo {
  enabled: boolean;
  host?: string;
  port?: null | number;
}

/** 设备连接设置(key = connectivity) */
export type DeviceConnectivitySettings = Record<
  DeviceConnectivityProtocol,
  DeviceConnectivityInfo
>;

/** 发件邮件服务器设置(key = mail) */
export interface MailServerSettings {
  /** 是否启用 OAuth2(暂不支持配置,固定 false) */
  enableOauth2?: boolean;
  enableProxy?: boolean;
  enableTls?: boolean;
  mailFrom: string;
  password?: string;
  /** SMTP 提供商,固定 CUSTOM */
  providerId?: string;
  proxyHost?: string;
  proxyPassword?: string;
  proxyPort?: null | number;
  proxyUser?: string;
  /** 后端返回是否提示「修改密码」(密码已配置时为 true) */
  showChangePassword?: boolean;
  smtpHost: string;
  smtpPort: null | number;
  smtpProtocol: 'smtp' | 'smtps';
  timeout: null | number;
  tlsVersion?: string;
  username?: string;
}

/** 短信供应商类型(SmsProviderType) */
export type SmsProviderType = 'AWS_SNS' | 'SMPP' | 'TWILIO';

/** 短信供应商配置(key = sms;按 type 区分字段) */
export interface SmsProviderConfiguration {
  type?: SmsProviderType;
  // AWS SNS
  accessKeyId?: string;
  region?: string;
  secretAccessKey?: string;
  // Twilio
  accountSid?: string;
  accountToken?: string;
  numberFrom?: string;
  // SMPP
  addressRange?: string;
  bindType?: string;
  codingScheme?: null | number;
  destinationNpi?: null | number;
  destinationTon?: null | number;
  host?: string;
  password?: string;
  port?: null | number;
  protocolVersion?: number;
  serviceType?: string;
  sourceAddress?: string;
  sourceNpi?: null | number;
  sourceTon?: null | number;
  systemId?: string;
  systemType?: string;
}

/** 测试短信请求(TestSmsRequest) */
export interface TestSmsRequest {
  message: string;
  numberTo: string;
  providerConfiguration: SmsProviderConfiguration;
}

/**
 * 发送测试邮件(POST /api/admin/settings/testMail)
 * 以传入的邮件设置向当前系统管理员邮箱发送测试邮件。
 */
export function sendTestMail(
  adminSettings: AdminSettings<MailServerSettings>,
): Promise<void> {
  return requestClient.post('/admin/settings/testMail', adminSettings);
}

/** 发送测试短信(POST /api/admin/settings/testSms) */
export function sendTestSms(request: TestSmsRequest): Promise<void> {
  return requestClient.post('/admin/settings/testSms', request);
}

/**
 * 根据 key 获取管理设置(GET /api/admin/settings/{key})
 * 引用不存在的 key 会报错。
 */
export function getAdminSettings<T = Record<string, any>>(key: string) {
  return requestClient.get<AdminSettings<T>>(`/admin/settings/${key}`);
}

/** 创建或更新管理设置(POST /api/admin/settings) */
export function saveAdminSettings<T = Record<string, any>>(
  adminSettings: AdminSettings<T>,
) {
  return requestClient.post<AdminSettings<T>>('/admin/settings', adminSettings);
}

/** 密码策略(UserPasswordPolicy) */
export interface UserPasswordPolicy {
  allowWhitespaces?: boolean;
  forceUserToResetPasswordIfNotValid?: boolean;
  maximumLength?: null | number;
  minimumDigits?: null | number;
  minimumLength?: null | number;
  minimumLowercaseLetters?: null | number;
  minimumSpecialCharacters?: null | number;
  minimumUppercaseLetters?: null | number;
  passwordExpirationPeriodDays?: null | number;
  passwordReuseFrequencyDays?: null | number;
}

/** 安全设置(SecuritySettings) */
export interface SecuritySettings {
  maxFailedLoginAttempts?: null | number;
  mobileSecretKeyLength?: null | number;
  passwordPolicy: UserPasswordPolicy;
  passwordResetTokenTtl?: null | number;
  userActivationTokenTtl?: null | number;
  userLockoutNotificationEmail?: string;
}

/** 获取安全设置(GET /api/admin/securitySettings) */
export function getSecuritySettings() {
  return requestClient.get<SecuritySettings>('/admin/securitySettings');
}

/** 保存安全设置(POST /api/admin/securitySettings) */
export function saveSecuritySettings(settings: SecuritySettings) {
  return requestClient.post<SecuritySettings>(
    '/admin/securitySettings',
    settings,
  );
}

/** JWT 设置(JwtSettings) */
export interface JwtSettings {
  refreshTokenExpTime: number;
  tokenExpirationTime: number;
  tokenIssuer: string;
  tokenSigningKey: string;
}

/** 获取 JWT 设置(GET /api/admin/jwtSettings) */
export function getJwtSettings() {
  return requestClient.get<JwtSettings>('/admin/jwtSettings');
}

/**
 * 保存 JWT 设置(POST /api/admin/jwtSettings)
 * 修改签名密钥会使现有令牌失效,后端为当前用户返回一对新令牌,需写回以保持登录。
 */
export function saveJwtSettings(settings: JwtSettings) {
  return requestClient.post<JwtPair>('/admin/jwtSettings', settings);
}
