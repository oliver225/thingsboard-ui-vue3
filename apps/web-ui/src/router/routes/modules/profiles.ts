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
    // 配置为单一菜单入口，默认进入设备配置，两个列表通过页面内导航切换。
    redirect: '/profiles/deviceProfiles',
    children: [
      {
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/profiles',
          icon: 'lucide:cpu',
          hideInMenu: true,
          title: $t('tb.menu.deviceProfile'),
        },
        name: 'DeviceProfile',
        path: 'deviceProfiles',
        redirect: { name: 'DeviceProfileList' },
        children: [
          {
            name: 'DeviceProfileList',
            path: '',
            component: () => import('#/views/tb/device-profile/list.vue'),
            meta: {
              authority: [Authority.TENANT_ADMIN],
              activePath: '/profiles',
              hideInMenu: true,
              hideInBreadcrumb: true,
              pageKey: 'profiles',
              title: $t('tb.menu.deviceProfile'),
            },
          },
          {
            name: 'DeviceProfileDetail',
            path: ':deviceProfileId',
            component: () => import('#/views/tb/device-profile/detail.vue'),
            meta: {
              authority: [Authority.TENANT_ADMIN],
              activePath: '/profiles',
              hideInMenu: true,
              title: $t('device-profile.features.detail.title'),
            },
          },
        ],
      },
      {
        meta: {
          authority: [Authority.TENANT_ADMIN],
          activePath: '/profiles',
          icon: 'lucide:package',
          hideInMenu: true,
          title: $t('tb.menu.assetProfile'),
        },
        name: 'AssetProfile',
        path: 'assetProfiles',
        redirect: { name: 'AssetProfileList' },
        children: [
          {
            name: 'AssetProfileList',
            path: '',
            component: () => import('#/views/tb/asset-profile/list.vue'),
            meta: {
              authority: [Authority.TENANT_ADMIN],
              activePath: '/profiles',
              hideInMenu: true,
              hideInBreadcrumb: true,
              pageKey: 'profiles',
              title: $t('tb.menu.assetProfile'),
            },
          },
          {
            name: 'AssetProfileDetail',
            path: ':assetProfileId',
            component: () => import('#/views/tb/asset-profile/detail.vue'),
            meta: {
              authority: [Authority.TENANT_ADMIN],
              activePath: '/profiles',
              hideInMenu: true,
              title: $t('asset-profile.features.detail.title'),
            },
          },
        ],
      },
    ],
  },
];

export default routes;
