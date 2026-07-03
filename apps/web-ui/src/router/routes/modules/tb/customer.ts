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
        meta: {
          activePath: '/customers',
          authority: [Authority.TENANT_ADMIN],
          hideInMenu: true,
          icon: 'lucide:user',
          title: $t('tb.menu.customerUser'),
        },
        name: 'CustomerUser',
        path: ':customerId/users',
        component: () => import('#/views/tb/customer-user/list.vue'),
      },
    ],
  },
];

export default routes;
