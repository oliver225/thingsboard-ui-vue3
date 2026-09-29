import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:clipboard-list',
      order: 160,
      title: $t('tb.menu.auditLogs'),
    },
    name: 'AuditLogs',
    path: '/auditLogs',
    component: () => import('#/views/tb/audit-log/list.vue'),
  },
];

export default routes;
