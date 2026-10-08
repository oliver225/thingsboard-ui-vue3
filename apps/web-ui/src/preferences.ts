import { defineOverridesPreferences } from '@vben/preferences';

export const overridesPreferences = defineOverridesPreferences({
  app: {
    accessMode: 'frontend',
    defaultAvatar: '/logo.svg',
    defaultHomePath: '/home',
    enableRefreshToken: true,
    locale: 'zh_CN',
    loginExpiredMode: 'page',
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: {
    date: '2026',
    enable: true,
    icp: '鲁ICP备2026052296号-1',
    icpLink: 'https://beian.miit.gov.cn/',
  },
  logo: { source: '/logo.svg' },
  widget: {
    notification: true,
    notificationButtonPosition: 'header',
    lockScreen: true,
    lockScreenButtonPosition: 'user-dropdown',
    logoutButtonPosition: 'user-dropdown',
  },
});
