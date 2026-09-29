import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:network',
      order: 15,
      title: $t('edge-management.menu'),
    },
    name: 'EdgeManagement',
    path: '/edgeManagement',
    redirect: '/edgeManagement/instances',
    children: [
      {
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/edgeManagement',
          hideInMenu: true,
          icon: 'lucide:network',
          title: $t('edge-management.features.instances.title'),
        },
        name: 'Edges',
        path: 'instances',
        redirect: { name: 'EdgeInstances' },
        children: [
          {
            name: 'EdgeInstances',
            path: '',
            component: () =>
              import('#/views/tb/edge-management/instances/list.vue'),
            meta: {
              authority: [Authority.TENANT_ADMIN],
              activePath: '/edgeManagement',
              hideInMenu: true,
              hideInBreadcrumb: true,
              icon: 'lucide:network',
              pageKey: 'edgeManagement',
              title: $t('edge-management.features.instances.title'),
            },
          },
          {
            name: 'EdgeDetail',
            path: ':edgeId',
            component: () =>
              import('#/views/tb/edge-management/instances/detail.vue'),
            meta: {
              authority: [Authority.TENANT_ADMIN],
              activePath: '/edgeManagement',
              hideInMenu: true,
              icon: 'lucide:network',
              title: $t('edge-management.features.instances.detail.title'),
            },
          },
        ],
      },
      {
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/edgeManagement',
          hideInMenu: true,
          icon: 'lucide:workflow',
          pageKey: 'edgeManagement',
          title: $t('edge-management.features.ruleChains.title'),
        },
        name: 'EdgeRuleChains',
        path: 'ruleChains',
        component: () =>
          import('#/views/tb/edge-management/rule-chains/list.vue'),
      },
    ],
  },
];

export default routes;
