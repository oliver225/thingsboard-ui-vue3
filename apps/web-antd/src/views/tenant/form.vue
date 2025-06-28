<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { useVbenModal } from '@vben/common-ui';
import { EntityType } from '@vben/constants';
import { $t } from '@vben/locales';

import { useQuery } from '@tanstack/vue-query';
import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { tenantSaveApi } from '#/api';
import { tenantProfileInfoListApi } from '#/api/tb/tenantProfile';

defineOptions({
  name: 'TenantFormModel',
});

const { promise: fetchtenantProfileInfoFn } = useQuery({
  experimental_prefetchInRender: true,
  queryFn: () =>
    tenantProfileInfoListApi({
      pageSize: 1000,
      page: 0,
      sortProperty: 'name',
      sortOrder: 'ASC',
    }).then((res) => res.data),
  queryKey: ['tenantProfileInfoListApi'],
  refetchOnMount: 'always',
  staleTime: 1000 * 60 * 5,
});

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  schema: [
    {
      label: $t('租户名称'),
      fieldName: 'title',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'tenantProfileId.entityType',
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['tenantProfileId.entityType'],
      },
      defaultValue: EntityType.TENANT_PROFILE,
    },
    {
      label: $t('租户配置'),
      fieldName: 'tenantProfileId.id',
      component: 'ApiSelect',
      componentProps: {
        api: async () => await fetchtenantProfileInfoFn.value,
        showSearch: true,
        immediate: true,
        class: 'w-full',
        filterOption: (input: string, option: Recordable<any>) => {
          return option.label.toLowerCase().includes(input.toLowerCase());
        },

        labelField: 'name',
        valueField: 'id.id',
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('手机号码'),
      fieldName: 'phone',
      component: 'Input',
      rules: z.string().regex(/^1[3-9]\d{9}$/, {
        message: $t('请输入正确的手机号码'),
      }),
    },
    {
      label: $t('邮政编码'),
      fieldName: 'zip',
      component: 'Input',
    },
    {
      label: $t('邮箱地址'),
      fieldName: 'email',
      component: 'Input',
      rules: z
        .string()
        .email({
          message: $t('请输入正确的邮箱地址'),
        })
        .optional(),
      formItemClass: 'col-span-2',
    },
    {
      label: $t('详细地址'),
      fieldName: 'address',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('备用地址'),
      fieldName: 'address2',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      formItemClass: 'col-span-2',
    },

    {
      label: $t('描述信息'),
      fieldName: 'additionalInfo.description',
      component: 'Textarea',
      formItemClass: 'col-span-2',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  title: `${$t('page.tenant.addTenant')}`,
  overlayBlur: 5,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { values } = modalApi.getData<Record<string, any>>();
      if (values) {
        formApi.setValues(values);
      }
    }
  },
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
    // modalApi.close();
  },
});

async function onSubmit(values: Record<string, any>) {
  message.loading({
    content: '正在提交中...',
    duration: 0,
    key: 'is-form-submitting',
  });
  try {
    modalApi.lock();
    const res = await tenantSaveApi(values);
    modalApi.close();
    message.success({
      content: `提交成功!`,
      duration: 2,
      key: 'is-form-submitting',
    });
  } catch (error: any) {
    message.error({
      content: error.message || '提交失败，请稍后再试',
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
