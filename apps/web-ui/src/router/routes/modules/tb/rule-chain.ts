import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:workflow',
      order: 14,
      title: $t('tb.menu.ruleChain'),
    },
    name: 'RuleChain',
    path: '/ruleChains',
    component: () => import('#/views/tb/rule-chain/list.vue'),
  },
];

export default routes;
