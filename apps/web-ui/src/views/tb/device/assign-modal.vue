<script lang="ts" setup>
import type { DeviceInfo } from '#/api/tb/device';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getCustomers } from '#/api/tb/customer';
import { assignDeviceToCustomer } from '#/api/tb/device';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const deviceInfos = ref<DeviceInfo[]>([]);
const deviceName = ref('');

function getAssignDevices() {
  return deviceInfos.value;
}

async function loadCustomerOptions() {
  const pageData = await getCustomers({
    page: 0,
    pageSize: 1000,
    sortOrder: 'ASC',
    sortProperty: 'title',
  });
  return pageData.data.map((item) => ({
    label: item.title,
    value: item.id?.id,
  }));
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadCustomerOptions,
        showSearch: true,
        style: { width: '100%' },
        size: 'large',
      },
      fieldName: 'customerId',
      label: $t('tb.device.assign.customer'),
      rules: 'selectRequired',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const { customerId } = await formApi.getValues();
    const devices = getAssignDevices().filter((item) => item.id?.id);
    if (devices.length === 0 || !customerId) return;

    modalApi.lock();
    try {
      await Promise.all(
        devices.map((item) =>
          assignDeviceToCustomer(customerId, item.id?.id || ''),
        ),
      );
      message.success($t('tb.device.assign.success'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data =
      modalApi.getData<DeviceInfo & { devices?: DeviceInfo[] }>() ?? {};
    deviceInfos.value = data.devices ?? (data.id?.id ? [data] : []);
    deviceName.value =
      deviceInfos.value.length === 1 ? (deviceInfos.value[0]?.name ?? '') : '';
    formApi.resetForm();
    modalApi.setState({
      confirmText: $t('tb.device.assign.confirm'),
      title:
        deviceInfos.value.length > 1
          ? $t('tb.device.assign.batchTitle')
          : $t('tb.device.assign.title'),
    });
  },
});
</script>

<template>
  <Modal
    class="w-1/4"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <div
      v-if="deviceInfos.length > 1"
      class="mb-4 text-sm leading-6 text-muted-foreground"
    >
      {{ $t('tb.device.assign.batchCount', { count: deviceInfos.length }) }}
    </div>
    <div v-if="deviceName" class="mb-4 flex min-w-0 gap-1.5 text-sm leading-6">
      <span class="shrink-0 text-muted-foreground">
        {{ $t('tb.device.fields.name') }}：
      </span>
      <span class="min-w-0 flex-1 truncate font-medium" :title="deviceName">
        {{ deviceName }}
      </span>
    </div>
    <Form />
  </Modal>
</template>
