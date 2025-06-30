import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '@vben/constants';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  // {
  //   meta: {
  //     icon: 'ic:baseline-view-in-ar',
  //     keepAlive: true,
  //     order: 1000,
  //     title: $t('demos.title'),
  //   },
  //   name: 'Teannts',
  //   path: '/tenants',
  //   children: [

  //   ],
  // },
  {
    meta: {
      icon: 'mdi:account-supervisor',
      order: 1,
      title: $t('租户'),
      authority: [Authority.SYS_ADMIN],
      hideChildrenInMenu: true, // 隐藏子菜单
    },
    name: 'Tenant',
    path: '/teannts',
    children: [
      {
        meta: {
          icon: 'mdi:account-supervisor',
          title: $t('租户'),
          authority: [Authority.SYS_ADMIN],
        },
        name: 'TenantList',
        path: '/tenants',
        component: () => import('#/views/tenant/list.vue'),
      },
      {
        meta: {
          icon: 'mdi:account-supervisor',
          title: $t('租户详情'),
          authority: [Authority.SYS_ADMIN],
        },
        name: 'TenantDetail',
        path: '/tenants/:id',
        component: () => import('#/views/tenant/detail.vue'),
      },
    ],
  },
];

export default routes;
