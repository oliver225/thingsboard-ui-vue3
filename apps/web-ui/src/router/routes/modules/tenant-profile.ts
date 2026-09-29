import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:sliders-horizontal',
      order: 21,
      title: $t('tb.menu.tenantProfile'),
    },
    name: 'TenantProfile',
    path: '/tenantProfiles',
    redirect: { name: 'TenantProfileList' },
    children: [
      {
        name: 'TenantProfileList',
        path: '',
        component: () => import('#/views/tb/tenant-profile/list.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenantProfiles',
          hideInMenu: true,
          hideInBreadcrumb: true,
          icon: 'lucide:sliders-horizontal',
          title: $t('tb.menu.tenantProfile'),
        },
      },
      {
        name: 'TenantProfileDetail',
        path: ':tenantProfileId',
        component: () => import('#/views/tb/tenant-profile/detail.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenantProfiles',
          hideInMenu: true,
          title: $t('tenant-profile.detail.title'),
        },
      },
    ],
  },
];

export default routes;
