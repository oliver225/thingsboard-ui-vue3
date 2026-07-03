import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:hard-drive-download',
      order: 15,
      title: $t('tb.menu.otaUpdate'),
    },
    name: 'OtaUpdate',
    path: '/otaUpdates',
    component: () => import('#/views/tb/ota-package/list.vue'),
  },
];

export default routes;
