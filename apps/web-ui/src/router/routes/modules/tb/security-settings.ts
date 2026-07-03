import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:shield-check',
      order: 101,
      pageKey: 'securitySettings',
      title: $t('tb.menu.securitySettings'),
    },
    name: 'SecuritySettings',
    path: '/security-settings',
    redirect: '/security-settings/general',
    children: [
      {
        meta: {
          activePath: '/security-settings',
          authority: [Authority.SYS_ADMIN],
          hideInBreadcrumb: true,
          hideInMenu: true,
          title: $t('tb.menu.securitySettings'),
        },
        name: 'SecuritySettingsLayout',
        path: '',
        redirect: '/security-settings/general',
        component: () => import('#/views/tb/security-settings/index.vue'),
        children: [
          {
            meta: {
              activePath: '/security-settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:shield',
              pageKey: 'securitySettings',
              title: $t('tb.securitySettings.general.title'),
            },
            name: 'SecuritySettingsGeneral',
            path: 'general',
            component: () =>
              import('#/views/tb/security-settings/general/index.vue'),
          },
          {
            meta: {
              activePath: '/security-settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:file-key',
              pageKey: 'securitySettings',
              title: $t('tb.securitySettings.jwt.title'),
            },
            name: 'SecuritySettingsJwt',
            path: 'jwt',
            component: () =>
              import('#/views/tb/security-settings/jwt/index.vue'),
          },
          {
            meta: {
              activePath: '/security-settings',
              authority: [Authority.SYS_ADMIN],
              hideInMenu: true,
              icon: 'lucide:key-round',
              pageKey: 'securitySettings',
              title: $t('tb.securitySettings.twoFa.title'),
            },
            name: 'SecuritySettings2fa',
            path: '2fa',
            component: () =>
              import('#/views/tb/security-settings/2fa/index.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
