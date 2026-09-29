import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'ApiUsage',
    path: '/usage',
    component: () => import('#/views/tb/usage/index.vue'),
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:chart-no-axes-combined',
      order: 70,
      title: $t('tb.menu.apiUsage'),
    },
  },
];

export default routes;
