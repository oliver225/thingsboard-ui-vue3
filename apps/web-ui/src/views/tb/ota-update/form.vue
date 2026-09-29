<script lang="ts" setup>
import type { UploadFile } from 'antdv-next';

import type { OtaPackageInfo } from '#/api/tb/ota-package';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, message, UploadDragger } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import {
  checksumAlgorithms,
  deleteOtaPackage,
  getOtaPackageInfo,
  saveOtaPackageInfo,
  uploadOtaPackageFile,
} from '#/api/tb/ota-package';
import { EntityType, OtaPackageType, otaPackageTypeOptions } from '#/enums';
import { $t } from '#/locales';

interface OtaUpdateFormValues {
  checksum: string;
  checksumAlgorithm: string;
  contentType?: string;
  dataSize?: string;
  description: string;
  deviceProfileId: string;
  fileName?: string;
  files: UploadFile[];
  generateChecksum: boolean;
  isURL: boolean;
  tag: string;
  title: string;
  type: OtaPackageType;
  url: string;
  version: string;
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | OtaPackageInfo>(null);
const tagEdited = ref(false);

function handleBeforeUpload() {
  // 只选择文件，确认保存时再创建更新包并上传。
  return false;
}

const [Form, formApi] = useVbenForm<OtaUpdateFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  handleValuesChange(formValues, changedFields) {
    if (
      record.value ||
      tagEdited.value ||
      !changedFields.some((field) => field === 'title' || field === 'version')
    )
      return;
    const tag = `${formValues.title ?? ''} ${formValues.version ?? ''}`
      .trim()
      .slice(0, 255);
    if (formValues.tag !== tag) void formApi.setFieldValue('tag', tag, false);
  },
  schema: [
    {
      component: 'VbenInput',
      componentProps: () => ({
        disabled: !!record.value,
        placeholder: $t('ota-updates.features.form.titlePlaceholder'),
      }),
      defaultValue: '',
      fieldName: 'title',
      label: $t('ota-updates.fields.title'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('ota-updates.validation.titleRequired') })
        .max(255, {
          message: $t('ota-updates.validation.maxLength', { max: 255 }),
        }),
    },
    {
      component: 'VbenInput',
      componentProps: () => ({
        disabled: !!record.value,
        placeholder: $t('ota-updates.features.form.versionPlaceholder'),
      }),
      defaultValue: '',
      fieldName: 'version',
      label: $t('ota-updates.fields.version'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('ota-updates.validation.versionRequired') })
        .max(255, {
          message: $t('ota-updates.validation.maxLength', { max: 255 }),
        }),
    },
    {
      component: 'VbenInput',
      componentProps: () => ({
        disabled: !!record.value,
        placeholder: $t('ota-updates.features.form.tagPlaceholder'),
        onInput: () => {
          tagEdited.value = true;
        },
      }),
      defaultValue: '',
      fieldName: 'tag',
      label: $t('ota-updates.fields.tag'),
      rules: z
        .string()
        .trim()
        .max(255, {
          message: $t('ota-updates.validation.maxLength', { max: 255 }),
        }),
    },
    {
      component: 'EntityInput',
      componentProps: () => ({
        entityType: 'DEVICE_PROFILE',
        disabled: !!record.value,
        showSearch: true,
        placeholder: $t('ota-updates.validation.deviceProfileRequired'),
      }),
      defaultValue: '',
      fieldName: 'deviceProfileId',
      label: $t('ota-updates.fields.deviceProfile'),
      rules: z.string().min(1, {
        message: $t('ota-updates.validation.deviceProfileRequired'),
      }),
    },
    {
      component: 'VbenSelect',
      componentProps: () => ({
        disabled: !!record.value,
        options: otaPackageTypeOptions(),
      }),
      defaultValue: OtaPackageType.FIRMWARE,
      fieldName: 'type',
      label: $t('ota-updates.fields.type'),
      rules: z.enum(OtaPackageType, {
        error: $t('ota-updates.validation.typeRequired'),
      }),
    },
    {
      component: 'TbSwitch',
      componentProps: () => ({
        disabled: !!record.value,
        title: $t('ota-updates.fields.useUrl'),
        description: $t('ota-updates.features.form.urlDescription'),
      }),
      defaultValue: false,
      fieldName: 'isURL',
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: () => ({
        disabled: !!record.value,
        placeholder: 'https://example.com/firmware.bin',
      }),
      defaultValue: '',
      dependencies: {
        triggerFields: ['isURL'],
        resolve: ({ values: formValues }) => ({ if: formValues.isURL }),
      },
      fieldName: 'url',
      label: $t('ota-updates.fields.url'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t('ota-updates.validation.urlRequired'),
        }),
    },
    {
      component: UploadDragger,
      componentProps: {
        beforeUpload: handleBeforeUpload,
        maxCount: 1,
        multiple: false,
        showUploadList: { showRemoveIcon: true, showPreviewIcon: false },
      },
      defaultValue: [],
      dependencies: {
        triggerFields: ['title', 'isURL'],
        resolve: ({ values: formValues }) => ({
          if: !record.value && !formValues.isURL,
        }),
      },
      fieldName: 'files',
      label: $t('ota-updates.fields.file'),
      modelPropName: 'fileList',
      formItemClass: 'sm:col-span-2',
      rules: z.custom<UploadFile[]>(
        (files) =>
          Array.isArray(files) &&
          files.length === 1 &&
          files[0]?.originFileObj instanceof File,
        { message: $t('ota-updates.validation.fileRequired') },
      ),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('ota-updates.actions.generateChecksum') },
      defaultValue: true,
      dependencies: {
        triggerFields: ['title', 'isURL'],
        resolve: ({ values: formValues }) => ({
          if: !record.value && !formValues.isURL,
        }),
      },
      fieldName: 'generateChecksum',
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenSelect',
      componentProps: () => ({
        disabled: !!record.value,
        options: checksumAlgorithms.map((value) => ({ label: value, value })),
      }),
      defaultValue: 'SHA256',
      dependencies: {
        triggerFields: ['title', 'isURL', 'generateChecksum'],
        resolve: ({ values: formValues }) => ({
          if:
            !formValues.isURL &&
            (!!record.value || !formValues.generateChecksum),
        }),
      },
      fieldName: 'checksumAlgorithm',
      label: $t('ota-updates.fields.algorithm'),
      rules: z.enum(checksumAlgorithms, {
        error: $t('ota-updates.validation.required'),
      }),
    },
    {
      component: 'VbenInput',
      componentProps: () => ({
        disabled: !!record.value,
        placeholder: $t('ota-updates.messages.autoChecksum'),
      }),
      defaultValue: '',
      dependencies: {
        triggerFields: ['title', 'isURL', 'generateChecksum'],
        resolve: ({ values: formValues }) => ({
          if:
            !formValues.isURL &&
            (!!record.value || !formValues.generateChecksum),
        }),
      },
      fieldName: 'checksum',
      label: $t('ota-updates.fields.checksum'),
      rules: z
        .string()
        .trim()
        .max(1020, {
          message: $t('ota-updates.validation.maxLength', { max: 1020 }),
        }),
    },
    {
      component: 'VbenInput',
      componentProps: { disabled: true },
      dependencies: {
        triggerFields: ['title', 'isURL'],
        resolve: ({ values: formValues }) => ({
          if: !!record.value && !formValues.isURL,
        }),
      },
      fieldName: 'fileName',
      label: $t('ota-updates.fields.fileName'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: { disabled: true },
      dependencies: {
        triggerFields: ['title', 'isURL'],
        resolve: ({ values: formValues }) => ({
          if: !!record.value && !formValues.isURL,
        }),
      },
      fieldName: 'dataSize',
      label: $t('ota-updates.fields.dataSizeBytes'),
    },
    {
      component: 'VbenInput',
      componentProps: { disabled: true },
      dependencies: {
        triggerFields: ['title', 'isURL'],
        resolve: ({ values: formValues }) => ({
          if: !!record.value && !formValues.isURL,
        }),
      },
      fieldName: 'contentType',
      label: $t('ota-updates.fields.contentType'),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('ota-updates.features.form.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('ota-updates.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ otaPackageId?: string }>({
  async onConfirm() {
    // 编辑仅保存描述，不让历史记录的只读字段阻止保存。
    if (!record.value) {
      const { valid } = await formApi.validate();
      if (!valid) return;
    }
    const formValues = await formApi.getValues();
    const file = formValues.files?.[0]?.originFileObj;
    if (!record.value && !formValues.isURL && !file) {
      message.error($t('ota-updates.validation.fileRequired'));
      return;
    }

    modalApi.lock();
    try {
      if (record.value) {
        await saveOtaPackageInfo({
          ...record.value,
          additionalInfo: {
            ...record.value.additionalInfo,
            description: formValues.description,
          },
        });
      } else {
        const otaPackage: OtaPackageInfo = {
          additionalInfo: { description: formValues.description },
          deviceProfileId: {
            entityType: EntityType.DEVICE_PROFILE,
            id: formValues.deviceProfileId,
          },
          tag: formValues.tag.trim(),
          title: formValues.title.trim(),
          type: formValues.type,
          version: formValues.version.trim(),
          ...(formValues.isURL ? { url: formValues.url.trim() } : {}),
        };
        const savedPackage = await saveOtaPackageInfo(otaPackage);
        if (!formValues.isURL && file) {
          const otaPackageId = savedPackage.id?.id;
          if (!otaPackageId)
            throw new Error($t('ota-updates.messages.uploadFailed'));
          try {
            await uploadOtaPackageFile(
              otaPackageId,
              file,
              formValues.generateChecksum
                ? 'SHA256'
                : formValues.checksumAlgorithm,
              formValues.generateChecksum
                ? undefined
                : formValues.checksum.trim(),
            );
          } catch (error) {
            // 上传失败时清理刚创建的元数据，避免重试产生同名包。
            try {
              await deleteOtaPackage(otaPackageId);
            } catch {
              message.error($t('ota-updates.messages.cleanupFailed'));
              modalApi.close();
              emit('success');
            }
            throw error;
          }
        }
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { otaPackageId } = modalApi.getData() ?? {};
    record.value = null;
    tagEdited.value = false;
    await formApi.reset();
    modalApi.setState({
      title: otaPackageId
        ? $t('ota-updates.actions.edit')
        : $t('ota-updates.actions.add'),
    });
    modalApi.lock();
    try {
      if (otaPackageId) {
        const otaPackage = await getOtaPackageInfo(otaPackageId);
        record.value = otaPackage;
        await formApi.setValues({
          title: otaPackage.title,
          version: otaPackage.version,
          tag: otaPackage.tag ?? '',
          type: otaPackage.type,
          deviceProfileId: otaPackage.deviceProfileId?.id ?? '',
          isURL: !!otaPackage.url,
          url: otaPackage.url ?? '',
          checksumAlgorithm: otaPackage.checksumAlgorithm ?? 'SHA256',
          checksum: otaPackage.checksum ?? '',
          fileName: otaPackage.fileName ?? '—',
          dataSize: String(otaPackage.dataSize ?? '—'),
          contentType: otaPackage.contentType ?? '—',
          description: otaPackage.additionalInfo?.description ?? '',
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
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
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
    <Alert
      v-if="record"
      class="mb-5 rounded-md"
      type="warning"
      show-icon
      :message="$t('ota-updates.messages.immutable')"
    />
    <Form>
      <template #files="slotProps">
        <UploadDragger v-bind="slotProps.componentProps">
          <IconifyIcon
            icon="lucide:cloud-upload"
            class="text-primary mx-auto mb-3 size-10"
            aria-hidden="true"
          />
          <p class="text-sm font-medium">
            {{ $t('ota-updates.actions.chooseFile') }}
          </p>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ $t('ota-updates.features.form.filePlaceholder') }}
          </p>
        </UploadDragger>
      </template>
    </Form>
  </Modal>
</template>
