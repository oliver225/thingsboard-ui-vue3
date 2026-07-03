<script lang="ts" setup>
import type { TbResource } from '#/api/tb/resource';

import { reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input, message, Select, Upload } from 'antdv-next';

import {
  getResourceById,
  updateResourceData,
  updateResourceInfo,
  uploadResource,
} from '#/api/tb/resource';
import { ResourceSubType, resourceSubTypeOptions, ResourceType } from '#/enums';
import { $t } from '#/locales';
import { base64ToUtf8 } from '#/utils/file';

const emit = defineEmits<{ success: [] }>();

/** JS 文件类型限制 */
const JS_ACCEPT = '.js,text/javascript,application/javascript';

/** 已加载的资源实体(编辑态);新增态为 null */
const record = ref<null | TbResource>(null);

const formState = reactive<any>({
  content: '',
  existingFileName: '',
  file: undefined,
  originalContent: '',
  readonly: false,
  resourceSubType: ResourceSubType.EXTENSION,
  title: '',
});

/** 子类型切换(仅新增态):清空已选文件与代码 */
watch(
  () => formState.resourceSubType,
  () => {
    if (!record.value) {
      formState.file = undefined;
      formState.content = '';
    }
  },
);

/** EXTENSION:选择文件,拦截自动上传,仅记录文件 */
function handleBeforeUpload(target: File) {
  formState.file = target;
  if (!formState.title) {
    formState.title = target.name.replace(/\.js$/i, '');
  }
  return false;
}

/** MODULE:从本地 .js 文件读入代码内容 */
async function handleImportContent(target: File) {
  try {
    formState.content = await target.text();
  } catch {
    message.error($t('tb.javascriptLibrary.validation.readFileError'));
  }
  return false;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formState.title.trim()) {
      message.error($t('tb.javascriptLibrary.validation.titleRequired'));
      return;
    }
    if (formState.resourceSubType === ResourceSubType.MODULE) {
      if (!formState.content.trim()) {
        message.error($t('tb.javascriptLibrary.validation.contentRequired'));
        return;
      }
    } else if (!record.value && !formState.file) {
      message.error($t('tb.javascriptLibrary.validation.fileRequired'));
      return;
    }

    modalApi.lock();
    try {
      await (formState.resourceSubType === ResourceSubType.MODULE
        ? saveModule()
        : saveExtension());
      message.success(
        record.value
          ? $t('tb.javascriptLibrary.updateSuccess')
          : $t('tb.javascriptLibrary.uploadSuccess'),
      );
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data =
      modalApi.getData<{ readonly?: boolean; resourceId?: string }>() ?? {};
    formState.readonly = !!data.readonly;
    record.value = null;
    formState.resourceSubType = ResourceSubType.EXTENSION;
    formState.title = '';
    formState.file = undefined;
    formState.existingFileName = '';
    formState.content = '';
    formState.originalContent = '';
    modalApi.setState({
      showConfirmButton: !data.readonly,
      title: data.resourceId
        ? $t('tb.javascriptLibrary.actions.edit')
        : $t('tb.javascriptLibrary.actions.add'),
    });
    if (data.resourceId) {
      const info = await getResourceById(data.resourceId);
      record.value = info;
      formState.title = info.title ?? '';
      formState.resourceSubType =
        info.resourceSubType ?? ResourceSubType.EXTENSION;
      formState.existingFileName = info.fileName ?? '';
      if (info.resourceSubType === ResourceSubType.MODULE) {
        formState.content = base64ToUtf8(info.data);
        formState.originalContent = formState.content;
      }
    }
  },
});

/** 保存 EXTENSION(上传 / 替换 .js 文件) */
async function saveExtension() {
  const id = record.value?.id?.id;
  if (id) {
    if (formState.file) {
      await updateResourceData(id, formState.file);
    }
    if (formState.title !== record.value?.title) {
      await updateResourceInfo(id, buildInfo());
    }
    return;
  }
  await uploadResource({
    file: formState.file as File,
    resourceSubType: ResourceSubType.EXTENSION,
    resourceType: ResourceType.JS_MODULE,
    title: formState.title.trim(),
  });
}

