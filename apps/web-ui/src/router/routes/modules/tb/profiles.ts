import type { RouteRecordRaw } from 'vue-router';

import { Authority } from '#/enums';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: [Authority.TENANT_ADMIN],
      icon: 'lucide:list-tree',
      order: 11,
      title: $t('tb.menu.profiles'),
    },
    name: 'Profiles',
    path: '/profiles',
    // 配置目录,后续 OTA / 通知模板等配置类资源可作为子项追加
    children: [
      {
        meta: {
          authority: [Authority.TENANT_ADMIN],
          icon: 'lucide:cpu',
          title: $t('tb.menu.deviceProfile'),
        },
        name: 'DeviceProfile',
        path: 'deviceProfiles',
        component: () => import('#/views/tb/device-profile/list.vue'),
      },
      {
        meta: {
          authority: [Authority.TENANT_ADMIN],
          icon: 'lucide:package',
          title: $t('tb.menu.assetProfile'),
        },
        name: 'AssetProfile',
        path: 'assetProfiles',
        component: () => import('#/views/tb/asset-profile/list.vue'),
      },
    ],
  },
];

export default routes;
