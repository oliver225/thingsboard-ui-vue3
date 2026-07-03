<script lang="ts" setup>
/**
 * 实体视图 新建/编辑 弹窗(CRUD 模板:useVbenModal + useVbenForm)
 * entityType 在「设备 / 资产」间切换,对应 deviceId / assetId 条件显示;
 * keys(暴露的遥测/属性键)与时间窗为高级配置,暂沿用原值,不在本表单编辑。
 */
import type { EntityView } from '#/api/tb/entity-view';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getTenantAssetInfos } from '#/api/tb/asset';
import { getTenantDeviceInfos } from '#/api/tb/device';
import { getEntityViewById, saveEntityView } from '#/api/tb/entity-view';
import { EntityType, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

/** 编辑时持有原始实体,保存时合并以保留 id/version/keys/时间窗等字段 */
const record = ref<EntityView | null>(null);

const entityTypeOptions = [EntityType.DEVICE, EntityType.ASSET].map(
  (value) => ({ label: entityTypeLabel(value), value }),
);

async function loadDeviceOptions() {
  const pageData = await getTenantDeviceInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'name',
  });
  return pageData.data.map((item) => ({
    label: item.name,
    value: item.id?.id,
  }));
}

async function loadAssetOptions() {
  const pageData = await getTenantAssetInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'name',
  });
  return pageData.data.map((item) => ({
    label: item.name,
    value: item.id?.id,
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
      label: $t('tb.entityView.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.entityView.validation.nameRequired') }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: entityTypeOptions,
        style: { width: '100%' },
      },
      defaultValue: EntityType.DEVICE,
      fieldName: 'entityType',
      label: $t('tb.entityView.fields.entityType'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadDeviceOptions,
        showSearch: true,
        style: { width: '100%' },
      },
      dependencies: {
        if: (values) => values.entityType === EntityType.DEVICE,
        triggerFields: ['entityType'],
      },
      fieldName: 'deviceId',
      label: $t('tb.entityView.fields.entity'),
      rules: z
        .string()
        .min(1, { message: $t('tb.entityView.validation.entityRequired') }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadAssetOptions,
        showSearch: true,
        style: { width: '100%' },
      },
      dependencies: {
        if: (values) => values.entityType === EntityType.ASSET,
        triggerFields: ['entityType'],
      },
      fieldName: 'assetId',
      label: $t('tb.entityView.fields.entity'),
      rules: z
        .string()
        .min(1, { message: $t('tb.entityView.validation.entityRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'type',
      label: $t('tb.entityView.fields.type'),
      rules: z
        .string()
        .min(1, { message: $t('tb.entityView.validation.typeRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.entityView.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const entityView: EntityView = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: values.description,
      },
      entityId: {
        entityType: values.entityType,
        id:
          values.entityType === EntityType.ASSET
            ? values.assetId
            : values.deviceId,
      },
      name: values.name,
      type: values.type,
    };

    modalApi.lock();
    try {
      await saveEntityView(entityView);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { entityViewId } =
      modalApi.getData<{ entityViewId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: entityViewId
        ? $t('tb.entityView.actions.edit')
        : $t('tb.entityView.actions.create'),
    });
    if (entityViewId) {
      const entityView = await getEntityViewById(entityViewId);
      record.value = entityView;
      const entityType = entityView.entityId?.entityType ?? EntityType.DEVICE;
      await formApi.setValues({
        assetId:
          entityType === EntityType.ASSET ? entityView.entityId?.id : undefined,
        deviceId:
          entityType === EntityType.DEVICE
            ? entityView.entityId?.id
            : undefined,
        description: entityView.additionalInfo?.description,
        entityType,
        name: entityView.name,
        type: entityView.type,
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
