<script lang="ts" setup>
import type { Resource } from '#/api/core/resources-library';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { downloadFileFromBlob } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { useBase64 } from '@vueuse/core';
import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  downloadImageApi,
  getImageInfoApi,
  imagePreviewApi,
  updateImageInfoApi,
} from '#/api';
import { Authority } from '#/constants';
import { convertBytesToSize } from '#/utils';

import Embed from './embed.vue';
import Upload from './upload.vue';

defineOptions({
  name: 'ImageFormModel',
});
const emits = defineEmits(['success']);

const { hasAccessByCodes } = useAccess();

const record = ref<null | Resource>(null);

const editable = computed(
  () =>
    !(
      hasAccessByCodes([Authority.TENANT_ADMIN]) &&
      record.value?.imageType === 'system'
    ),
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      label: $t('名称'),
      fieldName: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'preview',
    },
  ],
  handleSubmit: onSubmit,
  showDefaultActions: false,
});

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: Upload,
});
const [EmbedModal, embedModalApi] = useVbenModal({
  connectedComponent: Embed,
});

const [Modal, modalApi] = useVbenModal({
  title: `${$t('编辑图像')}`,
  confirmText: `${$t('page.submit.title')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    if (isOpen) {
      reset();
      const { imageType, resourceKey } =
        modalApi.getData<Record<string, any>>();
      if (imageType && resourceKey) {
        record.value = await getImageInfoApi(imageType, resourceKey);
        record.value.imageType = imageType;
        const { data, headers } = await imagePreviewApi(
          imageType,
          resourceKey,
          record.value.etag,
        );
        record.value.data = new Blob([data], { type: headers['content-type'] });
        record.value.preview = await useBase64(record.value.data).execute();
      }
      if (record.value) {
        formApi.setValues(record.value);
      }
    }
    modalApi.setState({ loading: false, showConfirmButton: editable.value });
  },

  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
  },
});

function reset() {
  formApi.resetForm();
  record.value = null;
}

async function handleDownload() {
  const result = await downloadImageApi(
    record.value?.imageType || 'tenant',
    record.value?.resourceKey || '',
    record.value?.etag,
  );

  downloadFileFromBlob({
    fileName: record.value?.resourceKey,
    source: result,
  });
}

function handleEmbedImage() {
  embedModalApi.setData({ ...record.value }).open();
}

function handleUpload() {
  uploadModalApi
    .setState({ title: `${$t('更新图像')}` })
    .setData({ ...record.value })
    .open();
}

async function handleSuccess(file: Blob | File) {
  const preview = await useBase64(file).execute();
  record.value = {
    ...record.value,
    data: file,
    preview,
  } as Resource;
}

async function onSubmit(values: Record<string, any>) {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    modalApi.lock();
    const data = {
      ...record.value,
      ...values,
    };
    const res = await updateImageInfoApi(
      record.value?.imageType || 'tenant',
      record.value?.resourceKey || '',
      data,
    );
    emits('success', res);
    modalApi.close();
    message.success({
      content: `${$t('page.submit.success')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || `${$t('page.submit.error')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } finally {
    modalApi.unlock();
  }
}
</script>
<template>
  <Modal class="w-1/3">
    <Form>
      <template #preview>
        <div class="w-full bg-gray-100 p-4">
          <div class="flex justify-between px-2 pb-4">
            <div class="flex space-x-6">
              <VbenIconButton
                v-tippy="{
                  content: `${$t('下载图像')}`,
                  theme: 'dark',
                }"
                @click="handleDownload()"
              >
                <IconifyIcon class="size-8" icon="mdi:download" />
              </VbenIconButton>
              <VbenIconButton
                v-tippy="{
                  content: `${$t('嵌入图像')}`,
                  theme: 'dark',
                }"
                @click="handleEmbedImage()"
              >
                <IconifyIcon class="size-8" icon="ant-design:code-outlined" />
              </VbenIconButton>
            </div>
            <Button v-if="editable" type="primary" @click="handleUpload">
              更新图像
            </Button>
          </div>
          <div class="h-96 w-full bg-white">
            <img class="img-content-clip" :src="record?.preview || ''" />
          </div>
          <div
            class="text-muted-foreground mt-2 flex items-center space-x-1 opacity-70"
          >
            <span>
              <span> {{ record?.descriptor?.width }}</span>
              <span class="mx-1">×</span>
              <span> {{ record?.descriptor?.height }}</span>
            </span>
            <span>│</span>
            <span>
              {{ convertBytesToSize(record?.descriptor?.size || 0) }}
            </span>
          </div>
        </div>
      </template>
    </Form>
    <EmbedModal />
    <UploadModal @success="handleSuccess" />
  </Modal>
</template>
