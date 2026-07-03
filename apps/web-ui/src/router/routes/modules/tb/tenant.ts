import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:building-2',
      order: 20,
      title: $t('tb.menu.tenant'),
    },
    name: 'Tenant',
    path: '/tenants',
    children: [
      {
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenants',
          icon: 'lucide:building-2',
          hideInMenu: true,
          hideInBreadcrumb: true,
          title: $t('tb.menu.tenant'),
        },
        name: 'TenantList',
        path: '',
        component: () => import('#/views/tb/tenant/list.vue'),
      },
      {
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenants',
          icon: 'lucide:users',
          hideInMenu: true,
          title: $t('tb.menu.tenantAdmin'),
        },
        name: 'TenantAdmin',
        path: ':tenantId/users',
        component: () => import('#/views/tb/tenant-admin/list.vue'),
      },
    ],
  },
];

export default routes;
