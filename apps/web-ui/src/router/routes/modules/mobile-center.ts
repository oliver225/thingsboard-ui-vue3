import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'MobileCenter',
    path: '/mobile-center',
    redirect: '/mobile-center/bundles',
    meta: {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:smartphone',
      order: 55,
      title: $t('mobile-center.menu'),
    },
    children: [
      {
        name: 'MobileBundles',
        path: 'bundles',
        component: () => import('#/views/tb/mobile-bundle/list.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          activePath: '/mobile-center',
          hideInMenu: true,
          pageKey: 'mobile-center',
          icon: 'lucide:package',
          title: $t('mobile-center.sections.bundles'),
        },
      },
      {
        name: 'MobileApplications',
        path: 'applications',
        component: () => import('#/views/tb/mobile-application/list.vue'),
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          activePath: '/mobile-center',
          hideInMenu: true,
          pageKey: 'mobile-center',
          icon: 'lucide:smartphone',
          title: $t('mobile-center.sections.applications'),
        },
      },
    ],
  },
];

export default routes;
