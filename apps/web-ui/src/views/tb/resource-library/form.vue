<script lang="ts" setup>
import { reactive, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input, message, Select, Upload } from 'antdv-next';

import { uploadResource } from '#/api/tb/resource';
import { ResourceType, resourceTypeOptions } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const formState = reactive<any>({
  files: [],
  resourceType: ResourceType.LWM2M_MODEL,
  title: '',
});

/** 各资源类型上传文件的扩展名限制(用于 <Upload accept>,GENERAL 不限制) */
const RESOURCE_TYPE_ACCEPT: Partial<Record<ResourceType, string>> = {
  [ResourceType.LWM2M_MODEL]: '.xml,.xslt,.xbl,.xsl',
  [ResourceType.PKCS_12]: '.p12,.pfx',
};
function getResourceAccept(type?: ResourceType): string {
  if (!type) return '';
  return RESOURCE_TYPE_ACCEPT[type] ?? '';
}

/** 资源类型切换:清空已选文件与自动标题 */
watch(
  () => formState.resourceType,
  () => {
    formState.files = [];
    if (formState.resourceType === ResourceType.LWM2M_MODEL) {
      formState.title = '';
    }
  },
);

/** 选择文件:拦截自动上传,仅记录文件 */
function handleBeforeUpload(file: File) {
  if (formState.resourceType === ResourceType.LWM2M_MODEL) {
    formState.files = [...formState.files, file];
  } else {
    formState.files = [file];
    if (!formState.title) {
      formState.title = file.name.replace(/\.[^.]+$/, '');
    }
  }
  return false;
}

function removeFile(index: number) {
  formState.files = formState.files.filter((_: any, i: number) => i !== index);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (
      formState.resourceType !== ResourceType.LWM2M_MODEL &&
      !formState.title.trim()
    ) {
      message.error($t('tb.resourceLibrary.validation.titleRequired'));
      return;
    }
    if (formState.files.length === 0) {
      message.error($t('tb.resourceLibrary.validation.fileRequired'));
      return;
    }

    modalApi.lock();
    try {
      if (formState.resourceType === ResourceType.LWM2M_MODEL) {
        // LwM2M 模型:逐个上传,标题由模型解析
        for (const file of formState.files) {
          await uploadResource({ file, resourceType: formState.resourceType });
        }
      } else {
        await uploadResource({
          file: formState.files[0] as File,
          resourceType: formState.resourceType,
          title: formState.title.trim(),
        });
      }
      message.success($t('tb.resourceLibrary.uploadSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    formState.resourceType = ResourceType.LWM2M_MODEL;
    formState.title = '';
    formState.files = [];
    modalApi.setState({ title: $t('tb.resourceLibrary.actions.add') });
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
    <div class="flex flex-col gap-4 p-1">
      <div>
        <div class="mb-1 text-sm">
          {{ $t('tb.resourceLibrary.fields.resourceType') }}
        </div>
        <Select
          v-model:value="formState.resourceType"
          size="large"
          class="w-full"
          :options="resourceTypeOptions()"
        />
      </div>

      <div v-if="formState.resourceType !== ResourceType.LWM2M_MODEL">
        <div class="mb-1 text-sm">
          {{ $t('tb.resourceLibrary.fields.title') }}
          <span class="text-destructive">*</span>
        </div>
        <Input
          size="large"
          v-model:value="formState.title"
          allow-clear
          :placeholder="$t('tb.resourceLibrary.upload.titlePlaceholder')"
        />
      </div>

      <div>
        <div class="mb-1 text-sm">
          {{ $t('tb.resourceLibrary.fields.file') }}
        </div>
        <Upload.Dragger
          :accept="getResourceAccept(formState.resourceType)"
          :multiple="formState.resourceType === ResourceType.LWM2M_MODEL"
          :max-count="
            formState.resourceType === ResourceType.LWM2M_MODEL ? undefined : 1
          "
          :show-upload-list="false"
          :before-upload="handleBeforeUpload"
        >
          <p class="flex justify-center text-3xl text-gray-400">
            <IconifyIcon icon="lucide:upload-cloud" />
          </p>
          <p class="mt-2 text-sm">
            {{ $t('tb.resourceLibrary.upload.dragTip') }}
          </p>
        </Upload.Dragger>
        <!-- 已选文件 -->
        <div v-if="formState.files.length > 0" class="mt-2 flex flex-col gap-1">
          <div
            v-for="(file, index) in formState.files"
            :key="`${file.name}-${index}`"
            class="bg-muted flex items-center justify-between rounded px-3 py-1.5 text-sm"
          >
            <span class="flex items-center gap-2 truncate">
              <IconifyIcon icon="lucide:file" class="shrink-0" />
              {{ file.name }}
            </span>
            <IconifyIcon
              icon="lucide:x"
              class="text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
              @click="removeFile(index as number)"
            />
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
