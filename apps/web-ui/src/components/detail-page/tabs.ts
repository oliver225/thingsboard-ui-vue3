import type { Component } from 'vue';

import type { DetailTabKey } from './types';

import { defineAsyncComponent } from 'vue';

export const tabPresets: Record<
  DetailTabKey,
  { component?: Component; icon: string }
> = {
  details: { icon: 'lucide:layout-dashboard' },
  attributes: {
    icon: 'lucide:list-filter',
    component: defineAsyncComponent(
      () => import('#/views/tb/telemetry/attributes.vue'),
    ),
  },
  telemetry: {
    icon: 'lucide:chart-no-axes-combined',
    component: defineAsyncComponent(
      () => import('#/views/tb/telemetry/telemetry.vue'),
    ),
  },
  api: {
    icon: 'lucide:code-xml',
    component: defineAsyncComponent(() => import('#/views/tb/device/api.vue')),
  },
  calculatedFields: {
    icon: 'lucide:square-function',
    component: defineAsyncComponent(
      () => import('#/views/tb/calculated-field/list.vue'),
    ),
  },
  alarmRules: {
    icon: 'lucide:shield-alert',
    component: defineAsyncComponent(
      () => import('#/views/tb/alarm-rule/list.vue'),
    ),
  },
  alarms: {
    icon: 'lucide:bell',
    component: defineAsyncComponent(() => import('#/views/tb/alarm/list.vue')),
  },
  events: {
    icon: 'lucide:scroll-text',
    component: defineAsyncComponent(() => import('#/views/tb/event/list.vue')),
  },
  relations: {
    icon: 'lucide:workflow',
    component: defineAsyncComponent(
      () => import('#/views/tb/relation/list.vue'),
    ),
  },
  auditLogs: {
    icon: 'lucide:clipboard-list',
    component: defineAsyncComponent(
      () => import('#/views/tb/audit-log/list.vue'),
    ),
  },
  apiKeys: {
    icon: 'lucide:key',
    component: defineAsyncComponent(
      () => import('#/views/tb/api-key/list.vue'),
    ),
  },
};
