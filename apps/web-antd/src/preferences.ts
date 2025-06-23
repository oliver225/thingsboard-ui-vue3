import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'frontend',
    name: import.meta.env.VITE_APP_TITLE,
    enableRefreshToken: true,
    defaultHomePath: '/home',
    layout: 'header-sidebar-nav',
  },
  logo: {
    enable: true,
    fit: 'contain',
    source: '/static/logo.png',
  },
  copyright: {
    enable: false,
    companyName: 'oliver',
    date: `2024-${new Date().getFullYear()}`,
    icp: '',
    icpLink: '',
    settingShow: true,
  },
  theme: {
    builtinType: 'default',
    colorDestructive: 'hsl(348 100% 61%)',
    colorPrimary: 'hsl(212 100% 45%)',
    colorSuccess: 'hsl(144 57% 58%)',
    colorWarning: 'hsl(42 84% 61%)',
    mode: 'light',
    radius: '0.5',
    semiDarkHeader: false,
    semiDarkSidebar: false,
  },
});
