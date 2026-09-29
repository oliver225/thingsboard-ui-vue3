import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';
const routes: RouteRecordRaw[] = [
  {
    name: 'Tenants',
    path: '/tenants',
    redirect: { name: 'TenantList' },
    meta: {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:building-2',
      order: 10,
      title: $t('tb.menu.tenant'),
    },
    children: [
      {
        name: 'TenantList',
        path: '',
        component: () => import('#/views/tb/tenant/list.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenants',
          hideInMenu: true,
          hideInBreadcrumb: true,
          icon: 'lucide:building-2',
          title: $t('tb.menu.tenant'),
        },
      },
      {
        name: 'TenantDetail',
        path: ':tenantId',
        component: () => import('#/views/tb/tenant/detail.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenants',
          hideInMenu: true,
          title: $t('tenant.detail.title'),
        },
      },
    ],
  },
  {
    name: 'TenantAdmin',
    path: '/tenants/:tenantId/admins',
    redirect: { name: 'TenantAdminList' },
    meta: {
      authority: [Authority.SYS_ADMIN],
      hideInMenu: true,
      activePath: '/tenants',
      title: $t('tb.menu.tenantAdmin'),
    },
    children: [
      {
        name: 'TenantAdminList',
        path: '',
        component: () => import('#/views/tb/tenant-admin/list.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenants',
          hideInMenu: true,
          hideInBreadcrumb: true,
          icon: 'lucide:user',
          title: $t('tb.menu.tenantAdmin'),
        },
      },
      {
        name: 'TenantAdminDetail',
        path: ':userId',
        component: () => import('#/views/tb/tenant-admin/detail.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN],
          activePath: '/tenants',
          hideInMenu: true,
          title: $t('tenant-admin.detail.title'),
        },
      },
    ],
  },
  {
    name: 'Unavailable',
    path: '/unavailable',
    component: () => import('#/views/_core/fallback/unavailable.vue'),
    meta: { hideInMenu: true, title: '功能尚未迁移' },
  },
];
export default routes;
