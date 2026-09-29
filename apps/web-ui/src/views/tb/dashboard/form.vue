<script lang="ts" setup>
import type { Dashboard } from '#/api/tb/dashboard';

import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getCustomers } from '#/api/tb/customer';
import {
  addDashboardCustomers,
  getDashboardById,
  saveDashboard,
} from '#/api/tb/dashboard';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const canManage = computed(() => hasAccessByRoles([Authority.TENANT_ADMIN]));
const record = ref<Dashboard | null>(null);
const isCreate = ref(false);
const assignmentFailed = ref(false);

async function loadCustomerOptions() {
  const customers = await loadAllPages((pageLink) =>
    getCustomers({ ...pageLink, sortProperty: 'title', sortOrder: 'ASC' }),
  );
  // Public 客户由公开/私有操作管理，不混入普通客户的分配列表。
  return customers
    .filter((customer) => customer.id?.id && !customer.additionalInfo?.isPublic)
    .map((customer) => ({ label: customer.title, value: customer.id?.id }));
}

const [Form, formApi] = useVbenForm<{
  title: string;
  description: string;
  assignedCustomerIds: string[];
  mobileHide: boolean;
  mobileOrder: null | number;
  image: null | string;
}>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  schema: [
    {
      component: 'VbenInput',
      componentProps: {
        maxlength: 255,
        placeholder: $t('dashboard.features.form.titlePlaceholder'),
      },
      defaultValue: '',
      fieldName: 'title',
      label: $t('dashboard.fields.title'),
      rules: z
        .string()
        .trim()
        .min(1, { message: $t('dashboard.validation.titleRequired') })
        .max(255, { message: $t('dashboard.validation.titleMaxLength') }),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: $t('dashboard.features.form.descriptionPlaceholder'),
      },
      defaultValue: '',
      fieldName: 'description',
      label: $t('dashboard.fields.description'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadCustomerOptions,
        mode: 'multiple',
        allowClear: true,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t('dashboard.features.form.customersPlaceholder'),
      },
      defaultValue: [],
      dependencies: {
        if: () => isCreate.value && canManage.value,
        triggerFields: ['title'],
      },
      fieldName: 'assignedCustomerIds',
      label: $t('dashboard.fields.assignedCustomers'),
    },
    {
      component: 'TbSwitch',
      componentProps: { title: $t('dashboard.fields.mobileHide') },
      defaultValue: false,
      fieldName: 'mobileHide',
      label: $t('dashboard.features.form.mobileSettings'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        step: 1,
        placeholder: $t('dashboard.features.form.mobileOrderPlaceholder'),
      },
      defaultValue: null,
      fieldName: 'mobileOrder',
      label: $t('dashboard.fields.mobileOrder'),
      help: $t('dashboard.features.form.mobileOrderHint'),
      rules: z
        .number()
        .int({ message: $t('dashboard.validation.mobileOrderInteger') })
        .nullish(),
    },
    {
      component: 'ImageInput',
      defaultValue: null,
      fieldName: 'image',
      label: $t('dashboard.fields.image'),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{ dashboardId?: string }>({
  async onConfirm() {
    if (!canManage.value) return;
    const { valid } = await formApi.validate();
    if (!valid) return;
    const formValues = await formApi.getValues();

    const dashboard: Partial<Dashboard> & { title: string } = {
      ...record.value,
      title: formValues.title.trim(),
      configuration: {
        ...record.value?.configuration,
        description: formValues.description,
      },
      mobileHide: formValues.mobileHide,
      mobileOrder: formValues.mobileOrder ?? null,
      image: formValues.image || null,
    };

    modalApi.lock();
    assignmentFailed.value = false;
    try {
      // 先保存返回实体，分配失败重试时更新同一仪表板，避免重复创建。
      record.value = await saveDashboard(dashboard);
      if (isCreate.value && formValues.assignedCustomerIds.length > 0) {
        try {
          record.value = await addDashboardCustomers(
            record.value.id.id,
            formValues.assignedCustomerIds,
          );
        } catch {
          assignmentFailed.value = true;
          emit('success');
          return;
        }
      }
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { dashboardId } = modalApi.getData() ?? {};
    if (!dashboardId && !canManage.value) {
      modalApi.close();
      return;
    }
    record.value = null;
    isCreate.value = !dashboardId;
    assignmentFailed.value = false;
    await formApi.reset();
    formApi.setState({ commonConfig: { disabled: !canManage.value } });
    let title = $t('dashboard.actions.create');
    if (dashboardId) {
      title = canManage.value
        ? $t('dashboard.actions.edit')
        : $t('dashboard.actions.details');
    }
    modalApi.setState({ title });
    modalApi.lock();
    try {
      if (dashboardId) {
        const dashboard = await getDashboardById(dashboardId);
        record.value = dashboard;
        await formApi.setValues({
          title: dashboard.title,
          description: dashboard.configuration?.description ?? '',
          mobileHide: dashboard.mobileHide ?? false,
          mobileOrder: dashboard.mobileOrder ?? null,
          image: dashboard.image ?? null,
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
    :show-confirm-button="canManage"
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
    <Form class="form-message-flow" />
    <p
      v-if="assignmentFailed"
      class="text-destructive mb-4 text-sm"
      role="alert"
    >
      {{ $t('dashboard.features.form.assignmentFailed') }}
    </p>
  </Modal>
</template>
