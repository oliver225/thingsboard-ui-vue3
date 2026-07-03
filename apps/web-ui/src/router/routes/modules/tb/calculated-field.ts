import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:calculator',
      order: 13,
      title: $t('tb.menu.calculatedField'),
    },
    name: 'CalculatedField',
    path: '/calculatedFields',
    component: () => import('#/views/tb/calculated-field/list.vue'),
  },
];

export default routes;
