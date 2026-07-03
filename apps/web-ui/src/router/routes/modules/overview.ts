import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.overview.title'),
    },
    name: 'Overview',
    path: '/overview',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('#/views/overview/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.overview.analytics'),
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        component: () => import('#/views/overview/workspace/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.overview.workspace'),
        },
      },
    ],
  },
];

export default routes;
