<script lang="ts" setup>
import type { UploadChangeParam, UploadFile } from 'antdv-next';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Upload } from 'antdv-next';

import { UploadDragger } from '#/adapter/component';
import { useVbenForm, z } from '#/adapter/form';
import { uploadResource } from '#/api/tb/resource';
import { ResourceType, resourceTypeOptions } from '#/enums';
import { $t } from '#/locales';

interface ResourceFormValues {
  files: UploadFile[];
  resourceType: ResourceType;
  title: string;
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const resourceType = ref(ResourceType.LWM2M_MODEL);

const RESOURCE_TYPE_ACCEPT: Partial<Record<ResourceType, string>> = {
  [ResourceType.LWM2M_MODEL]: '.xml',
  [ResourceType.PKCS_12]: '.p12,.pfx',
  [ResourceType.JKS]: '.jks',
};

function handleBeforeUpload(file: File) {
  const accept = RESOURCE_TYPE_ACCEPT[resourceType.value];
  if (
    accept &&
    !accept
      .split(',')
      .some((suffix) => file.name.toLowerCase().endsWith(suffix))
  ) {
    message.error(
      $t('resource-library.validation.fileTypeInvalid', { accept }),
    );
    return Upload.LIST_IGNORE;
  }
  return false;
}

async function handleFileChange({ file, fileList }: UploadChangeParam) {
  if (file.status === 'removed' || fileList.length === 0) return;
  const formValues = await formApi.getValues();
  if (
    formValues.resourceType !== ResourceType.LWM2M_MODEL &&
    !formValues.title?.trim()
  ) {
    await formApi.setFieldValue('title', file.name);
  }
}

const [Form, formApi] = useVbenForm<ResourceFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  handleValuesChange(formValues) {
    if (
      formValues.resourceType &&
      formValues.resourceType !== resourceType.value
    ) {
      resourceType.value = formValues.resourceType;
      void formApi.setValues({ files: [], title: '' });
    }
  },
  schema: [
    {
      component: 'VbenSelect',
      componentProps: { options: resourceTypeOptions() },
      defaultValue: ResourceType.LWM2M_MODEL,
      fieldName: 'resourceType',
      label: $t('resource-library.fields.resourceType'),
      rules: z.enum(
        [
          ResourceType.LWM2M_MODEL,
          ResourceType.PKCS_12,
          ResourceType.JKS,
          ResourceType.GENERAL,
        ],
        {
          error: $t('resource-library.validation.resourceTypeRequired'),
        },
      ),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('resource-library.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      dependencies: {
        if: (formValues) =>
          formValues.resourceType !== ResourceType.LWM2M_MODEL,
        triggerFields: ['resourceType'],
      },
      fieldName: 'title',
      label: $t('resource-library.fields.title'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('resource-library.validation.titleRequired') })
        .max(255, {
          message: $t('resource-library.validation.titleTooLong'),
        }),
    },
    {
      component: 'UploadDragger',
      componentProps: () => ({
        accept: RESOURCE_TYPE_ACCEPT[resourceType.value],
        beforeUpload: handleBeforeUpload,
        maxCount:
          resourceType.value === ResourceType.LWM2M_MODEL ? undefined : 1,
        multiple: resourceType.value === ResourceType.LWM2M_MODEL,
        onChange: handleFileChange,
      }),
      defaultValue: [],
      fieldName: 'files',
      label: $t('resource-library.fields.file'),
      rules: z.custom<UploadFile[]>(
        (files) =>
          Array.isArray(files) &&
          files.length > 0 &&
          files.every((file) => file.originFileObj instanceof File),
        { message: $t('resource-library.validation.fileRequired') },
      ),
    },
  ],
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const formValues = await formApi.getValues();
    let uploadedCount = 0;
    modalApi.lock();
    try {
      for (const uploadFile of formValues.files) {
        const file = uploadFile.originFileObj;
        if (!file) {
          throw new Error($t('resource-library.validation.fileRequired'));
        }
        await uploadResource({
          file,
          resourceType: formValues.resourceType,
          title:
            formValues.resourceType === ResourceType.LWM2M_MODEL
              ? undefined
              : formValues.title.trim(),
        });
        uploadedCount++;
        // 保留未上传的文件，部分失败后重试不会再次上传成功项。
        await formApi.setFieldValue(
          'files',
          formValues.files.slice(uploadedCount),
          false,
        );
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
    } catch (error) {
      if (uploadedCount > 0) {
        message.warning(
          $t('resource-library.features.upload.partialFailure', {
            uploaded: uploadedCount,
            remaining: formValues.files.length - uploadedCount,
          }),
        );
      }
      throw error;
    } finally {
      if (uploadedCount > 0) emit('success');
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    resourceType.value = ResourceType.LWM2M_MODEL;
    await formApi.reset();
    modalApi.setState({ title: $t('resource-library.actions.add') });
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
    <Form>
      <template #files="slotProps">
        <UploadDragger v-bind="slotProps.componentProps">
          <IconifyIcon
            icon="lucide:cloud-upload"
            class="text-primary mx-auto mb-3 size-10"
          />
          <p class="text-sm text-muted-foreground">
            {{ $t('resource-library.features.form.filePlaceholder') }}
          </p>
        </UploadDragger>
      </template>
    </Form>
  </Modal>
</template>
