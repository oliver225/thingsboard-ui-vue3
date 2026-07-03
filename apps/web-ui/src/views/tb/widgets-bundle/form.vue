<script lang="ts" setup>
import type { WidgetsBundle } from '#/api/tb/widgets-bundle';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  getWidgetsBundleById,
  saveWidgetsBundle,
} from '#/api/tb/widgets-bundle';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | WidgetsBundle>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    colon: true,
  },
  // TODO: 表单项待补充(title / description / image 等)
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const widgetsBundle = {
      ...record.value,
      ...values,
    } as WidgetsBundle;

    modalApi.lock();
    try {
      await saveWidgetsBundle(widgetsBundle);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { widgetsBundleId } =
      modalApi.getData<{ widgetsBundleId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: widgetsBundleId
        ? $t('tb.widgetsBundle.actions.edit')
        : $t('tb.widgetsBundle.actions.create'),
    });
    if (widgetsBundleId) {
      const widgetsBundle = await getWidgetsBundleById(widgetsBundleId);
      record.value = widgetsBundle;
      await formApi.setValues({
        // TODO: 随表单项补充回填字段
      });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :fullscreen-button="false"
    :close-on-click-modal="false"
  >
    <Form />
  </Modal>
</template>
