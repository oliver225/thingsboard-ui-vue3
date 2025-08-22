<script lang="ts" setup>
import type { DashboardInfo } from '#/api';
import type { UserInfo } from '#/types';

import { h, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getActivationLink,
  getUserByIdApi,
  saveUserApi,
  tenantDashboardList,
} from '#/api';
import { copyToClipboard } from '#/utils';

defineOptions({
  name: 'TenantAdminFormModel',
});
const emits = defineEmits(['success']);

const record = ref<null | UserInfo>(null);

const dashboardSelectOptions = ref<DashboardInfo[]>([]);

const [Form, formApi] = useVbenForm({
  schema: [
    {
      label: $t('tenant.form.email'),
      fieldName: 'email',
      component: 'Input',
      rules: z.string().email({
        message: $t('请输入正确的邮箱地址'),
      }),
      formItemClass: 'col-span-2',
    },
    {
      label: $t('用户名称'),
      fieldName: 'firstName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('用户昵称'),
      fieldName: 'lastName',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('tenant.form.phone'),
      fieldName: 'phone',
      component: 'Input',
      formItemClass: 'col-span-2',
      rules: z.string().regex(/^1[3-9]\d{9}$/, {
        message: $t('请输入正确的手机号码'),
      }),
    },
    {
      label: $t('默认面板'),
      fieldName: 'additionalInfo.defaultDashboardId',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: dashboardSelectOptions.value.map((item) => ({
          label: item.title,
          value: item.id.id,
        })),
        class: 'w-full',
      },
      dependencies: {
        if: () => !!record.value?.id?.id,
        triggerFields: ['additionalInfo'],
      },
    },
    {
      label: '',
      fieldName: 'additionalInfo.defaultDashboardFullscreen',
      component: 'Checkbox',
      defaultValue: false,
      hideLabel: true,
      renderComponentContent: () => {
        return {
          default: () => ['始终全屏'],
        };
      },
      dependencies: {
        if: () => !!record.value?.id?.id,
        triggerFields: ['additionalInfo'],
      },
    },
    {
      label: $t('首页仪表板'),
      fieldName: 'additionalInfo.homeDashboardId',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: dashboardSelectOptions.value.map((item) => ({
          label: item.title,
          value: item.id.id,
        })),
        class: 'w-full',
      },
      dependencies: {
        if: () => !!record.value?.id?.id,
        triggerFields: ['additionalInfo'],
      },
    },
    {
      label: '',
      fieldName: 'additionalInfo.homeDashboardHideToolbar',
      component: 'Checkbox',
      defaultValue: true,
      renderComponentContent: () => {
        return {
          default: () => ['隐藏首页仪表板工具栏'],
        };
      },
      hideLabel: true,
      dependencies: {
        if: () => !!record.value?.id?.id,
        triggerFields: ['additionalInfo'],
      },
    },

    {
      label: $t('tenant.form.description'),
      fieldName: 'additionalInfo.description',
      component: 'Textarea',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('激活方式'),
      fieldName: 'sendActivationMail',
      component: 'Select',
      formItemClass: 'col-span-2',
      defaultValue: false,
      componentProps: {
        options: [
          { label: '显示激活链接', value: false },
          { label: '发送激活邮件', value: true },
        ],
      },
      dependencies: {
        if: () => !record.value?.id?.id,
        triggerFields: ['sendActivationMail'],
      },
    },
  ],
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
});

const [Modal, modalApi] = useVbenModal({
  title: `${$t('添加用户')}`,
  confirmText: `${$t('page.submit.title')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    reset();
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      record.value = { ...data } as UserInfo;
      if (data?.id?.id) {
        record.value = await getUserByIdApi(data.id?.id);
        // 获取租户的Dashboard
        const result = await tenantDashboardList(
          {
            pageSize: 1000,
            page: 0,
            sortProperty: 'title',
            sortOrder: 'ASC',
          },
          record.value.tenantId.id,
        );
        dashboardSelectOptions.value = result.data || [];
      }
      formApi.setValues(record.value);
    }
    formApi.updateSchema([
      {
        fieldName: 'additionalInfo.defaultDashboardId',
        componentProps: {
          options: dashboardSelectOptions.value.map((item) => ({
            label: item.title,
            value: item.id.id,
          })),
        },
      },
      {
        fieldName: 'additionalInfo.homeDashboardId',
        componentProps: {
          options: dashboardSelectOptions.value.map((item) => ({
            label: item.title,
            value: item.id.id,
          })),
        },
      },
    ]);
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
  dashboardSelectOptions.value = [];
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
    const res = await saveUserApi(data, values.sendActivationMail);
    emits('success', res);
    if (!record.value?.id?.id && values.sendActivationMail === false) {
      const activationLink = await getActivationLink(res.id.id);
      confirm({
        content: h(
          'a',
          { href: activationLink, target: '_blank', class: 'text-blue-500' },
          `${activationLink}`,
        ),
        icon: 'success',
        title: '用户激活链接',
        cancelText: '确认',
        confirmText: '复制链接',
        beforeClose: ({ isConfirm }) => {
          if (isConfirm) {
            copyToClipboard(activationLink);
          }
          return true;
        },
      });
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
  <Modal class="w-1/3">
    <Form />
  </Modal>
</template>
