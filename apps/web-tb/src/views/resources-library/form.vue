<script lang="ts" setup>
import type { ResourceInfo } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { saveResourceApi } from '#/api';
import { RESOURCE_TYPE_OPTIONS } from '#/constants';

defineOptions({
  name: 'ResourceLibraryFormModel',
});
const emits = defineEmits(['success']);

const record = ref<null | ResourceInfo>(null);

const [Form, formApi] = useVbenForm({
  schema: [
    {
      label: $t('资源类型'),
      fieldName: 'resourceType',
      component: 'Select',
      componentProps: {
        options: RESOURCE_TYPE_OPTIONS,
        style: { width: '100%' },
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
  ],
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  title: `${$t('添加资源')}`,
  confirmText: `${$t('page.submit.title')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    if (isOpen) {
      reset();
      const { data } = modalApi.getData<Record<string, any>>();
      if (data) {
        record.value = data;
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

async function onSubmit(values: Record<string, any>) {
  message.loading({
    content: `${$t('page.submit.loading')}`,
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    modalApi.lock();
    const res = await saveResourceApi({ ...values });
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
  <Modal class="w-1/2">
    <Form />
  </Modal>
</template>
