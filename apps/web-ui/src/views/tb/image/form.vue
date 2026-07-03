<script lang="ts" setup>
import type { TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input, message, Upload } from 'antdv-next';

import {
  getImageInfo,
  updateImage,
  updateImageInfo,
  uploadImage,
} from '#/api/tb/image';
import { SYS_TENANT_ID } from '#/constants';
import { $t } from '#/locales';
import { fileToBase64 } from '#/utils/file.js';

import ImageThumbnail from './components/image-thumbnail.vue';

const emit = defineEmits<{ success: [] }>();

/** 已加载的图片实体:非 null 即编辑态,作用域/资源键直接取自它 */
const record = ref<null | TbResourceInfo>(null);

const formState = reactive<any>({
  file: undefined,
  previewUrl: '',
  title: '',
});

const scope = computed(() => {
  const { tenantId } = record?.value || {};
  return (
    !tenantId?.id || tenantId.id === SYS_TENANT_ID ? 'system' : 'tenant'
  ) as ResourceScope;
});

/** 选择文件:拦截自动上传,仅记录文件并生成本地预览 */
async function handleBeforeUpload(target: File) {
  formState.file = target;
  if (!formState.title) {
    formState.title = target.name;
  }
  try {
    formState.previewUrl = await fileToBase64(target);
  } catch {
    formState.previewUrl = '';
  }
  return false;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!record.value && !formState.file) {
      message.error($t('tb.images.validation.fileRequired'));
      return;
    }
    if (!formState.title.trim()) {
      message.error($t('tb.images.validation.titleRequired'));
      return;
    }

    modalApi.lock();
    try {
      if (record.value?.resourceKey) {
        if (formState.file) {
          await updateImage(
            scope.value,
            record.value?.resourceKey,
            formState.file,
          );
        }
        if (formState.title !== record.value.title) {
          await updateImageInfo(scope.value, record.value?.resourceKey, {
            ...record.value,
            title: formState.title,
          } as unknown as TbResourceInfo);
        }
        message.success($t('tb.images.updateSuccess'));
      } else if (formState.file) {
        await uploadImage(formState.file, formState.title);
        message.success($t('tb.images.uploadSuccess'));
      }
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
      modalApi.getData<{ resourceKey?: string; scope?: ResourceScope }>() ?? {};
    record.value = null;
    formState.title = '';
    formState.file = undefined;
    formState.previewUrl = '';
    modalApi.setState({
      title: data.resourceKey
        ? $t('tb.images.actions.edit')
        : $t('tb.images.actions.upload'),
    });
    if (data.scope && data.resourceKey) {
      const info = await getImageInfo(data.scope, data.resourceKey);
      record.value = info;
      formState.title = info.title ?? '';
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
    <div class="flex flex-col gap-4 p-1">
      <div class="flex items-stretch gap-4">
        <!-- 当前 / 新选图片预览 -->
        <div
          v-if="formState.previewUrl || record"
          class="bg-muted h-32 w-32 shrink-0 overflow-hidden rounded border"
        >
          <img
            v-if="formState.previewUrl"
            :src="formState.previewUrl"
            class="h-full w-full object-contain"
            alt="preview"
          />
          <ImageThumbnail
            v-else
            class="h-full w-full"
            :resource-key="record?.resourceKey"
            :preview="false"
            :scope="scope"
          />
        </div>
        <!-- 拖拽上传区 -->
        <Upload.Dragger
          class="flex-1"
          accept="image/*"
          :max-count="1"
          :show-upload-list="false"
          :before-upload="handleBeforeUpload"
        >
          <p class="flex justify-center text-3xl text-gray-400">
            <IconifyIcon icon="lucide:upload-cloud" />
          </p>
          <p class="mt-2 text-sm">
            {{
              record
                ? $t('tb.images.upload.replaceTip')
                : $t('tb.images.upload.dragTip')
            }}
          </p>
        </Upload.Dragger>
      </div>

      <div>
        <div class="mb-1 text-sm">{{ $t('tb.images.upload.title') }}</div>
        <Input
          size="large"
          v-model:value="formState.title"
          allow-clear
          :placeholder="$t('tb.images.upload.title')"
        />
      </div>
    </div>
  </Modal>
</template>
