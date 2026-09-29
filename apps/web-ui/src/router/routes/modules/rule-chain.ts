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
    redirect: { name: 'RuleChainList' },
    children: [
      {
        name: 'RuleChainList',
        path: '',
        component: () => import('#/views/tb/rule-chain/list.vue'),
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/ruleChains',
          hideInBreadcrumb: true,
          hideInMenu: true,
          icon: 'lucide:workflow',
          title: $t('tb.menu.ruleChain'),
        },
      },
      {
        name: 'RuleChainEditor',
        path: ':ruleChainId',
        component: () => import('#/views/tb/rule-chain/editor/index.vue'),
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/ruleChains',
          hideInMenu: true,
          icon: 'lucide:workflow',
          title: $t('rule-chain.editor.title'),
        },
      },
    ],
  },
];

export default routes;
