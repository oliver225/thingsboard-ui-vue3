<script lang="ts" setup>
import type { WidgetTypeDetails } from '#/api/tb/widget-type';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getWidgetTypeById, saveWidgetType } from '#/api/tb/widget-type';
import { WidgetCategory, widgetCategoryOptions } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | WidgetTypeDetails>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    colon: true,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('widget-type.fields.name'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('widget-type.validation.nameRequired') }),
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: $t('widget-type.fields.description'),
      componentProps: { rows: 3 },
    },
    {
      component: 'VbenSelect',
      fieldName: 'widgetType',
      label: $t('widget-type.fields.widgetType'),
      defaultValue: WidgetCategory.STATIC,
      componentProps: { options: widgetCategoryOptions(), allowClear: false },
      rules: 'required',
    },
    {
      component: 'TbSwitch',
      fieldName: 'deprecated',
      hideLabel: true,
      componentProps: { title: $t('widget-type.fields.deprecated') },
      defaultValue: false,
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();

    const widgetType = {
      ...record.value,
      name: formValues.name,
      description: formValues.description,
      deprecated: formValues.deprecated,
      descriptor: {
        resources: [],
        sizeX: 8,
        sizeY: 4,
        templateHtml: '',
        templateCss: '',
        controllerScript: '',
        defaultConfig: '{}',
        ...record.value?.descriptor,
        type: formValues.widgetType,
      },
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
    modalApi.lock();
    try {
      const { widgetTypeId } =
        (modalApi.getData() as { widgetTypeId?: string }) ?? {};
      record.value = null;
      await formApi.resetForm();
      modalApi.setState({
        title: widgetTypeId
          ? $t('widget-type.actions.edit')
          : $t('widget-type.actions.create'),
      });
      if (widgetTypeId) {
        const widgetType = await getWidgetTypeById(widgetTypeId);
        record.value = widgetType;
        await formApi.setValues({
          name: widgetType.name,
          description: widgetType.description,
          deprecated: widgetType.deprecated,
          widgetType: widgetType.descriptor?.type ?? WidgetCategory.STATIC,
        });
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <Form />
  </Modal>
</template>
