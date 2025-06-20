import { EntityType } from './tb/entityType';

/**
 * @zh_CN 登录页面 url 地址
 */
export const LOGIN_PATH = '/auth/login';

export interface LanguageOption {
  label: string;
  value: 'en-US' | 'zh-CN';
}

/**
 * Supported languages
 */
export const SUPPORT_LANGUAGES: LanguageOption[] = [
  {
    label: '简体中文',
    value: 'zh-CN',
  },
  {
    label: 'English',
    value: 'en-US',
  },
];

export const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';

export interface EntityId<T> {
  entityType?: T;
  id: string;
}

export const SYS_TENANT_ID: EntityId<EntityType.TENANT> = {
  entityType: EntityType.TENANT,
  id: NULL_UUID,
};
