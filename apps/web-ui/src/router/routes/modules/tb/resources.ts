import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
      icon: 'lucide:folder',
      order: 40,
      title: $t('tb.menu.resources'),
    },
    name: 'Resources',
    path: '/resources',
    // 资源目录,后续图片库 / SCADA 符号 / JavaScript 库 / 资源库等作为子项追加
    children: [
      {
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          icon: 'lucide:layout-grid',
          title: $t('tb.menu.widgetsLibrary'),
        },
        name: 'WidgetsLibrary',
        path: 'widgets-library',
        // 部件库为单一菜单项,点击默认进入「部件」;部件/部件包通过页面内 Segmented 切换
        redirect: '/resources/widgets-library/widget-types',
        children: [
          {
            meta: {
              authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
              activePath: '/resources/widgets-library',
              icon: 'lucide:layout-grid',
              hideInMenu: true,
              pageKey: 'resources/widgets-library',
              title: $t('tb.menu.widgetTypes'),
            },
            name: 'WidgetType',
            path: 'widget-types',
            component: () => import('#/views/tb/widget-type/list.vue'),
          },
          {
            meta: {
              authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
              activePath: '/resources/widgets-library',
              icon: 'lucide:layout-grid',
              hideInMenu: true,
              pageKey: 'resources/widgets-library',
              title: $t('tb.menu.widgetsBundle'),
            },
            name: 'WidgetsBundle',
            path: 'widgets-bundles',
            component: () => import('#/views/tb/widgets-bundle/list.vue'),
          },
        ],
      },
      {
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          icon: 'lucide:image',
          title: $t('tb.menu.images'),
        },
        name: 'Images',
        path: 'images',
        component: () => import('#/views/tb/image/list.vue'),
      },
      {
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          icon: 'lucide:shapes',
          title: $t('tb.menu.scadaSymbols'),
        },
        name: 'ScadaSymbols',
        path: 'scada-symbols',
        component: () => import('#/views/tb/scada-symbol/list.vue'),
      },
      {
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          icon: 'lucide:braces',
          title: $t('tb.menu.javascriptLibrary'),
        },
        name: 'JavascriptLibrary',
        path: 'javascript-library',
        component: () => import('#/views/tb/javascript-library/list.vue'),
      },
      {
        meta: {
          authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
          icon: 'lucide:library',
          title: $t('tb.menu.resourceLibrary'),
        },
        name: 'ResourceLibrary',
        path: 'resources-library',
        component: () => import('#/views/tb/resource-library/list.vue'),
      },
    ],
  },
];

export default routes;
