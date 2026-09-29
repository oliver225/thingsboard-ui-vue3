<script lang="ts" setup>
import type { Asset } from '#/api/tb/asset';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getAssetById,
  getDefaultAssetProfileInfo,
  saveAsset,
} from '#/api/tb/asset';
import { Authority, EntityType } from '#/enums';
import { $t } from '#/locales';

interface AssetFormValues {
  assetProfileId: string;
  customerId?: string;
  description?: string;
  label?: string;
  name: string;
}

const emit = defineEmits<{ success: [] }>();
const route = useRoute();
const { hasAccessByRoles } = useAccess();
const record = ref<Asset | null>(null);

const [Form, formApi] = useVbenForm<AssetFormValues>({
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
        placeholder: $t('asset.features.form.namePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'name',
      label: $t('asset.fields.name'),
      rules: z
        .string()
        .trim()
        .min(1, $t('asset.validation.nameRequired'))
        .max(255, $t('asset.validation.nameMaxLength')),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('asset.features.form.labelPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'label',
      label: $t('asset.fields.label'),
      rules: z
        .string()
        .max(255, $t('asset.validation.labelMaxLength'))
        .optional(),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'ASSET_PROFILE',
        showSearch: true,
        placeholder: $t('asset.validation.profileRequired'),
      },
      defaultValue: '',
      fieldName: 'assetProfileId',
      label: $t('asset.fields.assetProfile'),
      rules: z.string().min(1, $t('asset.validation.profileRequired')),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'CUSTOMER',
        showSearch: true,
        placeholder: $t('asset.features.form.customerPlaceholder'),
      },
      dependencies: {
        resolve: () => ({ if: !record.value?.id }),
        triggerFields: ['customerId'],
      },
      fieldName: 'customerId',
      label: $t('asset.fields.customer'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('asset.features.form.descriptionPlaceholder'),
      },
      fieldName: 'description',
      label: $t('asset.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ assetId?: string }>({
  async onConfirm() {
    if (
      modalState.value.submitting ||
      !hasAccessByRoles([Authority.TENANT_ADMIN])
    )
      return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const formValues = await formApi.getValues();
      await saveAsset({
        ...record.value,
        name: formValues.name.trim(),
        label: formValues.label?.trim(),
        assetProfileId: {
          entityType: EntityType.ASSET_PROFILE,
          id: formValues.assetProfileId,
        },
        customerId:
          !record.value?.id && formValues.customerId
            ? { entityType: EntityType.CUSTOMER, id: formValues.customerId }
            : record.value?.customerId,
        additionalInfo: {
          ...record.value?.additionalInfo,
          description: formValues.description?.trim(),
        },
      });
      message.success($t('tb.common.saveSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    if (!hasAccessByRoles([Authority.TENANT_ADMIN])) {
      await modalApi.close();
      return;
    }
    modalApi.lock();
    try {
      record.value = null;
      await formApi.reset();
      const assetId = modalApi.getData()?.assetId;
      modalApi.setState({
        title: assetId ? $t('asset.actions.edit') : $t('asset.actions.create'),
      });
      if (assetId) {
        record.value = await getAssetById(assetId);
        await formApi.setValues({
          name: record.value.name,
          label: record.value.label,
          assetProfileId: record.value.assetProfileId?.id,
          customerId: record.value.customerId?.id,
          description: record.value.additionalInfo?.description,
        });
      } else {
        const profile = await getDefaultAssetProfileInfo();
        await formApi.setFieldValue('assetProfileId', profile.id.id);
      }
    } catch {
      await modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :confirm-text="$t('tb.common.save')"
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
