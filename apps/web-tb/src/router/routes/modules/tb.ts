import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/constants';
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
        path: '/tenants/:tenantId',
        component: () => import('#/views/tenant/detail.vue'),
      },
      {
        meta: {
          icon: 'mdi:account-circle-outline',
          order: 11,
          title: $t('租户管理员'),
          authority: [Authority.SYS_ADMIN],
          hideChildrenInMenu: true, // 隐藏子菜单
        },
        name: 'TenantAdmin',
        path: '/tenants/:tenantId/users',

        children: [
          {
            meta: {
              icon: 'mdi:account-circle-outline',
              title: $t('租户管理员'),
              authority: [Authority.SYS_ADMIN],
            },
            name: 'TenantAdminList',
            path: '/tenants/:tenantId/users',
            component: () => import('#/views/tenant/admin/list.vue'),
          },
          {
            meta: {
              icon: 'mdi:account-circle-outline',
              title: $t('租户管理员详情'),
              authority: [Authority.SYS_ADMIN],
            },
            name: 'TenantAdminDetail',
            path: '/tenants/:tenantId/users/:userId',
            component: () => import('#/views/tenant/admin/detail.vue'),
          },
        ],
      },
    ],
  },
  {
    meta: {
      icon: 'mdi:account-box-multiple',
      order: 20,
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
  {
    meta: {
      icon: 'mdi:folder-open',
      order: 30,
      title: $t('资源'),
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
    },
    name: 'Resource',
    path: '/resources',
    children: [
      {
        meta: {
          icon: 'mdi:image-multiple-outline',
          title: $t('图像库'),
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        },
        name: 'ImageList',
        path: '/resources/images',
        component: () => import('#/views/image/list.vue'),
      },
      {
        meta: {
          icon: 'mdi:cube-scan',
          title: $t('组态库'),
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        },
        name: 'ScadaSymbolList',
        path: '/resources/scada-symbols',
        component: () => import('#/views/scada-symbol/list.vue'),
      },
    ],
  },
  // {
  //   meta: {
  //     icon: 'mdi:cog-outline',
  //     title: $t('设置'),
  //     order: 50,
  //     authority: [Authority.SYS_ADMIN],
  //   },
  //   name: 'Settings',
  //   path: '/settings/:type',
  //   component: () => import('#/views/setting/index.vue'),
  // },
];

export default routes;
