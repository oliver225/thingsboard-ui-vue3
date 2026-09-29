<script lang="ts" setup>
import type { WidgetsBundle } from '#/api/tb/widgets-bundle';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  getWidgetsBundleById,
  saveWidgetsBundle,
} from '#/api/tb/widgets-bundle';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | WidgetsBundle>(null);

const [Form, formApi] = useVbenForm<{
  description: string;
  image: null | string;
  order: null | number;
  scada: boolean;
  title: string;
}>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: $t('widgets-bundle.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('widgets-bundle.fields.title'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('widgets-bundle.validation.titleRequired') })
        .max(255, {
          message: $t('widgets-bundle.validation.titleMaxLength'),
        }),
    },
    {
      component: 'ImageInput',
      defaultValue: '',
      fieldName: 'image',
      label: $t('widgets-bundle.fields.image'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'InputNumber',
      componentProps: {
        step: 1,
        placeholder: $t('widgets-bundle.features.form.orderPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'order',
      label: $t('widgets-bundle.fields.order'),
      rules: z
        .number()
        .int({ message: $t('widgets-bundle.validation.orderInteger') })
        .nullish(),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('widgets-bundle.fields.scada'),
        description: $t('widgets-bundle.features.form.scadaDescription'),
      },
      defaultValue: false,
      fieldName: 'scada',
      hideLabel: true,
    },

    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 1024,
        showCount: true,
        placeholder: $t('widgets-bundle.features.form.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('widgets-bundle.fields.description'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .max(1024, {
          message: $t('widgets-bundle.validation.descriptionMaxLength'),
        })
        .optional(),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ widgetsBundleId?: string }>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();

    const widgetsBundle: WidgetsBundle = {
      ...record.value,
      title: formValues.title.trim(),
      image: formValues.image ?? '',
      description: formValues.description ?? '',
      scada: formValues.scada,
      order: formValues.order ?? null,
    };

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
    const { widgetsBundleId } = modalApi.getData() ?? {};
    record.value = null;
    await formApi.reset();
    modalApi.setState({
      title: widgetsBundleId
        ? $t('widgets-bundle.actions.edit')
        : $t('widgets-bundle.actions.create'),
    });
    modalApi.lock();
    try {
      if (widgetsBundleId) {
        const widgetsBundle = await getWidgetsBundleById(widgetsBundleId);
        record.value = widgetsBundle;
        await formApi.setValues({
          title: widgetsBundle.title ?? '',
          image: widgetsBundle.image ?? '',
          description: widgetsBundle.description ?? '',
          scada: widgetsBundle.scada ?? false,
          order: widgetsBundle.order ?? null,
        });
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form />
  </Modal>
</template>
