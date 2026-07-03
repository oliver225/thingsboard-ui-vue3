<script lang="ts" setup>
import type { WidgetTypeDetails } from '#/api/tb/widget-type';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getWidgetTypeById, saveWidgetType } from '#/api/tb/widget-type';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | WidgetTypeDetails>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    colon: true,
  },
  // TODO: 表单项待补充(name / description / tags / descriptor 等)
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const widgetType = {
      ...record.value,
      ...values,
    } as WidgetTypeDetails;

    modalApi.lock();
    try {
      await saveWidgetType(widgetType);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { widgetTypeId } =
      modalApi.getData<{ widgetTypeId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: widgetTypeId
        ? $t('tb.widgetType.actions.edit')
        : $t('tb.widgetType.actions.create'),
    });
    if (widgetTypeId) {
      const widgetType = await getWidgetTypeById(widgetTypeId);
      record.value = widgetType;
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
