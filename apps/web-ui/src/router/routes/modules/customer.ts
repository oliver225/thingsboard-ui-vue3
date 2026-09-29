import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:users',
      order: 12,
      title: $t('tb.menu.customer'),
    },
    name: 'Customer',
    path: '/customers',
    redirect: { name: 'CustomerList' },
    children: [
      {
        meta: {
          activePath: '/customers',
          authority: [Authority.TENANT_ADMIN],
          hideInBreadcrumb: true,
          hideInMenu: true,
          icon: 'lucide:users',
          title: $t('tb.menu.customer'),
        },
        name: 'CustomerList',
        path: '',
        component: () => import('#/views/tb/customer/list.vue'),
      },
      {
        name: 'CustomerDetail',
        path: ':customerId',
        component: () => import('#/views/tb/customer/detail.vue'),
        meta: {
          activePath: '/customers',
          authority: [Authority.TENANT_ADMIN],
          hideInMenu: true,
          title: $t('customer.detail.title'),
        },
      },
      {
        meta: {
          activePath: '/customers',
          authority: [Authority.TENANT_ADMIN],
          hideInMenu: true,
          icon: 'lucide:user',
          title: $t('tb.menu.customerUser'),
        },
        name: 'CustomerUser',
        path: ':customerId/users',
        redirect: { name: 'CustomerUserList' },
        children: [
          {
            name: 'CustomerUserList',
            path: '',
            component: () => import('#/views/tb/customer-user/list.vue'),
            meta: {
              activePath: '/customers',
              authority: [Authority.TENANT_ADMIN],
              hideInMenu: true,
              hideInBreadcrumb: true,
              icon: 'lucide:user',
              title: $t('tb.menu.customerUser'),
            },
          },
          {
            name: 'CustomerUserDetail',
            path: ':userId',
            component: () => import('#/views/tb/customer-user/detail.vue'),
            meta: {
              activePath: '/customers',
              authority: [Authority.TENANT_ADMIN],
              hideInMenu: true,
              title: $t('customer-user.detail.title'),
            },
          },
        ],
      },
    ],
  },
];

export default routes;
