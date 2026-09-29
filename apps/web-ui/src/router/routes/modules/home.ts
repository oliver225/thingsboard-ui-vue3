import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'Home',
    path: '/home',
    component: () => import('#/views/_core/dashboard/index.vue'),
    meta: {
      authority: [
        Authority.SYS_ADMIN,
        Authority.TENANT_ADMIN,
        Authority.CUSTOMER_USER,
      ],
      icon: 'lucide:house',
      order: -1,
      title: $t('home.title'),
    },
  },
];

export default routes;
