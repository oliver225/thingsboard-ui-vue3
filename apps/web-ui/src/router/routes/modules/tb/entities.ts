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
    // 实体目录,后续客户 / 用户 / 实体视图等作为子项追加
    children: [
      {
        meta: {
          authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          icon: 'lucide:server',
          title: $t('tb.menu.device'),
        },
        name: 'Device',
        path: 'devices',
        component: () => import('#/views/tb/device/list.vue'),
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
