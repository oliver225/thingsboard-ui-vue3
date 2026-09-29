<script lang="ts" setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getCustomers } from '#/api/tb/customer';
import {
  addDashboardCustomers,
  getDashboardInfoById,
  removeDashboardCustomers,
  updateDashboardCustomers,
} from '#/api/tb/dashboard';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

type CustomerAction = 'assign' | 'manage' | 'unassign';

const emit = defineEmits<{ success: [failedIds: string[]] }>();
const route = useRoute();

const { hasAccessByRoles } = useAccess();
const action = ref<CustomerAction>('manage');
const pendingIds = ref<string[]>([]);
const publicCustomerIds = ref<string[]>([]);
const errorMessage = ref('');
const hasPartialFailure = ref(false);
let totalCount = 0;

async function loadCustomerOptions() {
  const customers = await loadAllPages((pageLink) =>
    getCustomers({ ...pageLink, sortProperty: 'title', sortOrder: 'ASC' }),
  );
  // Public 客户由公开/私有操作管理，不混入普通客户的分配列表。
  return customers
    .filter((customer) => customer.id?.id && !customer.additionalInfo?.isPublic)
    .map((customer) => ({ label: customer.title, value: customer.id?.id }));
}

const [Form, formApi] = useVbenForm<{ customerIds: string[] }>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  schema: [
    {
      component: 'ApiSelect',
      componentProps: () => ({
        api: loadCustomerOptions,
        mode: 'multiple',
        allowClear: true,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t('dashboard.features.form.customersPlaceholder'),
        disabled: hasPartialFailure.value,
      }),
      defaultValue: [],
      fieldName: 'customerIds',
      label: $t('dashboard.fields.assignedCustomers'),
    },
  ],
});

const [Modal, modalApi] = useVbenModal<{
  action: CustomerAction;
  dashboardIds: string[];
}>({
  async onConfirm() {
    if (
      !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
      pendingIds.value.length === 0
    )
      return;
    const { customerIds } = await formApi.getValues();
    if (action.value !== 'manage' && customerIds.length === 0) {
      errorMessage.value = $t('dashboard.validation.customersRequired');
      return;
    }
    modalApi.lock();
    errorMessage.value = '';
    try {
      const ids = [...pendingIds.value];
      const results = await Promise.allSettled(
        ids.map((dashboardId) => {
          if (action.value === 'assign')
            return addDashboardCustomers(dashboardId, customerIds);
          if (action.value === 'unassign')
            return removeDashboardCustomers(dashboardId, customerIds);
          // 普通客户的分配变更不改变仪表板的公开状态。
          return updateDashboardCustomers(dashboardId, [
            ...new Set([...publicCustomerIds.value, ...customerIds]),
          ]);
        }),
      );
      pendingIds.value = ids.filter(
        (_id, index) => results[index]?.status === 'rejected',
      );
      emit('success', [...pendingIds.value]);
      if (pendingIds.value.length > 0) {
        hasPartialFailure.value = true;
        errorMessage.value = $t('dashboard.features.customers.partialFailure', {
          updated: totalCount - pendingIds.value.length,
          failed: pendingIds.value.length,
        });
        return;
      }
      message.success($t('dashboard.features.customers.success'));
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData();
    if (
      !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
      !data?.dashboardIds.length
    ) {
      modalApi.close();
      return;
    }
    action.value = data.action;
    pendingIds.value = [...new Set(data.dashboardIds)];
    totalCount = pendingIds.value.length;
    publicCustomerIds.value = [];
    errorMessage.value = '';
    hasPartialFailure.value = false;
    await formApi.reset();
    const titles: Record<CustomerAction, string> = {
      assign: $t('dashboard.features.customers.assign'),
      manage: $t('dashboard.features.customers.manage'),
      unassign: $t('dashboard.features.customers.unassign'),
    };
    modalApi.setState({ title: titles[action.value] });
    modalApi.lock();
    try {
      const dashboardId = pendingIds.value[0];
      if (action.value === 'manage' && dashboardId) {
        const dashboard = await getDashboardInfoById(dashboardId);
        const customers = dashboard.assignedCustomers ?? [];
        publicCustomerIds.value = customers.flatMap((customer) =>
          customer.public && customer.customerId?.id
            ? [customer.customerId.id]
            : [],
        );
        await formApi.setValues({
          customerIds: customers.flatMap((customer) =>
            !customer.public && customer.customerId?.id
              ? [customer.customerId.id]
              : [],
          ),
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
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
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
    <p v-if="errorMessage" class="text-destructive mb-4 text-sm" role="alert">
      {{ errorMessage }}
    </p>
  </Modal>
</template>
