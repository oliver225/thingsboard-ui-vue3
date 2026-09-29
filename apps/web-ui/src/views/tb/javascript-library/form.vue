<script lang="ts" setup>
import type { UploadChangeParam, UploadFile } from 'antdv-next';

import type { TbResourceInfo } from '#/api/tb/resource';

import { h, markRaw, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Textarea } from '@vben-core/shadcn-ui';

import { message, Upload } from 'antdv-next';

import { UploadDragger } from '#/adapter/component';
import { useVbenForm, z } from '#/adapter/form';
import {
  getResourceById,
  updateResourceData,
  updateResourceInfo,
  uploadResource,
} from '#/api/tb/resource';
import { ResourceSubType, resourceSubTypeOptions, ResourceType } from '#/enums';
import { $t } from '#/locales';
import { base64ToUtf8 } from '#/utils/file';

interface JavaScriptFormValues {
  content: string;
  files: UploadFile[];
  resourceSubType: ResourceSubType;
  title: string;
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | TbResourceInfo>(null);
const resourceSubType = ref(ResourceSubType.EXTENSION);
const isReadonly = ref(false);
const isImporting = ref(false);
const originalContent = ref('');
const moduleFileName = ref('');
const JS_ACCEPT = '.js';
let importVersion = 0;

async function setTitleFromFile(file: File) {
  const formValues = await formApi.getValues();
  if (!formValues.title?.trim()) {
    await formApi.setFieldValue('title', file.name);
  }
}

function handleBeforeUpload(file: File) {
  if (!file.name.toLowerCase().endsWith(JS_ACCEPT)) {
    message.error($t('javascript-library.validation.fileTypeInvalid'));
    return Upload.LIST_IGNORE;
  }
  return false;
}

async function handleFileChange({ file, fileList }: UploadChangeParam) {
  if (file.status === 'removed') return;
  const selectedFile = fileList[0]?.originFileObj;
  if (selectedFile) await setTitleFromFile(selectedFile);
}

function handleBeforeImport(file: File) {
  if (handleBeforeUpload(file) === false) void importModuleScript(file);
  return Upload.LIST_IGNORE;
}

async function importModuleScript(file: File) {
  if (isReadonly.value || resourceSubType.value !== ResourceSubType.MODULE)
    return;

  const version = ++importVersion;
  isImporting.value = true;
  modalApi.lock();
  try {
    const content = await file.text();
    if (version !== importVersion) return;
    moduleFileName.value = file.name;
    await formApi.setFieldValue('content', content);
    await setTitleFromFile(file);
  } catch {
    if (version === importVersion)
      message.error($t('javascript-library.validation.readFileError'));
  } finally {
    if (version === importVersion) {
      isImporting.value = false;
      modalApi.unlock();
    }
  }
}

function renderModuleScriptLabel() {
  return h('span', { class: 'inline-flex flex-wrap items-center gap-x-3' }, [
    $t('javascript-library.fields.content'),
    !isReadonly.value &&
      h(
        Upload,
        {
          accept: JS_ACCEPT,
          beforeUpload: handleBeforeImport,
          disabled: isImporting.value,
          showUploadList: false,
        },
        {
          default: () =>
            h(
              VbenButton,
              {
                type: 'button',
                variant: 'link',
                class: 'h-6 gap-1 px-0 py-0 text-sm',
                disabled: isImporting.value,
              },
              () => [
                h(IconifyIcon, {
                  icon: 'lucide:file-up',
                  class: 'size-4',
                }),
                $t('javascript-library.features.form.importFromFile'),
              ],
            ),
        },
      ),
  ]);
}

const [Form, formApi] = useVbenForm<JavaScriptFormValues>({
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
      formValues.resourceSubType &&
      formValues.resourceSubType !== resourceSubType.value
    ) {
      resourceSubType.value = formValues.resourceSubType;
      if (!record.value) {
        importVersion++;
        moduleFileName.value = '';
        void formApi.setValues({ content: '', files: [] });
      }
    }
  },
  schema: [
    {
      component: 'VbenSelect',
      componentProps: () => ({
        disabled: !!record.value,
        options: resourceSubTypeOptions(),
      }),
      defaultValue: ResourceSubType.EXTENSION,
      fieldName: 'resourceSubType',
      label: $t('javascript-library.fields.subType'),
      rules: z.enum([ResourceSubType.EXTENSION, ResourceSubType.MODULE], {
        error: $t('javascript-library.validation.subTypeRequired'),
      }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('javascript-library.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('javascript-library.fields.title'),
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t('javascript-library.validation.titleRequired'),
        })
        .max(255, {
          message: $t('javascript-library.validation.titleTooLong'),
        }),
    },
    {
      component: 'UploadDragger',
      componentProps: {
        accept: JS_ACCEPT,
        beforeUpload: handleBeforeUpload,
        maxCount: 1,
        onChange: handleFileChange,
      },
      defaultValue: [],
      dependencies: {
        if: (formValues) =>
          formValues.resourceSubType === ResourceSubType.EXTENSION,
        triggerFields: ['resourceSubType'],
      },
      fieldName: 'files',
      label: $t('javascript-library.fields.file'),
      rules: z.custom<UploadFile[]>(
        (files) =>
          !!record.value ||
          (Array.isArray(files) &&
            files.length === 1 &&
            files[0].originFileObj instanceof File),
        { message: $t('javascript-library.validation.fileRequired') },
      ),
    },
    {
      component: markRaw(Textarea),
      componentProps: {
        class: 'min-h-72 resize-y font-mono text-sm',
        placeholder: $t('javascript-library.features.form.contentPlaceholder'),
        rows: 14,
        spellcheck: false,
      },
      defaultValue: '',
      dependencies: {
        if: (formValues) =>
          formValues.resourceSubType === ResourceSubType.MODULE,
        triggerFields: ['resourceSubType'],
      },
      fieldName: 'content',
      label: renderModuleScriptLabel,
      modelPropName: 'modelValue',
      rules: z.string().refine((value) => !!value.trim(), {
        message: $t('javascript-library.validation.contentRequired'),
      }),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{
  readonly?: boolean;
  resourceId?: string;
}>({
  async onConfirm() {
    if (isReadonly.value || isImporting.value) return;
    const { valid } = await formApi.validate();
    if (!valid) return;

    const formValues = await formApi.getValues();
    const title = formValues.title.trim();
    const isModule = formValues.resourceSubType === ResourceSubType.MODULE;
    const fileName =
      moduleFileName.value || (/\.js$/i.test(title) ? title : `${title}.js`);
    const file = isModule
      ? new File([formValues.content], fileName, { type: 'text/javascript' })
      : formValues.files?.[0]?.originFileObj;

    modalApi.lock();
    try {
      if (record.value?.id?.id) {
        const resourceId = record.value.id.id;
        if (
          file &&
          (!isModule || formValues.content !== originalContent.value)
        ) {
          record.value = await updateResourceData(resourceId, file);
          originalContent.value = formValues.content;
          await formApi.setFieldValue('files', []);
        }
        if (title !== record.value.title) {
          record.value = await updateResourceInfo(resourceId, {
            ...record.value,
            title,
          });
        }
      } else if (file) {
        await uploadResource({
          file,
          resourceSubType: formValues.resourceSubType,
          resourceType: ResourceType.JS_MODULE,
          title,
        });
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    importVersion++;
    isImporting.value = false;
    if (!isOpen) {
      modalApi.unlock();
      return;
    }

    const { readonly, resourceId } = modalApi.getData() ?? {};
    record.value = null;
    isReadonly.value = !!readonly;
    resourceSubType.value = ResourceSubType.EXTENSION;
    originalContent.value = '';
    moduleFileName.value = '';
    await formApi.reset();
    formApi.setState({ commonConfig: { disabled: isReadonly.value } });
    const title = resourceId
      ? $t('javascript-library.actions.edit')
      : $t('javascript-library.actions.add');
    modalApi.setState({
      showConfirmButton: !isReadonly.value,
      title: isReadonly.value ? $t('javascript-library.actions.view') : title,
    });

    modalApi.lock();
    try {
      if (resourceId) {
        const { data, ...resource } = await getResourceById(resourceId);
        record.value = resource;
        resourceSubType.value =
          resource.resourceSubType ?? ResourceSubType.EXTENSION;
        originalContent.value =
          resourceSubType.value === ResourceSubType.MODULE
            ? base64ToUtf8(data)
            : '';
        moduleFileName.value = resource.fileName ?? '';
        await formApi.setValues({
          content: originalContent.value,
          files: [],
          resourceSubType: resourceSubType.value,
          title: resource.title ?? '',
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

onBeforeUnmount(() => {
  importVersion++;
});
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
        <div class="w-full space-y-3">
          <UploadDragger v-bind="slotProps.componentProps">
            <IconifyIcon
              icon="lucide:cloud-upload"
              class="text-primary mx-auto mb-3 size-10"
            />
            <p class="text-sm text-muted-foreground">
              {{ $t('javascript-library.features.form.filePlaceholder') }}
            </p>
          </UploadDragger>
          <p
            v-if="
              record?.fileName && !slotProps.componentProps.fileList?.length
            "
            class="text-muted-foreground break-all text-sm"
          >
            {{ record.fileName }}
          </p>
        </div>
      </template>
    </Form>
  </Modal>
</template>
