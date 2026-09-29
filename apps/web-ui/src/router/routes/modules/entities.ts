import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const authority = [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER];
const routes: RouteRecordRaw[] = [
  {
    name: 'Entities',
    path: '/entities',
    redirect: '/entities/devices',
    meta: {
      authority,
      icon: 'lucide:layers',
      order: 10,
      title: $t('tb.menu.entities'),
    },
    children: [
      {
        name: 'Devices',
        path: 'devices',
        meta: { authority, icon: 'lucide:server', title: $t('tb.menu.device') },
        children: [
          {
            name: 'DeviceList',
            path: '',
            component: () => import('#/views/tb/device/list.vue'),
            meta: {
              authority,
              activePath: '/entities/devices',
              hideInMenu: true,
              hideInBreadcrumb: true,
              title: $t('tb.menu.device'),
            },
          },
          {
            name: 'DeviceDetail',
            path: ':deviceId',
            component: () => import('#/views/tb/device/detail.vue'),
            meta: {
              authority,
              activePath: '/entities/devices',
              hideInMenu: true,
              title: $t('device.features.detail.title'),
            },
          },
        ],
      },
      {
        name: 'Asset',
        path: 'assets',
        meta: { authority, icon: 'lucide:box', title: $t('tb.menu.asset') },
        children: [
          {
            name: 'AssetList',
            path: '',
            component: () => import('#/views/tb/asset/list.vue'),
            meta: {
              authority,
              activePath: '/entities/assets',
              hideInMenu: true,
              hideInBreadcrumb: true,
              title: $t('tb.menu.asset'),
            },
          },
          {
            name: 'AssetDetail',
            path: ':assetId',
            component: () => import('#/views/tb/asset/detail.vue'),
            meta: {
              authority,
              activePath: '/entities/assets',
              hideInMenu: true,
              title: $t('asset.features.detail.title'),
            },
          },
        ],
      },
      {
        name: 'EntityView',
        path: 'entityViews',
        meta: {
          authority,
          icon: 'lucide:scan-eye',
          title: $t('tb.menu.entityView'),
        },
        children: [
          {
            name: 'EntityViewList',
            path: '',
            component: () => import('#/views/tb/entity-view/list.vue'),
            meta: {
              authority,
              activePath: '/entities/entityViews',
              hideInMenu: true,
              hideInBreadcrumb: true,
              title: $t('tb.menu.entityView'),
            },
          },
          {
            name: 'EntityViewDetail',
            path: ':entityViewId',
            component: () => import('#/views/tb/entity-view/detail.vue'),
            meta: {
              authority,
              activePath: '/entities/entityViews',
              hideInMenu: true,
              title: $t('entity-view.features.detail.title'),
            },
          },
        ],
      },
    ],
  },
];
export default routes;
