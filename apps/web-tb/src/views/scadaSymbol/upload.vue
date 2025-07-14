<script lang="ts" setup>
import type { ResourceApi } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { blobToBase64 } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { updateImageApi, uploadImageApi } from '#/api';

defineOptions({
  name: 'ScadaSymbolUploadModel',
});
const emits = defineEmits(['success']);

const record = ref<null | ResourceApi.Resource>(null);

const [Form, formApi] = useVbenForm({
  schema: [
    {
      label: $t('图像'),
      fieldName: 'file',
      component: 'Upload',
      componentProps: {
        accept: '.svg,.svgz',
        customRequest: handleFileUpload,
        maxCount: 1,
        multiple: false,
        showUploadList: true,
        listType: 'picture-card',
      },
      renderComponentContent: () => {
        return {
          default: () => $t('点击上传图像'),
        };
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },

    {
      fieldName: 'imageSubType',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['imageSubType'],
      },
      defaultValue: 'SCADA_SYMBOL',
    },

    {
      label: $t('名称'),
      fieldName: 'title',
      component: 'Input',
      dependencies: {
        if: () => record.value?.resourceKey === undefined,
        triggerFields: ['title'],
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
  ],
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
});

const [UploadModal, modalApi] = useVbenModal({
  title: `${$t('上传SCADA 符号')}`,
  confirmText: `${$t('上传')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    if (isOpen) {
      reset();
      const data = modalApi.getData<Record<string, any>>();
      if (data.resourceKey) {
        record.value = data as ResourceApi.Resource;
        formApi.setValues({ file: [{ originFileObj: record.value.data }] });
        modalApi.setState({
          confirmText: `${$t('更新')} `,
        });
      } else {
        formApi.setValues({});
      }
    }
    modalApi.setState({ loading: false });
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

async function handleFileUpload({ file, onError, onProgress, onSuccess }: any) {
  try {
    onProgress?.({ percent: 0 });
    formApi.setValues({ title: file.name });
    const base64 = await blobToBase64(file);
    onProgress?.({ percent: 100 });
    onSuccess?.(base64, file);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

async function onSubmit(values: Record<string, any>) {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    modalApi.lock();
    if (record.value?.resourceKey === undefined) {
      // 新建上传图片
      const res = await uploadImageApi(
        values.file[0].originFileObj,
        values.title,
        values.imageSubType,
      );
      emits('success', res);
    } else {
      // 更新图片
      await updateImageApi(
        record.value.imageType || 'tenant',
        record.value.resourceKey,
        values.file[0].originFileObj,
      );
      emits('success', values.file[0].originFileObj);
    }

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
  <UploadModal class="w-1/2">
    <Form class="mr-8" />
  </UploadModal>
</template>
