import type { Component } from 'vue';

import { Authority } from '#/enums';

interface SettingsSection {
  authority: Authority[];
  component: () => Promise<{ default: Component }>;
  icon: string;
  layout?: 'table';
  name: string;
  path: string;
  title: string;
}

/** 路由与左侧菜单共用权限声明，避免入口可见性和页面访问权限不一致。 */
export const settingsSections = [
  {
    name: 'SettingsHome',
    path: 'home',
    title: 'settings.sections.navigation.home',
    icon: 'lucide:house',
    authority: [Authority.TENANT_ADMIN],
    component: () => import('./home/index.vue'),
  },
  {
    name: 'SettingsGeneral',
    path: 'general',
    title: 'settings.sections.navigation.general',
    icon: 'lucide:sliders-horizontal',
    authority: [Authority.SYS_ADMIN],
    component: () => import('./general/index.vue'),
  },
  {
    name: 'SettingsConnectivity',
    path: 'connectivity',
    title: 'settings.features.connectivity.title',
    icon: 'lucide:plug',
    authority: [Authority.SYS_ADMIN],
    component: () => import('./connectivity/index.vue'),
  },
  {
    name: 'SettingsOutgoingMail',
    path: 'outgoing-mail',
    title: 'settings.sections.navigation.outgoingMail',
    icon: 'lucide:mail',
    authority: [Authority.SYS_ADMIN],
    component: () => import('./outgoing-mail/index.vue'),
  },
  {
    name: 'SettingsNotifications',
    path: 'notifications',
    title: 'settings.sections.navigation.notifications',
    icon: 'lucide:bell',
    authority: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
    component: () => import('./notifications/index.vue'),
  },
  {
    name: 'SettingsQueues',
    path: 'queues',
    layout: 'table',
    title: 'settings.sections.navigation.queues',
    icon: 'lucide:layers',
    authority: [Authority.SYS_ADMIN],
    component: () => import('./queues/list.vue'),
  },
  {
    name: 'SettingsSecurity',
    path: 'security',
    title: 'settings.sections.navigation.security',
    icon: 'lucide:shield-check',
    authority: [Authority.SYS_ADMIN],
    component: () => import('./security/index.vue'),
  },
  {
    name: 'SettingsTwoFactor',
    path: '2fa',
    title: 'settings.sections.navigation.twoFactor',
    icon: 'lucide:key-round',
    authority: [Authority.SYS_ADMIN],
    component: () => import('./2fa/index.vue'),
  },
  {
    name: 'SettingsAiModels',
    path: 'ai-models',
    layout: 'table',
    title: 'settings.sections.navigation.aiModels',
    icon: 'lucide:bot',
    authority: [Authority.TENANT_ADMIN],
    component: () => import('./ai-models/list.vue'),
  },
] satisfies SettingsSection[];
