<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { InputNumber, Slider } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { EntityType, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const allowedEntityTypes = [
  EntityType.DEVICE,
  EntityType.ASSET,
  EntityType.CUSTOMER,
  EntityType.USER,
  EntityType.DASHBOARD,
  EntityType.RULE_CHAIN,
];

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
        showSearch: true,
        optionFilterProp: 'label',
        options: allowedEntityTypes.map((value) => ({
          label: entityTypeLabel(value),
          value,
        })),
        placeholder: $t(
          'notification.features.rule.trigger.entitiesLimitAnyType',
        ),
      },
      defaultValue: [],
      fieldName: 'entityTypes',
      label: $t('notification.features.rule.trigger.entityTypes'),
      description: $t(
        'notification.features.rule.trigger.entitiesLimitTypesHint',
      ),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        step: 1,
      },
      defaultValue: 80,
      fieldName: 'threshold',
      label: $t('notification.features.rule.trigger.entitiesLimitThreshold'),
      description: $t(
        'notification.features.rule.trigger.entitiesLimitThresholdHint',
      ),
      formItemClass: 'sm:col-span-2',
      rules: z
        .number({
          message: $t(
            'notification.features.rule.trigger.entitiesLimitThresholdRange',
          ),
        })
        .min(0, {
          message: $t(
            'notification.features.rule.trigger.entitiesLimitThresholdRange',
          ),
        })
        .max(100, {
          message: $t(
            'notification.features.rule.trigger.entitiesLimitThresholdRange',
          ),
        }),
    },
  ],
});

async function validate() {
  return await formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  // 表单始终保留百分数；仅在创建提交值时转换，切换步骤不会重复缩放。
  return {
    entityTypes: values.entityTypes ?? [],
    threshold: values.threshold / 100,
  };
}

onMounted(async () => {
  await formApi.setValues({
    entityTypes: props.config?.entityTypes ?? [],
    threshold: (props.config?.threshold ?? 0.8) * 100,
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.entitiesLimitTitle') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.entitiesLimitHint') }}
      </p>
    </div>
    <Form>
      <template #threshold="slotProps">
        <div class="flex w-full min-w-0 items-center gap-4">
          <Slider
            class="min-w-0 flex-1"
            :min="0"
            :max="100"
            :step="1"
            :value="Number(slotProps.componentProps.value ?? 0)"
            :aria-label-for-handle="
              $t('notification.features.rule.trigger.entitiesLimitThreshold')
            "
            @update:value="(value) => formApi.setFieldValue('threshold', value)"
          />
          <div class="w-28 shrink-0">
            <InputNumber
              v-bind="slotProps.componentProps"
              class="w-full"
              :aria-label="
                $t('notification.features.rule.trigger.entitiesLimitThreshold')
              "
              :controls="false"
              suffix="%"
            />
          </div>
        </div>
      </template>
    </Form>
  </section>
</template>
