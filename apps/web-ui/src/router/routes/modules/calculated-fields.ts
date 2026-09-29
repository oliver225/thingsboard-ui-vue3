import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'CalculatedFields',
    path: '/calculatedFields',
    redirect: { name: 'CalculatedFieldList' },
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:function-square',
      order: 12,
      title: $t('tb.menu.calculatedField'),
    },
    children: [
      {
        name: 'CalculatedFieldList',
        path: '',
        component: () => import('#/views/tb/calculated-field/list.vue'),
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/calculatedFields',
          hideInMenu: true,
          hideInBreadcrumb: true,
          icon: 'lucide:function-square',
          title: $t('tb.menu.calculatedField'),
        },
      },
      {
        name: 'CalculatedFieldDetail',
        path: ':calculatedFieldId',
        component: () => import('#/views/tb/calculated-field/detail.vue'),
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/calculatedFields',
          hideInMenu: true,
          title: $t('calculated-fields.detail.title'),
        },
      },
    ],
  },
];

export default routes;
