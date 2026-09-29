<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { Customer } from '#/api/tb/customer';

import { computed, reactive, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { areaList } from '@vant/area-data';
import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteCustomer,
  deleteCustomers,
  getCustomers,
} from '#/api/tb/customer';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import CustomerForm from './form.vue';

defineOptions({ name: 'CustomerList' });

const { hasAccessByRoles } = useAccess();

const router = useRouter();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CustomerForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<Customer>[]>(() => [
  {
    title: $t('customer.fields.title'),
    dataIndex: 'title',
    key: 'title',
    slot: 'detailLink',
    width: 180,
    sorter: true,
  },
  {
    title: $t('customer.fields.email'),
    dataIndex: 'email',
    key: 'email',
    width: 160,
  },
  {
    title: $t('customer.fields.city'),
    dataIndex: 'city',
    key: 'city',
    width: 110,
    customRender: ({ record }) =>
      areaList.county_list[`${record.city}`] ?? record.city,
  },
  {
    title: $t('customer.fields.phone'),
    dataIndex: 'phone',
    key: 'phone',
    width: 130,
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<Customer> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'manageUsers',
        ifShow: !record.additionalInfo?.isPublic,
        icon: 'lucide:users',
        text: $t('customer-user.actions.manage'),
        tooltip: $t('customer-user.actions.manage'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleManageUsers(record),
      },
      {
        key: 'edit',
        ifShow: !record.additionalInfo?.isPublic,
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('customer.actions.edit'),
        tooltip: $t('customer.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        ifShow: !record.additionalInfo?.isPublic,
        icon: 'lucide:trash-2',
        text: $t('customer.actions.delete'),
        tooltip: $t('customer.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<Customer>({
  api: getCustomers,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('customer.menu'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id && !record.additionalInfo?.isPublic,
    deleteApi: deleteCustomers,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: Customer) {
  if (!record.id?.id || record.additionalInfo?.isPublic) return;
  formModalApi.setData({ customerId: record.id?.id }).open();
}

async function handleDelete(record: Customer) {
  const customerId = record.id?.id;
  if (!customerId || record.additionalInfo?.isPublic) return;

  await confirm({
    title: $t('customer.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('customer.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteCustomer(customerId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleManageUsers(record: Customer) {
  if (!record.id?.id || record.additionalInfo?.isPublic) {
    return;
  }
  router.push({ name: 'CustomerUser', params: { customerId: record.id.id } });
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.customer')"
    >
      <template #query>
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-80 sm:max-w-full"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('tb.common.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <Button
          v-access:role="[Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('customer.actions.create') }}
        </Button>
      </template>
      <template #detailLink="{ record }">
        <RouterLink
          v-if="record.id"
          :to="{ name: 'CustomerDetail', params: { customerId: record.id.id } }"
          class="text-primary hover:underline"
        >
          {{ record.title || '—' }}
        </RouterLink>
        <span v-else>{{ record.title || '—' }}</span>
      </template>
    </BasicTable>
  </Page>
</template>
