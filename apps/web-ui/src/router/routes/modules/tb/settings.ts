import type { RouteRecordRaw } from 'vue-router';

import { useAccess } from '@vben/access';

import { Authority } from '#/enums';
import { $t } from '#/locales';

/** 角色相关的默认落地页:系统管理员 → 通用设置,租户管理员 → 首页设置 */
function settingsDefaultPath(): string {
  const { hasAccessByRoles } = useAccess();
  return hasAccessByRoles([Authority.SYS_ADMIN])
    ? '/settings/general'
    : '/settings/home';
}

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:settings',
      order: 100,
      pageKey: 'settings',
      title: $t('tb.menu.settings'),
    },
    name: 'Settings',
    path: '/settings',
    redirect: () => settingsDefaultPath(),
    children: [
      {
        meta: {
          activePath: '/settings',
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          hideInBreadcrumb: true,
          hideInMenu: true,
          title: $t('tb.menu.settings'),
        },
        name: 'SettingsLayout',
        path: '',
        redirect: () => settingsDefaultPath(),
        component: () => import('#/views/tb/settings/index.vue'),
        children: [
          {
            meta: {
              activePath: '/settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:sliders-horizontal',
              pageKey: 'settings',
              title: $t('tb.settings.general'),
            },
            name: 'SettingsGeneral',
            path: 'general',
            component: () => import('#/views/tb/settings/general/index.vue'),
          },
          {
            meta: {
              activePath: '/settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:mail',
              pageKey: 'settings',
              title: $t('tb.settings.outgoingMail'),
            },
            name: 'SettingsOutgoingMail',
            path: 'outgoing-mail',
            component: () =>
              import('#/views/tb/settings/outgoing-mail/index.vue'),
          },
          {
            meta: {
              activePath: '/settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:bell',
              pageKey: 'settings',
              title: $t('tb.settings.notifications'),
            },
            name: 'SettingsNotifications',
            path: 'notifications',
            component: () =>
              import('#/views/tb/settings/notifications/index.vue'),
          },
          {
            meta: {
              activePath: '/settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:layers',
              pageKey: 'settings',
              title: $t('tb.settings.queues'),
            },
            name: 'SettingsQueues',
            path: 'queues',
            component: () => import('#/views/tb/settings/queues/list.vue'),
          },
          {
            meta: {
              activePath: '/settings',
              authority: [Authority.TENANT_ADMIN],
              hideInMenu: true,
              icon: 'lucide:house',
              pageKey: 'settings',
              title: $t('tb.settings.home'),
            },
            name: 'SettingsHome',
            path: 'home',
            component: () => import('#/views/tb/settings/home/index.vue'),
          },
          {
            meta: {
              activePath: '/settings',
              authority: [Authority.TENANT_ADMIN],
              hideInMenu: true,
              icon: 'lucide:bot',
              pageKey: 'settings',
              title: $t('tb.settings.aiModels'),
            },
            name: 'SettingsAiModels',
            path: 'ai-models',
            component: () => import('#/views/tb/settings/ai-models/index.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
