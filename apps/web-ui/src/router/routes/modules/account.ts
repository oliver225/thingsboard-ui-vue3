import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const accountRoles = [
  Authority.SYS_ADMIN,
  Authority.TENANT_ADMIN,
  Authority.CUSTOMER_USER,
];

/** 个人中心:不在菜单显示,经用户下拉(name: 'Profile')进入 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: accountRoles,
      hideInMenu: true,
      title: $t('account.menu'),
    },
    name: 'Account',
    path: '/account',
    redirect: '/account/profile',
    children: [
      {
        meta: {
          activePath: '/account',
          authority: accountRoles,
          hideInBreadcrumb: true,
          hideInMenu: true,
          title: $t('account.menu'),
        },
        name: 'AccountLayout',
        path: '',
        redirect: '/account/profile',
        component: () => import('#/views/_core/profile/index.vue'),
        children: [
          {
            name: 'AccountApiKeys',
            path: 'apiKeys',
            component: () =>
              import('#/views/_core/profile/api-key-setting.vue'),
            meta: {
              activePath: '/account',
              pageKey: 'account',
              hideInMenu: true,
              icon: 'lucide:key',
              title: $t('api-key.menu'),
              authority: accountRoles,
            },
          },
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: accountRoles,
              hideInMenu: true,
              icon: 'lucide:user',
              title: $t('account.sections.userInfo'),
            },
            name: 'Profile',
            path: 'profile',
            component: () => import('#/views/_core/profile/base-setting.vue'),
          },
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: accountRoles,
              hideInMenu: true,
              icon: 'lucide:shield',
              title: $t('account.sections.security'),
            },
            name: 'AccountSecurity',
            path: 'security',
            component: () =>
              import('#/views/_core/profile/security-setting.vue'),
          },
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: accountRoles,
              hideInMenu: true,
              icon: 'lucide:key-round',
              title: $t('account.actions.changePassword'),
            },
            name: 'AccountModpwd',
            path: 'modpwd',
            redirect: '/account/security',
          },
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: accountRoles,
              hideInMenu: true,
              icon: 'lucide:bell',
              title: $t('account.sections.notification'),
            },
            name: 'AccountNotificationSettings',
            path: 'notificationSettings',
            component: () =>
              import('#/views/_core/profile/notification-setting.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
