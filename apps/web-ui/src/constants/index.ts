import type { LanguageOption } from '@vben/constants';

import { $t } from '@vben/locales';

export const GITHUB_URL = 'https://github.com/oliver225/thingsboard-ui-vue3';

export const GITEE_URL = 'https://gitee.com/oliver225/thingsboard-ui-vue3';

export const THINGSBOARD_DOC_URL = 'https://thingsboard.io/docs/';

export const DEFAULT_SORT_FIELD = 'createdTime';

/** 系统级实体的租户 ID(NULL_UUID),用于区分系统/租户作用域 */
export const SYS_TENANT_ID = '13814000-1dd2-11b2-8080-808080808080';

export const NULL_UUID = '13814000-1dd2-11b2-8080-808080808080';

export const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

export const SUPPORT_LANGUAGES: LanguageOption[] = [
  { label: $t('tb.account.langAuto'), value: '' },
  {
    label: '简体中文',
    value: 'zh-CN',
  },
  {
    label: 'English',
    value: 'en-US',
  },
];

export const UNIT_SYSTEM_OPTIONS: { label: string; value: string }[] = [
  { label: $t('tb.account.unitAuto'), value: '' },
  { label: $t('tb.account.unitMetric'), value: 'METRIC' },
  { label: $t('tb.account.unitImperial'), value: 'IMPERIAL' },
  { label: $t('tb.account.unitHybrid'), value: 'HYBRID' },
];
