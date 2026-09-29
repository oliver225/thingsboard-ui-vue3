<script setup lang="ts">
import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCustomers } from '#/api/tb/customer';
import { assignDeviceToCustomer } from '#/api/tb/device';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

const emit = defineEmits<{ success: [assignedIds: string[]] }>();
const { hasAccessByRoles } = useAccess();
const deviceIds = ref<string[]>([]);
const pendingIds = ref<string[]>([]);
const errorMessage = ref('');
const [Form, formApi] = useVbenForm<{ customerId: string }>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: [
    {
      fieldName: 'customerId',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const customers = await loadAllPages(getCustomers);
          return customers.filter(
            (customer) => customer.id && !customer.additionalInfo?.isPublic,
          );
        },
        labelField: 'title',
        valueField: 'id.id',
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t('device.features.assign.customer'),
      },
      label: $t('device.fields.customer'),
      rules: z.string().min(1, $t('device.features.assign.customer')),
    },
  ],
});
const [Modal, modalApi] = useVbenModal<{ deviceIds: string[] }>({
  async onConfirm() {
    if (
      modalState.value.submitting ||
      !hasAccessByRoles([Authority.TENANT_ADMIN])
    )
      return;
    if (pendingIds.value.length === 0) return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!valid) return;
      const { customerId } = await formApi.getValues();
      errorMessage.value = '';
      const ids = [...pendingIds.value];
      const results = await Promise.allSettled(
        ids.map((id) => assignDeviceToCustomer(customerId, id)),
      );
      const assignedIds = ids.filter(
        (_, index) => results[index]?.status === 'fulfilled',
      );
      pendingIds.value = ids.filter(
        (_, index) => results[index]?.status === 'rejected',
      );
      if (assignedIds.length > 0) emit('success', assignedIds);
      if (pendingIds.value.length > 0) {
        errorMessage.value = $t('device.features.assign.partialFailure', {
          count: pendingIds.value.length,
        });
        return;
      }
      message.success($t('device.features.assign.success'));
      await modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    deviceIds.value = [...new Set(modalApi.getData()?.deviceIds)];
    pendingIds.value = [...deviceIds.value];
    errorMessage.value = '';
    await formApi.reset();
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    :title="
      deviceIds.length > 1
        ? $t('device.features.assign.batchTitle')
        : $t('device.features.assign.title')
    "
    :confirm-text="$t('device.features.assign.confirm')"
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="min-h-0 px-6 pt-5 pb-1"
  >
    <p v-if="deviceIds.length > 1" class="text-muted-foreground mb-4 text-sm">
      {{ $t('device.features.assign.batchCount', { count: deviceIds.length }) }}
    </p>
    <Form />
    <p v-if="errorMessage" role="alert" class="text-destructive text-sm">
      {{ errorMessage }}
    </p>
  </Modal>
</template>
