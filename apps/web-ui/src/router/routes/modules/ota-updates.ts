import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'OtaUpdates',
    path: '/otaUpdates',
    component: () => import('#/views/tb/ota-update/list.vue'),
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:cpu',
      order: 42,
      title: $t('ota-updates.menu'),
    },
  },
];

export default routes;
