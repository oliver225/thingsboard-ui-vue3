import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
      icon: 'lucide:bell-ring',
      order: 8,
      title: $t('tb.menu.alarm'),
    },
    name: 'Alarms',
    path: '/alarms',
    // 单一菜单项「报警」:两子路由 hideInMenu,菜单折叠成一项,页内用 Segmented 切换
    redirect: '/alarms/alarms',
    children: [
      {
        meta: {
          activePath: '/alarms',
          authority: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
          hideInMenu: true,
          icon: 'lucide:bell-ring',
          pageKey: 'alarms',
          title: $t('tb.menu.alarmList'),
        },
        name: 'AlarmList',
        path: 'alarms',
        component: () => import('#/views/tb/alarm/list.vue'),
      },
      {
        meta: {
          activePath: '/alarms',
          authority: [Authority.TENANT_ADMIN],
          hideInMenu: true,
          icon: 'lucide:list-checks',
          pageKey: 'alarms',
          title: $t('tb.menu.alarmRule'),
        },
        name: 'AlarmRule',
        path: 'alarm-rules',
        component: () => import('#/views/tb/alarm-rule/list.vue'),
      },
    ],
  },
];

export default routes;
