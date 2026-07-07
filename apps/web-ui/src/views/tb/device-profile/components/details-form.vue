<script lang="ts" setup>
/**
 * 设备配置 - 第一步「设备配置详情」。
 * 可复用子表单:通过 defineExpose 暴露 validate()/getValues(),父级(新建向导 / 详情页)统一编排。
 */
import type { VbenFormSchema } from '#/adapter/form';
import type { DeviceProfile } from '#/api/tb/device-profile';

import { watch } from 'vue';

import { useVbenForm } from '#/adapter/form';
import { getTenantDashboards } from '#/api/tb/dashboard';
import { getQueues } from '#/api/tb/queue';
import { getRuleChains } from '#/api/tb/rule-chain';
import { $t } from '#/locales';

interface DetailsValue {
  defaultDashboardId?: string;
  defaultEdgeRuleChainId?: string;
  defaultQueueName?: string;
  defaultRuleChainId?: string;
  description?: string;
  image?: string;
  name?: string;
}

const props = defineProps<{
  disabled?: boolean;
  profile?: DeviceProfile | null;
}>();

const listPageLink = {
  page: 0,
  pageSize: 100,
  sortOrder: 'ASC' as const,
};

async function loadRuleChainOptions() {
  const page = await getRuleChains(
    { ...listPageLink, sortProperty: 'name' },
    'CORE',
  );
  return page.data.map((item) => ({
    label: item.name,
    value: item.id?.id ?? '',
  }));
}

async function loadEdgeRuleChainOptions() {
  const page = await getRuleChains(
    { ...listPageLink, sortProperty: 'name' },
    'EDGE',
  );
  return page.data.map((item) => ({
    label: item.name,
    value: item.id?.id ?? '',
  }));
}

async function loadDashboardOptions() {
  const page = await getTenantDashboards({
    ...listPageLink,
    sortProperty: 'title',
  });
  return page.data.map((item) => ({ label: item.title, value: item.id.id }));
}

async function loadQueueOptions() {
  const page = await getQueues({ ...listPageLink, sortProperty: 'name' });
  return page.data.map((item) => ({ label: item.name, value: item.name }));
}

const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('tb.deviceProfile.fields.name'),
    componentProps: {
      size: 'large',
    },
    rules: 'required',
  },

  {
    component: 'ApiSelect',
    componentProps: {
      allowClear: true,
      api: loadRuleChainOptions,
      showSearch: true,
      size: 'large',
      style: { width: '100%' },
    },
    fieldName: 'defaultRuleChainId',
    label: $t('tb.deviceProfile.fields.defaultRuleChain'),
  },
  {
    component: 'ApiSelect',
    componentProps: {
      allowClear: true,
      api: loadDashboardOptions,
      showSearch: true,
      size: 'large',
      style: { width: '100%' },
    },
    fieldName: 'defaultDashboardId',
    label: $t('tb.deviceProfile.fields.defaultDashboard'),
  },
  {
    component: 'ApiSelect',
    componentProps: {
      allowClear: true,
      api: loadQueueOptions,
      showSearch: true,
      size: 'large',
      style: { width: '100%' },
    },
    fieldName: 'defaultQueueName',
    label: $t('tb.deviceProfile.fields.defaultQueue'),
  },
  {
    component: 'ApiSelect',
    componentProps: {
      allowClear: true,
      api: loadEdgeRuleChainOptions,
      showSearch: true,
      size: 'large',
      style: { width: '100%' },
    },
    fieldName: 'defaultEdgeRuleChainId',
    label: $t('tb.deviceProfile.fields.defaultEdgeRuleChain'),
  },
  {
    component: 'ImageInput',
    fieldName: 'image',
    label: $t('tb.deviceProfile.fields.image'),
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3, size: 'large' },
    fieldName: 'description',
    label: $t('tb.deviceProfile.fields.description'),
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: { colon: true, disabled: props.disabled, labelWidth: 130 },
  schema,
  showDefaultActions: false,
});

watch(
  () => props.profile,
  (profile) => {
    formApi.resetForm();
    if (!profile) {
      return;
    }
    formApi.setValues({
      defaultDashboardId: profile.defaultDashboardId?.id,
      defaultEdgeRuleChainId: profile.defaultEdgeRuleChainId?.id,
      defaultQueueName: profile.defaultQueueName,
      defaultRuleChainId: profile.defaultRuleChainId?.id,
      description: profile.description,
      image: profile.image,
      name: profile.name,
    });
  },
  { immediate: true },
);

defineExpose({
  async getValues(): Promise<DetailsValue> {
    return await formApi.getValues();
  },
  async validate(): Promise<boolean> {
    const { valid } = await formApi.validate();
    return valid;
  },
});
</script>

<template>
  <Form />
</template>
