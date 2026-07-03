import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      icon: 'lucide:layout-dashboard',
      order: 9,
      title: $t('tb.menu.dashboard'),
    },
    name: 'Dashboards',
    path: '/dashboards',
    component: () => import('#/views/tb/dashboard/list.vue'),
  },
];

export default routes;
