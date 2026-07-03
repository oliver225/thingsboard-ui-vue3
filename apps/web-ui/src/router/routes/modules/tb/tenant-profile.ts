import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN],
      icon: 'lucide:sliders-horizontal',
      order: 21,
      title: $t('tb.menu.tenantProfile'),
    },
    name: 'TenantProfile',
    path: '/tenantProfiles',
    component: () => import('#/views/tb/tenant-profile/list.vue'),
  },
];

export default routes;
