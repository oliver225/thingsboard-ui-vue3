import type { DropMenu } from '../components/Dropdown';
import type { LocaleSetting, LocaleType } from '/#/config';

export const LOCALE: { [key: string]: LocaleType } = {
  ZH_CN: 'zh_CN',
  ZH_TW: 'zh_TW',
  EN_US: 'en_US',
};

export const localeSetting: LocaleSetting = {
  showPicker: true,
  // Locale
  locale: LOCALE.zh_CN,
  // Default locale
  fallback: LOCALE.zh_CN,
  // available Locales
  availableLocales: [LOCALE.ZH_CN, LOCALE.ZH_TW, LOCALE.EN_US],
};

// locale list
export const localeList: DropMenu[] = [
  {
    text: '简体中文',
    event: LOCALE.ZH_CN,
  },
  {
    text: '繁體中文',
    event: LOCALE.ZH_TW,
  },
  {
    text: 'English',
    event: LOCALE.EN_US,
  },
];
