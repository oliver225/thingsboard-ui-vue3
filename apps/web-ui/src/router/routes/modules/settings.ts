import type { RouteRecordRaw } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { Authority } from '#/enums';
import { $t } from '#/locales';
import { settingsSections } from '#/views/tb/settings/sections';

// 系统管理员与租户管理员进入各自可访问的默认设置页。
const defaultPath = () =>
  useUserStore().userRoles.includes(Authority.SYS_ADMIN)
    ? '/settings/general'
    : '/settings/home';

const routes: RouteRecordRaw[] = [
  {
    name: 'Settings',
    path: '/settings',
    redirect: defaultPath,
    meta: {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:settings',
      order: 100,
      title: $t('tb.menu.settings'),
    },
    children: [
      {
        name: 'SettingsLayout',
        path: '',
        redirect: defaultPath,
        component: () => import('#/views/tb/settings/index.vue'),
        meta: {
          hideInMenu: true,
          hideInBreadcrumb: true,
          activePath: '/settings',
          title: $t('tb.menu.settings'),
        },
        children: settingsSections.map((section) => ({
          name: section.name,
          path: section.path,
          component: section.component,
          meta: {
            authority: section.authority,
            title: $t(section.title),
            activePath: '/settings',
            hideInMenu: true,
            icon: section.icon,
          },
        })),
      },
    ],
  },
];
export default routes;
