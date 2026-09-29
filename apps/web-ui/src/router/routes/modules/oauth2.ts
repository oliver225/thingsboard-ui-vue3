import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'OAuth2',
    path: '/oauth2',
    redirect: '/oauth2/clients',
    meta: {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:shield-check',
      order: 95,
      title: 'OAuth 2.0',
    },
    children: [
      {
        name: 'OAuth2ClientList',
        path: 'clients',
        component: () => import('#/views/tb/oauth2/clients.vue'),
        meta: {
          activePath: '/oauth2',
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          hideInMenu: true,
          icon: 'lucide:key-round',
          pageKey: 'oauth2',
          title: $t('oauth2.sections.clients'),
        },
      },
      {
        name: 'OAuth2DomainList',
        path: 'domains',
        component: () => import('#/views/tb/oauth2/domains.vue'),
        meta: {
          activePath: '/oauth2',
          authority: [Authority.SYS_ADMIN],
          hideInMenu: true,
          icon: 'lucide:globe',
          pageKey: 'oauth2',
          title: $t('oauth2.sections.domains'),
        },
      },
    ],
  },
];
export default routes;
