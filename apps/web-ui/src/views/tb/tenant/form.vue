<script lang="ts" setup>
import type { Tenant } from '#/api/tb/tenant';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useCascaderAreaData } from '@vant/area-data';
import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getTenantById, saveTenant } from '#/api/tb/tenant';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | Tenant>(null);

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
        placeholder: $t('tenant.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('tenant.fields.title'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('tenant.validation.titleRequired') }),
    },
    {
      component: 'EntityInput',
      componentProps: {
        showSearch: true,
        placeholder: $t('tenant.validation.tenantProfileRequired'),
        entityType: 'TENANT_PROFILE',
      },
      fieldName: 'tenantProfileId',
      defaultValue: '',
      label: $t('tenant.fields.tenantProfile'),
      rules: z
        .string()
        .min(1, { message: $t('tenant.validation.tenantProfileRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('tenant.features.form.descriptionPlaceholder'),
      },
      fieldName: 'description',
      label: $t('tenant.fields.description'),
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
      label: $t('tenant.fields.email'),
      rules: z
        .string()
        .email({ message: $t('tenant.validation.emailInvalid') })
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
      label: $t('tenant.fields.phone'),
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
          { message: $t('tenant.validation.phoneFormatTip') },
        ),
    },
    {
      component: 'Cascader',
      componentProps: {
        options: useCascaderAreaData(),
        allowClear: true,
        showSearch: true,
        placeholder: $t('tenant.features.form.regionPlaceholder'),
        fieldNames: { label: 'text', value: 'value', children: 'children' },
      },
      fieldName: 'region',
      label: $t('tenant.fields.region'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'postal-code',
        placeholder: $t('tenant.features.form.zipPlaceholder'),
      },
      fieldName: 'zip',
      label: $t('tenant.fields.zip'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'address-line1',
        placeholder: $t('tenant.features.form.addressPlaceholder'),
      },
      fieldName: 'address',
      label: $t('tenant.fields.address'),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenInput',
      componentProps: {
        autocomplete: 'address-line2',
        placeholder: $t('tenant.features.form.address2Placeholder'),
      },
      fieldName: 'address2',
      label: $t('tenant.fields.address2'),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ tenantId?: string }>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();
    const [country, state, city] = formValues.region ?? [];

    const tenant: Tenant = {
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
      tenantProfileId: formValues.tenantProfileId
        ? {
            entityType: EntityType.TENANT_PROFILE,
            id: formValues.tenantProfileId,
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
    const { tenantId } = modalApi.getData() ?? {};
    record.value = null;
    await formApi.reset();
    modalApi.setState({
      title: tenantId ? $t('tenant.actions.edit') : $t('tenant.actions.create'),
    });
    modalApi.lock();
    try {
      if (tenantId) {
        const tenant = await getTenantById(tenantId);
        record.value = tenant;
        await formApi.setValues({
          description: tenant.additionalInfo?.description,
          tenantProfileId: tenant.tenantProfileId?.id,
          title: tenant.title,
          email: tenant.email,
          phone: tenant.phone,
          address: tenant.address,
          address2: tenant.address2,
          region: [tenant.country, tenant.state, tenant.city],
          zip: tenant.zip,
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
