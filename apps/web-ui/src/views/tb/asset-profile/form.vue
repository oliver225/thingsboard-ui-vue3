<script lang="ts" setup>
/**
 * 资产配置 新建/编辑 弹窗
 * 仅提供基础字段(名称/描述);规则链 / 默认仪表板等高级配置暂未实现,编辑时原样保留。
 */
import type { AssetProfile } from '#/api/tb/asset-profile';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getAssetProfileById, saveAssetProfile } from '#/api/tb/asset-profile';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<AssetProfile | null>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('tb.assetProfile.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.assetProfile.validation.nameRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.assetProfile.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const assetProfile: AssetProfile = {
      ...record.value,
      description: values.description,
      name: values.name,
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
    const { assetProfileId } =
      modalApi.getData<{ assetProfileId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: assetProfileId
        ? $t('tb.assetProfile.actions.edit')
        : $t('tb.assetProfile.actions.create'),
    });
    if (assetProfileId) {
      const assetProfile = await getAssetProfileById(assetProfileId);
      record.value = assetProfile;
      await formApi.setValues({
        description: assetProfile.description,
        name: assetProfile.name,
      });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
