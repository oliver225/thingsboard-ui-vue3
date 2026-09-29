<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const limitedApis = [
  'ENTITY_EXPORT',
  'ENTITY_IMPORT',
  'NOTIFICATION_REQUESTS',
  'NOTIFICATION_REQUESTS_PER_RULE',
  'REST_REQUESTS_PER_TENANT',
  'REST_REQUESTS_PER_CUSTOMER',
  'WS_UPDATES_PER_SESSION',
  'CASSANDRA_WRITE_QUERIES_CORE',
  'CASSANDRA_READ_QUERIES_CORE',
  'CASSANDRA_WRITE_QUERIES_RULE_ENGINE',
  'CASSANDRA_READ_QUERIES_RULE_ENGINE',
  'CASSANDRA_WRITE_QUERIES_MONOLITH',
  'CASSANDRA_READ_QUERIES_MONOLITH',
  'TRANSPORT_MESSAGES_PER_TENANT',
  'TRANSPORT_MESSAGES_PER_DEVICE',
  'TRANSPORT_MESSAGES_PER_GATEWAY',
  'TRANSPORT_MESSAGES_PER_GATEWAY_DEVICE',
  'EDGE_EVENTS',
  'EDGE_EVENTS_PER_EDGE',
  'EDGE_UPLINK_MESSAGES',
  'EDGE_UPLINK_MESSAGES_PER_EDGE',
] as const;

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'tags',
        optionFilterProp: 'label',
        options: limitedApis.map((value) => ({
          label: $t(`notification.features.rule.trigger.limitedApi${value}`),
          value,
        })),
        placeholder: $t('notification.features.rule.trigger.rateLimitsAnyApi'),
      },
      defaultValue: [],
      fieldName: 'apis',
      label: $t('notification.features.rule.trigger.rateLimitsApis'),
      description: $t('notification.features.rule.trigger.rateLimitsApisHint'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

async function validate() {
  return formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  return {
    apis: [
      ...new Set<string>(
        (values.apis ?? [])
          .map((value: string) => value.trim())
          .filter(Boolean),
      ),
    ],
  };
}

onMounted(async () => {
  await formApi.setValues({ apis: props.config?.apis ?? [] });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5 shadow-sm">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.rateLimitsSettings') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.rateLimitsSettingsHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
