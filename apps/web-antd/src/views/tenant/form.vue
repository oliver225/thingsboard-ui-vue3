<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { TenantApi } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { EntityType } from '@vben/constants';
import { $t } from '@vben/locales';

import { useQuery } from '@tanstack/vue-query';
import { useCascaderAreaData } from '@vant/area-data';
import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getTenantInfoByIdApi,
  tenantProfileInfoListApi,
  tenantSaveApi,
} from '#/api';

defineOptions({
  name: 'TenantFormModel',
});
const emits = defineEmits(['success']);

const record = ref<null | TenantApi.TenantInfo>(null);

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
  schema: [
    {
      label: $t('tenant.form.title'),
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
      label: $t('tenant.form.tenantProfileName'),
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
      label: $t('tenant.form.phone'),
      fieldName: 'phone',
      component: 'Input',
      rules: z.string().regex(/^1[3-9]\d{9}$/, {
        message: $t('请输入正确的手机号码'),
      }),
    },
    {
      label: $t('tenant.form.zip'),
      fieldName: 'zip',
      component: 'Input',
    },
    {
      label: $t('tenant.form.email'),
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
      label: $t('tenant.form.area'),
      fieldName: 'areaList',
      component: 'Cascader',
      componentProps: {
        options: useCascaderAreaData(),
        fieldNames: { label: 'text', value: 'value', children: 'children' },
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('tenant.form.address'),
      fieldName: 'address',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      label: $t('tenant.form.address2'),
      fieldName: 'address2',
      component: 'Input',
      componentProps: {
        maxlength: 200,
      },
      formItemClass: 'col-span-2',
    },

    {
      label: $t('tenant.form.description'),
      fieldName: 'additionalInfo.description',
      component: 'Textarea',
      formItemClass: 'col-span-2',
    },
  ],
  handleSubmit: onSubmit,
  wrapperClass: 'grid-cols-2',
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  title: `${$t('tenant.button.addTenant')}`,
  confirmText: `${$t('page.submit.title')}`,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    reset();
    if (isOpen) {
      const { data, id } = modalApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getTenantInfoByIdApi(id);
      } else if (data) {
        record.value = data;
      }
      if (record.value) {
        record.value.areaList = [
          record.value.state || '',
          record.value.city || '',
          record.value.country || '',
        ];
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
    const areaList = values.areaList;
    const data = {
      ...record.value,
      ...values,
      state: areaList[0],
      city: areaList[1],
      country: areaList[2],
    };
    const res = await tenantSaveApi(data);
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
