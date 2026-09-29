<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const apiFeatures = [
  'TRANSPORT',
  'DB',
  'RE',
  'JS',
  'TBEL',
  'EMAIL',
  'SMS',
  'ALARM',
] as const;
const apiUsageStates = ['ENABLED', 'WARNING', 'DISABLED'] as const;

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
        mode: 'multiple',
        optionFilterProp: 'label',
        options: apiFeatures.map((value) => ({
          label: $t(
            `notification.features.rule.trigger.apiUsageFeature${value}`,
          ),
          value,
        })),
        placeholder: $t(
          'notification.features.rule.trigger.apiUsageAnyFeature',
        ),
      },
      defaultValue: [],
      fieldName: 'apiFeatures',
      label: $t('notification.features.rule.trigger.apiUsageFeatures'),
      description: $t(
        'notification.features.rule.trigger.apiUsageFeaturesHint',
      ),
      rules: z.array(z.enum(apiFeatures)),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        optionFilterProp: 'label',
        options: apiUsageStates.map((value) => ({
          label: $t(`notification.features.rule.trigger.apiUsageState${value}`),
          value,
        })),
        placeholder: $t(
          'notification.features.rule.trigger.apiUsageNotifyOnRequired',
        ),
      },
      defaultValue: ['WARNING'],
      fieldName: 'notifyOn',
      label: $t('notification.features.rule.trigger.apiUsageNotifyOn'),
      rules: z.array(z.enum(apiUsageStates)).min(1, {
        message: $t(
          'notification.features.rule.trigger.apiUsageNotifyOnRequired',
        ),
      }),
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
    apiFeatures: values.apiFeatures ?? [],
    notifyOn: values.notifyOn,
  };
}

onMounted(async () => {
  await formApi.setValues({
    apiFeatures: props.config?.apiFeatures ?? [],
    notifyOn: props.config?.notifyOn ?? ['WARNING'],
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5 shadow-sm">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.apiUsageSettings') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.apiUsageSettingsHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
