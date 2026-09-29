<script lang="ts" setup>
import type { AssetProfile } from '#/api/tb/asset-profile';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getAssetProfileById, saveAssetProfile } from '#/api/tb/asset-profile';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<AssetProfile | null>(null);

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
        placeholder: $t('asset-profile.features.form.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('asset-profile.fields.name'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('asset-profile.validation.nameRequired') })
        .max(255, { message: $t('asset-profile.validation.nameMaxLength') }),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'RULE_CHAIN',
        params: { type: 'CORE' },
        showSearch: true,
        placeholder: $t('asset-profile.features.form.ruleChainPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultRuleChainId',
      formItemClass: 'sm:col-span-2',
      label: $t('asset-profile.fields.defaultRuleChain'),
      help: $t('asset-profile.features.form.ruleChainHint'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'DASHBOARD',
        showSearch: true,
        placeholder: $t('asset-profile.features.form.dashboardPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultDashboardId',
      formItemClass: 'sm:col-span-2',
      label: $t('asset-profile.fields.defaultDashboard'),
      help: $t('asset-profile.features.form.dashboardHint'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'QUEUE',
        valueField: 'name',
        showSearch: true,
        placeholder: $t('asset-profile.features.form.queuePlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultQueueName',
      formItemClass: 'sm:col-span-2',
      label: $t('asset-profile.fields.defaultQueue'),
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'RULE_CHAIN',
        params: { type: 'EDGE' },
        showSearch: true,
        placeholder: $t('asset-profile.features.form.edgeRuleChainPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'defaultEdgeRuleChainId',
      formItemClass: 'sm:col-span-2',
      label: $t('asset-profile.fields.defaultEdgeRuleChain'),
      help: $t('asset-profile.features.form.edgeRuleChainHint'),
    },
    {
      component: 'ImageInput',
      defaultValue: null,
      fieldName: 'image',
      label: $t('asset-profile.fields.image'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('asset-profile.features.form.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('asset-profile.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ assetProfileId?: string }>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();

    const assetProfile: AssetProfile = {
      ...record.value,
      name: formValues.name.trim(),
      description: formValues.description,
      image: formValues.image || null,
      defaultRuleChainId: formValues.defaultRuleChainId
        ? {
            entityType: EntityType.RULE_CHAIN,
            id: formValues.defaultRuleChainId,
          }
        : null,
      defaultDashboardId: formValues.defaultDashboardId
        ? {
            entityType: EntityType.DASHBOARD,
            id: formValues.defaultDashboardId,
          }
        : null,
      defaultQueueName: formValues.defaultQueueName || null,
      defaultEdgeRuleChainId: formValues.defaultEdgeRuleChainId
        ? {
            entityType: EntityType.RULE_CHAIN,
            id: formValues.defaultEdgeRuleChainId,
          }
        : null,
    };

    modalApi.lock();
    try {
      await saveAssetProfile(assetProfile);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { assetProfileId } = modalApi.getData() ?? {};
    record.value = null;
    await formApi.reset();
    modalApi.setState({
      title: assetProfileId
        ? $t('asset-profile.actions.edit')
        : $t('asset-profile.actions.create'),
    });
    modalApi.lock();
    try {
      if (assetProfileId) {
        const assetProfile = await getAssetProfileById(assetProfileId);
        record.value = assetProfile;
        await formApi.setValues({
          name: assetProfile.name,
          defaultRuleChainId: assetProfile.defaultRuleChainId?.id ?? null,
          defaultDashboardId: assetProfile.defaultDashboardId?.id ?? null,
          defaultQueueName: assetProfile.defaultQueueName ?? null,
          defaultEdgeRuleChainId:
            assetProfile.defaultEdgeRuleChainId?.id ?? null,
          image: assetProfile.image ?? null,
          description: assetProfile.description ?? '',
        });
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form />
  </Modal>
</template>
