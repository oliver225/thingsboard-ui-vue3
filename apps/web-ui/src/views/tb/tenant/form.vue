<script lang="ts" setup>
import type { Tenant } from '#/api/tb/tenant';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useCascaderAreaData } from '@vant/area-data';
import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getTenantById, saveTenant } from '#/api/tb/tenant';
import { getTenantProfileInfos } from '#/api/tb/tenant-profile';
import { PHONE_PATTERN } from '#/constants';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | Tenant>(null);

async function loadTenantProfileOptions() {
  const pageData = await getTenantProfileInfos({ page: 0, pageSize: 100 });
  return pageData.data.map((profile) => ({
    label: profile.name,
    value: profile.id.id,
  }));
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    colon: true,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('tb.tenant.fields.title'),
      rules: z
        .string()
        .min(1, { message: $t('tb.tenant.validation.titleRequired') }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        showSearch: true,
        style: { width: '100%' },
        api: loadTenantProfileOptions,
      },
      fieldName: 'tenantProfileId',
      label: $t('tb.tenant.fields.tenantProfile'),
      rules: z
        .string()
        .min(1, { message: $t('tb.tenant.validation.tenantProfileRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.tenant.fields.description'),
    },
    {
      component: 'Cascader',
      componentProps: {
        options: useCascaderAreaData(),
        fieldNames: { label: 'text', value: 'value', children: 'children' },
        style: { width: '100%' },
      },
      fieldName: 'region',
      label: $t('tb.tenant.fields.region'),
    },
    {
      component: 'VbenInput',
      fieldName: 'zip',
      label: $t('tb.tenant.fields.zip'),
    },
    {
      component: 'VbenInput',
      fieldName: 'address',
      label: $t('tb.tenant.fields.address'),
    },
    {
      component: 'VbenInput',
      fieldName: 'address2',
      label: $t('tb.tenant.fields.address2'),
    },

    {
      component: 'PhoneInput',
      fieldName: 'phone',
      label: $t('tb.tenant.fields.phone'),
      rules: z
        .string()
        .optional()
        .refine((value) => !value || PHONE_PATTERN.test(value), {
          message: $t('tb.tenant.validation.phoneFormatTip'),
        }),
    },
    {
      component: 'VbenInput',
      fieldName: 'email',
      label: $t('tb.tenant.fields.email'),
      rules: z
        .string()
        .email({ message: $t('tb.tenant.validation.emailInvalid') })
        .optional()
        .or(z.literal('')),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    const [country, state, city] = values.region || [
      undefined,
      undefined,
      undefined,
    ];

    const tenant: Tenant = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: values.description,
      },
      address: values.address,
      address2: values.address2,
      city,
      country,
      email: values.email,
      phone: values.phone,
      state,
      title: values.title,
      zip: values.zip,
      tenantProfileId: values.tenantProfileId
        ? {
            entityType: EntityType.TENANT_PROFILE,
            id: values.tenantProfileId,
          }
        : undefined,
    };

    modalApi.lock();
    try {
      await saveTenant(tenant);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { tenantId } = modalApi.getData<{ tenantId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: tenantId
        ? $t('tb.tenant.actions.edit')
        : $t('tb.tenant.actions.create'),
    });
    if (tenantId) {
      const tenant = await getTenantById(tenantId);
      record.value = tenant;
      await formApi.setValues({
        address: tenant.address,
        address2: tenant.address2,
        region: [tenant.country, tenant.state, tenant.city],
        description: tenant.additionalInfo?.description,
        email: tenant.email,
        phone: tenant.phone,
        tenantProfileId: tenant.tenantProfileId?.id,
        title: tenant.title,
        zip: tenant.zip,
      });
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
    <Form />
  </Modal>
</template>
