<script lang="ts" setup>
import type { TenantProfile } from '#/api';

import { h, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { getTenantProfileByIdApi, saveTenantProfileApi } from '#/api';

defineOptions({
  name: 'TenantProfileFormModel',
});
const emits = defineEmits(['success']);

const record = ref<null | TenantProfile>(null);

const [Form, formApi] = useVbenForm({
  schema: [
    {
      label: $t('tenantProfile.form.name'),
      fieldName: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: '',
      fieldName: 'isolatedTbRuleEngine',
      component: 'Checkbox',
      labelWidth: 60,
      renderComponentContent: () => {
        return {
          default: () =>
            h('div', [
              h(
                'p',
                { class: 'text-sm font-medium' },
                '使用独立的规则引擎服务',
              ),
              h(
                'p',
                { class: 'ml-4 text-xs text-muted-foreground' },
                '每个独立租户需要单独的规则引擎微服务',
              ),
            ]),
        };
      },
      formItemClass: 'col-span-2',
    },
    {
      label: $t('tenantProfile.form.description'),
      fieldName: 'description',
      component: 'Textarea',
      formItemClass: 'col-span-2',
    },
  ],
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  title: `${$t('tenantProfile.button.add')}`,
  confirmText: `${$t('page.submit.title')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    reset();
    if (isOpen) {
      const { data, id } = modalApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getTenantProfileByIdApi(id);
      } else if (data) {
        record.value = data;
      }
      if (record.value) {
        formApi.setValues(record.value);
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
    const data = {
      ...record.value,
      ...values,
    };
    const res = await saveTenantProfileApi(data);
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
