<script lang="ts" setup>
/**
 * 设备 新建/编辑 弹窗(CRUD 模板:useVbenModal + useVbenForm)
 */
import type { Device } from '#/api/tb/device';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getDeviceById, saveDevice } from '#/api/tb/device';
import { getDeviceProfileInfos } from '#/api/tb/device-profile';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

/** 编辑时持有原始实体,保存时合并以保留 id/version/customerId 等字段 */
const editingDevice = ref<Device | null>(null);

async function loadDeviceProfileOptions() {
  const pageData = await getDeviceProfileInfos({ page: 0, pageSize: 100 });
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
      label: $t('tb.device.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.device.validation.nameRequired') }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadDeviceProfileOptions,
        showSearch: true,
      },
      fieldName: 'deviceProfileId',
      label: $t('tb.device.fields.deviceProfile'),
      rules: z
        .string()
        .min(1, { message: $t('tb.device.validation.profileRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'label',
      label: $t('tb.device.fields.label'),
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'gateway',
      label: $t('tb.device.fields.isGateway'),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.device.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const device: Device = {
      ...editingDevice.value,
      additionalInfo: {
        ...editingDevice.value?.additionalInfo,
        description: values.description,
        gateway: values.gateway,
      },
      deviceProfileId: {
        entityType: EntityType.DEVICE_PROFILE,
        id: values.deviceProfileId,
      },
      label: values.label,
      name: values.name,
    };

    modalApi.lock();
    try {
      await saveDevice(device);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { deviceId } = modalApi.getData<{ deviceId?: string }>() ?? {};
    editingDevice.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: deviceId
        ? $t('tb.device.actions.edit')
        : $t('tb.device.actions.create'),
    });
    if (deviceId) {
      const device = await getDeviceById(deviceId);
      editingDevice.value = device;
      await formApi.setValues({
        description: device.additionalInfo?.description,
        deviceProfileId: device.deviceProfileId?.id,
        gateway: device.additionalInfo?.gateway ?? false,
        label: device.label,
        name: device.name,
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
