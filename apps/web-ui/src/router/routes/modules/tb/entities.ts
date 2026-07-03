import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      icon: 'lucide:layers',
      order: 10,
      title: $t('tb.menu.entities'),
    },
    name: 'Entities',
    path: '/entities',
    children: [
      {
        meta: {
          authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          icon: 'lucide:server',
          title: $t('tb.menu.device'),
        },
        name: 'Device',
        path: 'devices',
        children: [
          {
            meta: {
              activePath: '/entities/devices',
              authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
              hideInBreadcrumb: true,
              hideInMenu: true,
              icon: 'lucide:server',
              title: $t('tb.menu.device'),
            },
            name: 'DeviceList',
            path: '',
            component: () => import('#/views/tb/device/list.vue'),
          },
          {
            meta: {
              activePath: '/entities/devices',
              authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
              hideInMenu: true,
              icon: 'lucide:server',
              title: $t('tb.device.detail.title'),
            },
            name: 'DeviceDetail',
            path: ':deviceId',
            component: () => import('#/views/tb/device/detail/index.vue'),
          },
        ],
      },
      {
        meta: {
          authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          icon: 'lucide:box',
          title: $t('tb.menu.asset'),
        },
        name: 'Asset',
        path: 'assets',
        component: () => import('#/views/tb/asset/list.vue'),
      },
      {
        meta: {
          authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          icon: 'lucide:scan-eye',
          title: $t('tb.menu.entityView'),
        },
        name: 'EntityView',
        path: 'entityViews',
        component: () => import('#/views/tb/entity-view/list.vue'),
      },
    ],
  },
];

export default routes;
