<script lang="ts" setup>
import type { DeviceProfile } from '#/api/tb/device-profile';

import { watch } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  disabled?: boolean;
  profile?: DeviceProfile | null;
}>();

const [Form, formApi] = useVbenForm<{
  defaultDashboardId?: null | string;
  defaultEdgeRuleChainId?: null | string;
  defaultQueueName?: null | string;
  defaultRuleChainId?: null | string;
  description?: string;
  image?: null | string;
  name: string;
}>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    disabled: props.disabled,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: $t('device-profile.features.form.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('device-profile.fields.name'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('device-profile.validation.nameRequired') })
        .max(255, { message: $t('device-profile.validation.nameMaxLength') }),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'RULE_CHAIN',
        params: { type: 'CORE' },
        showSearch: true,
        placeholder: $t('device-profile.features.form.ruleChainPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultRuleChainId',
      formItemClass: 'sm:col-span-2',
      label: $t('device-profile.fields.defaultRuleChain'),
      help: $t('device-profile.features.form.ruleChainHint'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'DASHBOARD',
        showSearch: true,
        placeholder: $t('device-profile.features.form.dashboardPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultDashboardId',
      formItemClass: 'sm:col-span-2',
      label: $t('device-profile.fields.defaultDashboard'),
      help: $t('device-profile.features.form.dashboardHint'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'QUEUE',
        valueField: 'name',
        showSearch: true,
        placeholder: $t('device-profile.features.form.queuePlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultQueueName',
      formItemClass: 'sm:col-span-2',
      label: $t('device-profile.fields.defaultQueue'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'RULE_CHAIN',
        params: { type: 'EDGE' },
        showSearch: true,
        placeholder: $t(
          'device-profile.features.form.edgeRuleChainPlaceholder',
        ),
      },
      defaultValue: null,
      fieldName: 'defaultEdgeRuleChainId',
      formItemClass: 'sm:col-span-2',
      label: $t('device-profile.fields.defaultEdgeRuleChain'),
      help: $t('device-profile.features.form.edgeRuleChainHint'),
    },
    {
      component: 'ImageInput',
      defaultValue: null,
      fieldName: 'image',
      label: $t('device-profile.fields.image'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('device-profile.features.form.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('device-profile.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

watch(
  () => props.disabled,
  (disabled) => formApi.setState({ commonConfig: { disabled } }),
);

watch(
  () => props.profile,
  async (profile) => {
    await formApi.reset();
    if (!profile) return;
    await formApi.setValues({
      name: profile.name,
      defaultRuleChainId: profile.defaultRuleChainId?.id ?? null,
      defaultDashboardId: profile.defaultDashboardId?.id ?? null,
      defaultQueueName: profile.defaultQueueName ?? null,
      defaultEdgeRuleChainId: profile.defaultEdgeRuleChainId?.id ?? null,
      image: profile.image ?? null,
      description: profile.description ?? '',
    });
  },
  { immediate: true },
);

defineExpose({
  getValues: () => formApi.getValues(),
  async validate() {
    const { valid } = await formApi.validate();
    return valid;
  },
});
</script>

<template>
  <Form class="form-message-flow" />
</template>
