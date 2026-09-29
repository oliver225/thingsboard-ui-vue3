<script lang="ts" setup>
import type { TbResourceInfo } from '#/api/tb/scada-symbol';
import type { ResourceScope } from '#/enums';

import { markRaw, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import ImageFileInput from '#/adapter/component/image-file-input.vue';
import { useVbenForm, z } from '#/adapter/form';
import {
  getScadaSymbolInfo,
  updateScadaSymbolFile,
  updateScadaSymbolInfo,
  uploadScadaSymbol,
} from '#/api/tb/scada-symbol';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | TbResourceInfo>(null);
const scope = ref<ResourceScope>('tenant');

async function handleFileSelect(file: File) {
  await formApi.setFieldValue('title', file.name);
}

const [Form, formApi] = useVbenForm<{
  file?: File | null;
  title: string;
}>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  schema: [
    {
      component: markRaw(ImageFileInput),
      componentProps: () => ({
        record: record.value,
        scope: scope.value,
        svgOnly: true,
        onSelect: handleFileSelect,
      }),
      defaultValue: null,
      fieldName: 'file',
      label: $t('scada-symbol.features.upload.preview'),
      modelPropName: 'modelValue',
      rules: z.custom<File | null | undefined>(
        (file) =>
          file instanceof File || (file === undefined && !!record.value),
        { message: $t('scada-symbol.validation.fileRequired') },
      ),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('scada-symbol.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      dependencies: {
        if: (formValues) =>
          !!formValues.file ||
          (formValues.file === undefined && !!record.value),
        triggerFields: ['file', 'title'],
      },
      fieldName: 'title',
      label: $t('scada-symbol.features.upload.title'),
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t('scada-symbol.validation.titleRequired'),
        }),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{
  resourceKey?: string;
  scope?: ResourceScope;
}>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const formValues = await formApi.getValues();
    const title = formValues.title.trim();

    modalApi.lock();
    try {
      if (record.value) {
        if (formValues.file) {
          // 标题更新使用替换文件后返回的最新元数据；失败重试时无需重复上传。
          record.value = await updateScadaSymbolFile(
            scope.value,
            record.value.resourceKey,
            formValues.file,
          );
          await formApi.setFieldValue('file', undefined);
        }
        if (title !== record.value.title) {
          record.value = await updateScadaSymbolInfo(
            scope.value,
            record.value.resourceKey,
            {
              ...record.value,
              title,
            },
          );
        }
        message.success($t('scada-symbol.messages.updateSuccess'));
      } else if (formValues.file) {
        await uploadScadaSymbol(formValues.file, title);
        message.success($t('scada-symbol.messages.uploadSuccess'));
      }
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const { resourceKey, scope: resourceScope } = modalApi.getData() ?? {};
    record.value = null;
    scope.value = resourceScope ?? 'tenant';
    await formApi.reset();
    modalApi.setState({
      title: resourceKey
        ? $t('scada-symbol.actions.edit')
        : $t('scada-symbol.actions.upload'),
    });

    modalApi.lock();
    try {
      if (resourceKey) {
        if (!resourceScope) {
          modalApi.close();
          return;
        }
        record.value = await getScadaSymbolInfo(resourceScope, resourceKey);
        await formApi.setValues({
          file: undefined,
          title: record.value.title ?? '',
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
