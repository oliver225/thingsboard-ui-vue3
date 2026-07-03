<script lang="ts" setup>
import type { Customer } from '#/api/tb/customer';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useCascaderAreaData } from '@vant/area-data';
import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCustomerById, saveCustomer } from '#/api/tb/customer';
import { PHONE_PATTERN } from '#/constants';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<Customer | null>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema: [
    {
      component: 'VbenInput',
      fieldName: 'title',
      label: $t('tb.customer.fields.title'),
      rules: z
        .string()
        .min(1, { message: $t('tb.customer.validation.titleRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.customer.fields.description'),
    },
    {
      component: 'Cascader',
      componentProps: {
        fieldNames: { children: 'children', label: 'text', value: 'value' },
        options: useCascaderAreaData(),
        style: { width: '100%' },
      },
      fieldName: 'region',
      label: $t('tb.customer.fields.region'),
    },
    {
      component: 'VbenInput',
      fieldName: 'zip',
      label: $t('tb.customer.fields.zip'),
    },
    {
      component: 'VbenInput',
      fieldName: 'address',
      label: $t('tb.customer.fields.address'),
    },
    {
      component: 'VbenInput',
      fieldName: 'address2',
      label: $t('tb.customer.fields.address2'),
    },
    {
      component: 'PhoneInput',
      fieldName: 'phone',
      label: $t('tb.customer.fields.phone'),
      rules: z
        .string()
        .optional()
        .refine((value) => !value || PHONE_PATTERN.test(value), {
          message: $t('tb.customer.validation.phoneFormatTip'),
        }),
    },
    {
      component: 'VbenInput',
      fieldName: 'email',
      label: $t('tb.customer.fields.email'),
      rules: z
        .string()
        .email({ message: $t('tb.customer.validation.emailInvalid') })
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

    const customer: Customer = {
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
    };

    modalApi.lock();
    try {
      await saveCustomer(customer);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { customerId } = modalApi.getData<{ customerId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: customerId
        ? $t('tb.customer.actions.edit')
        : $t('tb.customer.actions.create'),
    });
    if (customerId) {
      const customer = await getCustomerById(customerId);
      record.value = customer;
      await formApi.setValues({
        address: customer.address,
        address2: customer.address2,
        description: customer.additionalInfo?.description,
        email: customer.email,
        phone: customer.phone,
        region: [customer.country, customer.state, customer.city],
        title: customer.title,
        zip: customer.zip,
      });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
