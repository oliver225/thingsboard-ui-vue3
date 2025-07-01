import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '@vben/constants';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:account-supervisor',
      order: 1,
      title: $t('tenant.title'),
      authority: [Authority.SYS_ADMIN],
      hideChildrenInMenu: true, // 隐藏子菜单
    },
    name: 'Tenant',
    path: '/teannts',
    children: [
      {
        meta: {
          icon: 'mdi:account-supervisor',
          title: $t('tenant.title'),
          authority: [Authority.SYS_ADMIN],
        },
        name: 'TenantList',
        path: '/tenants',
        component: () => import('#/views/tenant/list.vue'),
      },
      {
        meta: {
          icon: 'mdi:account-supervisor',
          title: $t('tenant.detail'),
          authority: [Authority.SYS_ADMIN],
        },
        name: 'TenantDetail',
        path: '/tenants/:id',
        component: () => import('#/views/tenant/detail.vue'),
      },
    ],
  },
  {
    meta: {
      icon: 'mdi:account-box-multiple',
      order: 10,
      title: $t('tenantProfile.title'),
      authority: [Authority.SYS_ADMIN],
      hideChildrenInMenu: true, // 隐藏子菜单
    },
    name: 'TenantProfile',
    path: '/tenantProfiles',
    children: [
      {
        meta: {
          icon: 'mdi:account-box-multiple',
          title: $t('tenantProfile.title'),
          authority: [Authority.SYS_ADMIN],
        },
        name: 'TenantProfileList',
        path: '/tenantProfiles',
        component: () => import('#/views/tenantProfile/list.vue'),
      },
      {
        meta: {
          icon: 'mdi:account-box-multiple',
          title: $t('tenantProfile.detail'),
          authority: [Authority.SYS_ADMIN],
        },
        name: 'TenantProfileDetail',
        path: '/TenantProfile/:id',
        component: () => import('#/views/tenantProfile/detail.vue'),
      },
    ],
  },
];

export default routes;
