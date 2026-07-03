<script lang="ts" setup>
/**
 * 资产 新建/编辑 弹窗(CRUD 模板:useVbenModal + useVbenForm)
 */
import type { Asset } from '#/api/tb/asset';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getAssetById, getAssetProfileInfos, saveAsset } from '#/api/tb/asset';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

/** 编辑时持有原始实体,保存时合并以保留 id/version/customerId 等字段 */
const editingAsset = ref<Asset | null>(null);

async function loadAssetProfileOptions() {
  const pageData = await getAssetProfileInfos({ page: 0, pageSize: 100 });
  return pageData.data.map((profile) => ({
    label: profile.name,
    value: profile.id.id,
  }));
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('tb.asset.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.asset.validation.nameRequired') }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadAssetProfileOptions,
        showSearch: true,
      },
      fieldName: 'assetProfileId',
      label: $t('tb.asset.fields.assetProfile'),
      rules: z
        .string()
        .min(1, { message: $t('tb.asset.validation.profileRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'label',
      label: $t('tb.asset.fields.label'),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.asset.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const asset: Asset = {
      ...editingAsset.value,
      additionalInfo: {
        ...editingAsset.value?.additionalInfo,
        description: values.description,
      },
      assetProfileId: {
        entityType: EntityType.ASSET_PROFILE,
        id: values.assetProfileId,
      },
      label: values.label,
      name: values.name,
    };

    modalApi.lock();
    try {
      await saveAsset(asset);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { assetId } = modalApi.getData<{ assetId?: string }>() ?? {};
    editingAsset.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: assetId
        ? $t('tb.asset.actions.edit')
        : $t('tb.asset.actions.create'),
    });
    if (assetId) {
      const asset = await getAssetById(assetId);
      editingAsset.value = asset;
      await formApi.setValues({
        assetProfileId: asset.assetProfileId?.id,
        description: asset.additionalInfo?.description,
        label: asset.label,
        name: asset.name,
      });
    }
  },
});
</script>

<template>
  <Modal class="w-[600px]">
    <Form />
  </Modal>
</template>