/** 保存 MODULE(将代码内容打包为 .js 文件) */
async function saveModule() {
  const fileName = formState.existingFileName || `${formState.title.trim()}.js`;
  const moduleFile = new File([formState.content], fileName, {
    type: 'text/javascript',
  });
  const id = record.value?.id?.id;
  if (id) {
    if (formState.content !== formState.originalContent) {
      await updateResourceData(id, moduleFile);
    }
    if (formState.title !== record.value?.title) {
      await updateResourceInfo(id, buildInfo());
    }
    return;
  }
  await uploadResource({
    file: moduleFile,
    resourceSubType: ResourceSubType.MODULE,
    resourceType: ResourceType.JS_MODULE,
    title: formState.title.trim(),
  });
}

/** 构造资源信息更新体(剔除 base64 数据) */
function buildInfo() {
  const { data: _data, ...info } = record.value ?? {};
  return { ...info, title: formState.title.trim() } as TbResource;
}
</script>

<template>
  <Modal
    class="w-3/5"
    :centered="true"
    :fullscreen-button="false"
    :close-on-click-modal="false"
  >
    <div class="flex flex-col gap-4 p-1">
      <div>
        <div class="mb-1 text-sm">
          {{ $t('tb.javascriptLibrary.fields.subType') }}
        </div>
        <Select
          v-model:value="formState.resourceSubType"
          size="large"
          class="w-full"
          :disabled="!!record || formState.readonly"
          :options="resourceSubTypeOptions()"
        />
      </div>

      <div>
        <div class="mb-1 text-sm">
          {{ $t('tb.javascriptLibrary.fields.title') }}
          <span class="text-destructive">*</span>
        </div>
        <Input
          size="large"
          v-model:value="formState.title"
          allow-clear
          :disabled="formState.readonly"
          :placeholder="$t('tb.javascriptLibrary.fields.title')"
        />
      </div>

      <!-- EXTENSION:上传 .js 文件 -->
      <div v-if="formState.resourceSubType !== ResourceSubType.MODULE">
        <div class="mb-1 text-sm">
          {{ $t('tb.javascriptLibrary.fields.file') }}
        </div>
        <Upload.Dragger
          :accept="JS_ACCEPT"
          :max-count="1"
          :disabled="formState.readonly"
          :show-upload-list="false"
          :before-upload="handleBeforeUpload"
        >
          <p class="flex justify-center text-3xl text-gray-400">
            <IconifyIcon icon="lucide:upload-cloud" />
          </p>
          <p class="mt-2 text-sm">
            {{
              record
                ? $t('tb.javascriptLibrary.upload.replaceTip')
                : $t('tb.javascriptLibrary.upload.dragTip')
            }}
          </p>
        </Upload.Dragger>
        <div
          v-if="formState.file?.name || formState.existingFileName"
          class="bg-muted mt-2 flex items-center gap-2 rounded px-3 py-1.5 text-sm"
        >
          <IconifyIcon icon="lucide:file-code" class="shrink-0" />
          {{ formState.file?.name ?? formState.existingFileName }}
        </div>
      </div>

      <!-- MODULE:内联编辑 JS 代码 -->
      <div v-else>
        <div class="mb-1 flex items-center justify-between">
          <span class="text-sm">
            {{ $t('tb.javascriptLibrary.fields.content') }}
            <span class="text-destructive">*</span>
          </span>
          <Upload
            v-if="!formState.readonly"
            :accept="JS_ACCEPT"
            :max-count="1"
            :show-upload-list="false"
            :before-upload="handleImportContent"
          >
            <span
              class="text-primary inline-flex cursor-pointer items-center gap-1 text-xs hover:underline"
            >
              <IconifyIcon icon="lucide:file-up" />
              {{ $t('tb.javascriptLibrary.upload.importFromFile') }}
            </span>
          </Upload>
        </div>
        <Input.TextArea
          v-model:value="formState.content"
          :rows="16"
          :disabled="formState.readonly"
          class="font-mono"
          spellcheck="false"
          :placeholder="$t('tb.javascriptLibrary.upload.contentPlaceholder')"
        />
      </div>
    </div>
  </Modal>
</template>
