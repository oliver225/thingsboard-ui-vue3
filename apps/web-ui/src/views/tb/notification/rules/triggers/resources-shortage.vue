<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { InputNumber, Slider } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const thresholdFields = [
  'cpuThreshold',
  'ramThreshold',
  'storageThreshold',
] as const;

const thresholdRules = z
  .number({
    message: $t('notification.features.rule.trigger.resourcesThresholdRange'),
  })
  .min(0, {
    message: $t('notification.features.rule.trigger.resourcesThresholdRange'),
  })
  .max(100, {
    message: $t('notification.features.rule.trigger.resourcesThresholdRange'),
  });

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
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 80,
      fieldName: 'cpuThreshold',
      label: $t('notification.features.rule.trigger.cpuThreshold'),
      description: $t('notification.features.rule.trigger.cpuThresholdHint'),
      rules: thresholdRules,
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 80,
      fieldName: 'ramThreshold',
      label: $t('notification.features.rule.trigger.ramThreshold'),
      description: $t('notification.features.rule.trigger.ramThresholdHint'),
      rules: thresholdRules,
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 80,
      fieldName: 'storageThreshold',
      label: $t('notification.features.rule.trigger.storageThreshold'),
      description: $t(
        'notification.features.rule.trigger.storageThresholdHint',
      ),
      rules: thresholdRules,
    },
  ],
});

async function validate() {
  return await formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  // 仅转换新建的提交对象，保留表单中的百分数供返回步骤和再次提交使用。
  return {
    cpuThreshold: values.cpuThreshold / 100,
    ramThreshold: values.ramThreshold / 100,
    storageThreshold: values.storageThreshold / 100,
  };
}

onMounted(async () => {
  await formApi.setValues({
    cpuThreshold: (props.config?.cpuThreshold ?? 0.8) * 100,
    ramThreshold: (props.config?.ramThreshold ?? 0.8) * 100,
    storageThreshold: (props.config?.storageThreshold ?? 0.8) * 100,
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.resourcesShortageTitle') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.resourcesShortageHint') }}
      </p>
    </div>
    <Form>
      <template
        v-for="field in thresholdFields"
        :key="field"
        #[field]="slotProps"
      >
        <div class="flex w-full min-w-0 items-center gap-4">
          <Slider
            class="min-w-0 flex-1"
            :min="0"
            :max="100"
            :step="1"
            :value="Number(slotProps.componentProps.value ?? 0)"
            :aria-label-for-handle="
              $t(`notification.features.rule.trigger.${field}`)
            "
            @update:value="(value) => formApi.setFieldValue(field, value)"
          />
          <div class="w-28 shrink-0">
            <InputNumber
              v-bind="slotProps.componentProps"
              class="w-full"
              :aria-label="$t(`notification.features.rule.trigger.${field}`)"
              :controls="false"
              suffix="%"
            />
          </div>
        </div>
      </template>
    </Form>
  </section>
</template>
