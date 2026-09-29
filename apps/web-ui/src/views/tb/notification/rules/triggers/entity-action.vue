<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { EntityType, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

// 与 ui-ngx 的 allowEntityTypeForEntityAction 保持一致，不按当前权限过滤。
const excludedEntityTypes = new Set<EntityType>([
  EntityType.API_USAGE_STATE,
  EntityType.NOTIFICATION,
  EntityType.NOTIFICATION_REQUEST,
  EntityType.QUEUE,
  EntityType.RPC,
  EntityType.TENANT_PROFILE,
  EntityType.WIDGET_TYPE,
]);
const entityTypeOptions = Object.values(EntityType)
  .filter((entityType) => !excludedEntityTypes.has(entityType))
  .map((entityType) => ({
    label: entityTypeLabel(entityType),
    value: entityType,
  }));

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
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        showSearch: true,
        optionFilterProp: 'label',
        options: entityTypeOptions,
        placeholder: $t(
          'notification.features.rule.trigger.entityTypesPlaceholder',
        ),
      },
      defaultValue: [EntityType.DEVICE],
      fieldName: 'entityTypes',
      label: $t('notification.features.rule.trigger.entityTypes'),
      rules: z.array(z.string()).min(1, {
        message: $t('notification.features.rule.trigger.entityTypesRequired'),
      }),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('notification.features.rule.trigger.entityCreated'),
        description: $t('notification.features.rule.trigger.entityCreatedHint'),
      },
      defaultValue: false,
      fieldName: 'created',
      hideLabel: true,
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('notification.features.rule.trigger.entityUpdated'),
        description: $t('notification.features.rule.trigger.entityUpdatedHint'),
      },
      defaultValue: false,
      fieldName: 'updated',
      hideLabel: true,
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('notification.features.rule.trigger.entityDeleted'),
        description: $t('notification.features.rule.trigger.entityDeletedHint'),
      },
      defaultValue: false,
      fieldName: 'deleted',
      hideLabel: true,
    },
  ],
});

async function validate() {
  return await formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  return {
    entityTypes: values.entityTypes,
    created: Boolean(values.created),
    updated: Boolean(values.updated),
    deleted: Boolean(values.deleted),
  };
}

onMounted(async () => {
  await formApi.setValues({
    entityTypes: props.config?.entityTypes ?? [EntityType.DEVICE],
    created: props.config?.created ?? false,
    updated: props.config?.updated ?? false,
    deleted: props.config?.deleted ?? false,
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.entityActionTitle') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.entityActionHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
