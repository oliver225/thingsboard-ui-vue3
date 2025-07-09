<script lang="ts" setup>
import type { ResourceApi } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { uploadImageApi } from '#/api';

defineOptions({
  name: 'ImageFormModel',
});
const emits = defineEmits(['success']);

const record = ref<null | ResourceApi.ResourceInfo>(null);

const [Form, formApi] = useVbenForm({
  schema: [
    {
      label: $t('图像'),
      fieldName: 'file',
      component: 'Upload',
      componentProps: {
        accept: 'image/*',
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
      defaultValue: 'IMAGE',
    },

    {
      label: $t('名称'),
      fieldName: 'title',
      component: 'Input',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
  ],
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
});

const [UploadModal, modalApi] = useVbenModal({
  title: `${$t('上传图像')}`,
  confirmText: `${$t('上传')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    reset();
    if (isOpen) {
      // const { data, id } = modalApi.getData<Record<string, any>>();
      // if (id) {
      //   record.value = await getTenantInfoByIdApi(id);
      // } else if (data) {
      //   record.value = data;
      // }
      // if (record.value) {
      //   record.value.areaList = [
      //     record.value.state || '',
      //     record.value.city || '',
      //     record.value.country || '',
      //   ];
      //   formApi.setValues(record.value);
      // }
      formApi.setValues({});
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
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('loadend', () =>
        resolve(reader.result as string),
      );
      reader.addEventListener('error', () => reject(new Error('读取文件失败')));
      reader.readAsDataURL(file);
    });
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

    const res = await uploadImageApi(
      values.file[0].originFileObj,
      values.title,
      values.imageSubType,
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
  <UploadModal class="w-1/2">
    <Form class="mr-8" />
  </UploadModal>
</template>
