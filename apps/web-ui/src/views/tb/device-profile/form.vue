<script lang="ts" setup>
/**
 * 设备配置 新建/编辑 弹窗
 * 仅提供基础字段(名称/描述);传输、配置策略、告警规则等高级配置暂未实现,
 * 新建时下发一份「DEFAULT」默认 profileData 以保证后端可创建,编辑时原样保留。
 */
import type { DeviceProfile } from '#/api/tb/device-profile';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getDeviceProfileById,
  saveDeviceProfile,
} from '#/api/tb/device-profile';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<DeviceProfile | null>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('tb.deviceProfile.fields.name'),
      rules: z
        .string()
        .min(1, { message: $t('tb.deviceProfile.validation.nameRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.deviceProfile.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const deviceProfile: DeviceProfile = {
      ...record.value,
      description: values.description,
      name: values.name,
    };

    // 新建:补一份 DEFAULT 默认配置(对齐旧版 createDeviceProfile)
    if (!deviceProfile.id) {
      deviceProfile.type = 'DEFAULT';
      deviceProfile.transportType = 'DEFAULT';
      deviceProfile.provisionType = 'DISABLED';
      deviceProfile.profileData = {
        alarms: null,
        configuration: { type: 'DEFAULT' },
        provisionConfiguration: {
          provisionDeviceKey: null,
          type: 'DISABLED',
        },
        transportConfiguration: { type: 'DEFAULT' },
      };
    }

    modalApi.lock();
    try {
      await saveDeviceProfile(deviceProfile);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { deviceProfileId } =
      modalApi.getData<{ deviceProfileId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: deviceProfileId
        ? $t('tb.deviceProfile.actions.edit')
        : $t('tb.deviceProfile.actions.create'),
    });
    if (deviceProfileId) {
      const deviceProfile = await getDeviceProfileById(deviceProfileId);
      record.value = deviceProfile;
      await formApi.setValues({
        description: deviceProfile.description,
        name: deviceProfile.name,
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
