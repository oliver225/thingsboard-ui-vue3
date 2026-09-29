<script lang="ts" setup>
import type { Customer } from '#/api/tb/customer';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useCascaderAreaData } from '@vant/area-data';
import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCustomerById, saveCustomer } from '#/api/tb/customer';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<Customer | null>(null);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'organization',
        placeholder: $t('customer.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('customer.fields.title'),
      formItemClass: 'sm:col-span-2',
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('customer.validation.titleRequired') })
        .max(255, { message: $t('customer.validation.titleMaxLength') }),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('customer.features.form.descriptionPlaceholder'),
      },
      fieldName: 'description',
      label: $t('customer.fields.description'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'email',
        type: 'email',
        placeholder: 'name@example.com',
      },
      fieldName: 'email',
      label: $t('customer.fields.email'),
      rules: z
        .string()
        .email({ message: $t('customer.validation.emailInvalid') })
        .optional()
        .or(z.literal('')),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'tel',
        type: 'tel',
        placeholder: '+86 138 0013 8000',
      },
      fieldName: 'phone',
      label: $t('customer.fields.phone'),
      rules: z
        .string()
        .nullish()
        .refine(
          (value) => {
            if (!value) return true;
            // 保留国内号码及国际号码的常见分隔符，至少包含 5 位数字。
            return (
              /^[+\d][\d ()-]{4,24}$/.test(value) &&
              value.replaceAll(/\D/g, '').length >= 5
            );
          },
          { message: $t('customer.validation.phoneFormatTip') },
        ),
    },
    {
      component: 'Cascader',
      componentProps: {
        options: useCascaderAreaData(),
        allowClear: true,
        showSearch: true,
        placeholder: $t('customer.features.form.regionPlaceholder'),
        fieldNames: { label: 'text', value: 'value', children: 'children' },
      },
      fieldName: 'region',
      label: $t('customer.fields.region'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'postal-code',
        placeholder: $t('customer.features.form.zipPlaceholder'),
      },
      fieldName: 'zip',
      label: $t('customer.fields.zip'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'address-line1',
        placeholder: $t('customer.features.form.addressPlaceholder'),
      },
      fieldName: 'address',
      label: $t('customer.fields.address'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'address-line2',
        placeholder: $t('customer.features.form.address2Placeholder'),
      },
      fieldName: 'address2',
      label: $t('customer.fields.address2'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ customerId?: string }>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();
    const [country, state, city] = formValues.region ?? [];

    const customer: Customer = {
      ...record.value,
      additionalInfo: {
        ...record.value?.additionalInfo,
        description: formValues.description,
      },
      address: formValues.address,
      address2: formValues.address2,
      city,
      country,
      email: formValues.email,
      phone: formValues.phone,
      state,
      title: formValues.title.trim(),
      zip: formValues.zip,
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
    const { customerId } = modalApi.getData() ?? {};
    record.value = null;
    await formApi.reset();
    modalApi.setState({
      title: customerId
        ? $t('customer.actions.edit')
        : $t('customer.actions.create'),
    });
    modalApi.lock();
    try {
      if (customerId) {
        const customer = await getCustomerById(customerId);
        record.value = customer;
        await formApi.setValues({
          description: customer.additionalInfo?.description,
          title: customer.title,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          address2: customer.address2,
          region: [customer.country, customer.state, customer.city],
          zip: customer.zip,
        });
      }
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form />
  </Modal>
</template>
