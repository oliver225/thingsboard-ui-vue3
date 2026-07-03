import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [
        Authority.SYS_ADMIN,
        Authority.TENANT_ADMIN,
        Authority.CUSTOMER_USER,
      ],
      icon: 'lucide:bell',
      order: 50,
      pageKey: 'notification',
      title: $t('tb.menu.notification'),
    },
    name: 'Notification',
    path: '/notification',
    redirect: '/notification/inbox',
    children: [
      {
        meta: {
          activePath: '/notification',
          authority: [
            Authority.SYS_ADMIN,
            Authority.TENANT_ADMIN,
            Authority.CUSTOMER_USER,
          ],
          hideInMenu: true,
          hideInBreadcrumb: true,
          title: $t('tb.menu.notification'),
        },
        name: 'NotificationCenterLayout',
        path: '',
        redirect: '/notification/inbox',
        component: () => import('#/views/tb/notification/index.vue'),
        children: [
          {
            meta: {
              activePath: '/notification',
              authority: [
                Authority.SYS_ADMIN,
                Authority.TENANT_ADMIN,
                Authority.CUSTOMER_USER,
              ],
              hideInMenu: true,
              icon: 'lucide:inbox',
              pageKey: 'notification',
              title: $t('tb.notification.inbox'),
            },
            name: 'NotificationInbox',
            path: 'inbox',
            component: () => import('#/views/tb/notification/inbox/list.vue'),
          },
          {
            meta: {
              activePath: '/notification',
              authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
              hideInMenu: true,
              icon: 'lucide:send',
              pageKey: 'notification',
              title: $t('tb.notification.sent'),
            },
            name: 'NotificationSent',
            path: 'sent',
            component: () => import('#/views/tb/notification/sent/list.vue'),
          },
          {
            meta: {
              activePath: '/notification',
              authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
              hideInMenu: true,
              icon: 'lucide:users',
              pageKey: 'notification',
              title: $t('tb.notification.recipients'),
            },
            name: 'NotificationRecipients',
            path: 'recipients',
            component: () =>
              import('#/views/tb/notification/recipients/list.vue'),
          },
          {
            meta: {
              activePath: '/notification',
              authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
              hideInMenu: true,
              icon: 'lucide:file-text',
              pageKey: 'notification',
              title: $t('tb.notification.templates'),
            },
            name: 'NotificationTemplates',
            path: 'templates',
            component: () =>
              import('#/views/tb/notification/templates/list.vue'),
          },
          {
            meta: {
              activePath: '/notification',
              authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
              hideInMenu: true,
              icon: 'lucide:workflow',
              pageKey: 'notification',
              title: $t('tb.notification.rules'),
            },
            name: 'NotificationRules',
            path: 'rules',
            component: () => import('#/views/tb/notification/rules/list.vue'),
          },
        ],
      },
    ],
  },
];

export default routes;
