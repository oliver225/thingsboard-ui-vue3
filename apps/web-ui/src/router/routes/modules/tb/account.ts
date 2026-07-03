import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

/** 个人中心:不在菜单显示,经用户下拉(name: 'Profile')进入,内部分 4 个子路由 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [
        Authority.SYS_ADMIN,
        Authority.TENANT_ADMIN,
        Authority.CUSTOMER_USER,
      ],
      hideInMenu: true,
      title: $t('tb.account.title'),
    },
    name: 'Account',
    path: '/account',
    redirect: '/account/profile',
    children: [
      {
        meta: {
          activePath: '/account',
          authority: [
            Authority.SYS_ADMIN,
            Authority.TENANT_ADMIN,
            Authority.CUSTOMER_USER,
          ],
          hideInBreadcrumb: true,
          hideInMenu: true,
          title: $t('tb.account.title'),
        },
        name: 'AccountLayout',
        path: '',
        redirect: '/account/profile',
        component: () => import('#/views/_core/profile/index.vue'),
        children: [
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: [
                Authority.SYS_ADMIN,
                Authority.TENANT_ADMIN,
                Authority.CUSTOMER_USER,
              ],
              hideInMenu: true,
              icon: 'lucide:user',
              title: $t('tb.account.userInfo'),
            },
            name: 'Profile',
            path: 'profile',
            component: () => import('#/views/_core/profile/base-setting.vue'),
          },
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: [
                Authority.SYS_ADMIN,
                Authority.TENANT_ADMIN,
                Authority.CUSTOMER_USER,
              ],
              hideInMenu: true,
              icon: 'lucide:shield',
              title: $t('tb.account.security'),
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
              authority: [
                Authority.SYS_ADMIN,
                Authority.TENANT_ADMIN,
                Authority.CUSTOMER_USER,
              ],
              hideInMenu: true,
              icon: 'lucide:key-round',
              title: $t('tb.account.changePassword'),
            },
            name: 'AccountModpwd',
            path: 'modpwd',
            component: () =>
              import('#/views/_core/profile/password-setting.vue'),
          },
          {
            meta: {
              activePath: '/account',
              pageKey: 'account',
              authority: [
                Authority.SYS_ADMIN,
                Authority.TENANT_ADMIN,
                Authority.CUSTOMER_USER,
              ],
              hideInMenu: true,
              icon: 'lucide:bell',
              title: $t('tb.account.notification'),
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
