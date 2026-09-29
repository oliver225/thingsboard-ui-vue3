<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenSelect',
      componentProps: {
        options: [
          {
            label: $t(
              'notification.features.rule.trigger.deviceActivityByDevice',
            ),
            value: 'devices',
          },
          {
            label: $t(
              'notification.features.rule.trigger.deviceActivityByProfile',
            ),
            value: 'deviceProfiles',
          },
        ],
      },
      defaultValue: 'devices',
      fieldName: 'filterByDevice',
      label: $t('notification.features.rule.trigger.deviceActivityFilterBy'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'DEVICE',
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.rule.trigger.deviceActivityDevicesPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'devices',
      label: $t('notification.features.rule.trigger.deviceActivityDevices'),
      description: $t(
        'notification.features.rule.trigger.deviceActivityDevicesHint',
      ),
      dependencies: {
        triggerFields: ['filterByDevice'],
        resolve: ({ values }) => ({ if: values.filterByDevice === 'devices' }),
      },
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'DEVICE_PROFILE',
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.rule.trigger.deviceActivityProfilesPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'deviceProfiles',
      label: $t('notification.features.rule.trigger.deviceActivityProfiles'),
      description: $t(
        'notification.features.rule.trigger.deviceActivityProfilesHint',
      ),
      dependencies: {
        triggerFields: ['filterByDevice'],
        resolve: ({ values }) => ({
          if: values.filterByDevice === 'deviceProfiles',
        }),
      },
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: [
          {
            label: $t(
              'notification.features.rule.trigger.deviceActivityActive',
            ),
            value: 'ACTIVE',
          },
          {
            label: $t(
              'notification.features.rule.trigger.deviceActivityInactive',
            ),
            value: 'INACTIVE',
          },
        ],
      },
      defaultValue: ['INACTIVE'],
      fieldName: 'notifyOn',
      label: $t('notification.features.rule.trigger.deviceActivityNotifyOn'),
      rules: z.array(z.enum(['ACTIVE', 'INACTIVE'])).min(1, {
        message: $t(
          'notification.features.rule.trigger.deviceActivityNotifyOnRequired',
        ),
      }),
    },
  ],
});

async function validate() {
  return formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  const filterField =
    values.filterByDevice === 'deviceProfiles' ? 'deviceProfiles' : 'devices';
  return {
    [filterField]: values[filterField] ?? [],
    notifyOn: values.notifyOn,
  };
}

onMounted(async () => {
  const config = props.config;
  await formApi.setValues({
    filterByDevice:
      config?.devices || !config?.deviceProfiles ? 'devices' : 'deviceProfiles',
    devices: config?.devices ?? [],
    deviceProfiles: config?.deviceProfiles ?? [],
    notifyOn: config?.notifyOn ?? ['INACTIVE'],
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <div class="rounded-xl border border-border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-semibold">
        {{ $t('notification.features.rule.trigger.deviceActivityTitle') }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ $t('notification.features.rule.trigger.deviceActivityDescription') }}
      </p>
    </div>
    <Form />
  </div>
</template>
