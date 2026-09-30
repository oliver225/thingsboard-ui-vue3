import type { Preferences } from '@vben/preferences';

import { defineOverridesPreferences } from '@vben/preferences';
import { StorageManager } from '@vben/utils';

/** Adopt the new system appearance once without clearing auth or other settings. */
export async function migrateAppearanceDefaults(namespace: string) {
  const cache = new StorageManager({ prefix: namespace });
  const copyrightKey = 'copyright-defaults-thingsboard-2026-v2';
  const migrateCopyright = !(await cache.getItem<boolean>(copyrightKey));
  const homeKey = 'role-home-v1';
  const migrateHome = !(await cache.getItem<boolean>(homeKey));
  const notificationKey = 'notification-bell-ws-v1';
  const migrateNotification = !(await cache.getItem<boolean>(notificationKey));
  const userMenuKey = 'user-menu-actions-v1';
  const migrateUserMenu = !(await cache.getItem<boolean>(userMenuKey));
  const migrationKey = 'appearance-defaults-14px-green-v1';
  const fontMigrationKey = 'font-default-16px-v1';
  const colorMigrationKey = 'primary-default-logo-green-v2';
  const migrateAppearance = !(await cache.getItem<boolean>(migrationKey));
  const migrateFont = !(await cache.getItem<boolean>(fontMigrationKey));
  const migrateColor = !(await cache.getItem<boolean>(colorMigrationKey));
  if (
    !migrateAppearance &&
    !migrateFont &&
    !migrateColor &&
    !migrateUserMenu &&
    !migrateNotification &&
    !migrateHome &&
    !migrateCopyright
  )
    return;

  const cached = await cache.getItem<Partial<Preferences>>('preferences');
  if (cached) {
    if (migrateCopyright) {
      // Drop the old persisted defaults so initPreferences applies the app copyright.
      Reflect.deleteProperty(cached, 'copyright');
    }
    if (migrateHome && cached.app) cached.app.defaultHomePath = '/home';
    if (migrateNotification && cached.widget) {
      cached.widget.notification = true;
      cached.widget.notificationButtonPosition = 'header';
      if (
        cached.widget.order &&
        !cached.widget.order.includes('notification')
      ) {
        cached.widget.order = [...cached.widget.order, 'notification'];
      }
    }
    if (migrateUserMenu && cached.widget) {
      cached.widget.lockScreen = true;
      cached.widget.lockScreenButtonPosition = 'user-dropdown';
      cached.widget.logoutButtonPosition = 'user-dropdown';
    }
    if (cached.theme) {
      const fields = migrateAppearance
        ? ['builtinType', 'colorPrimary', 'fontSize']
        : [
            ...(migrateFont ? ['fontSize'] : []),
            ...(migrateColor ? ['builtinType', 'colorPrimary'] : []),
          ];
      for (const key of fields) {
        Reflect.deleteProperty(cached.theme, key);
      }
    }
    if (migrateAppearance && cached.tabbar) {
      Reflect.deleteProperty(cached.tabbar, 'enable');
    }
    await cache.setItem('preferences', cached);
  }
  await cache.setItem(userMenuKey, true);
  await cache.setItem(migrationKey, true);
  await cache.setItem(fontMigrationKey, true);
  await cache.setItem(colorMigrationKey, true);
  await cache.setItem(notificationKey, true);
  await cache.setItem(homeKey, true);
  await cache.setItem(copyrightKey, true);
}

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
