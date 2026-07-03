<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Customer } from '#/api/tb/customer';

import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { areaList } from '@vant/area-data';
import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCustomer, getCustomers } from '#/api/tb/customer';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';

import CustomerForm from './form.vue';

defineOptions({ name: 'CustomerList' });

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CustomerForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getCustomers({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<Customer>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 180,
        sortable: true,
        title: $t('tb.customer.fields.title'),
      },
      {
        field: 'email',
        minWidth: 160,
        title: $t('tb.customer.fields.email'),
      },
      {
        field: 'country',
        minWidth: 110,
        title: $t('tb.customer.fields.country'),
      },
      {
        field: 'city',
        minWidth: 110,
        title: $t('tb.customer.fields.city'),
        slots: {
          default: ({ row }) => areaList.county_list[`${row.city}`] ?? row.city,
        },
      },
      { field: 'phone', minWidth: 130, title: $t('tb.customer.fields.phone') },
      {
        field: 'createdTime',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.common.createdTime'),
        width: 170,
      },
      {
        field: 'actions',
        fixed: 'right',
        align: 'center',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 100,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<Customer>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: Customer): ActionItem[] {
  return [
    {
      icon: 'lucide:users',
      onClick: () => onManageUsers(row),
      tooltip: $t('tb.customerUser.actions.manage'),
    },
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onManageUsers(row: Customer) {
  if (!row.id?.id) {
    return;
  }
  router.push({ name: 'CustomerUser', params: { customerId: row.id.id } });
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: Customer) {
  formModalApi.setData({ customerId: row.id?.id }).open();
}

async function deleteByRow(row: Customer) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteCustomer(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: Customer) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.customer.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.customer.delete.title', { title: row.title }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.customer')">
      <template #toolbar-actions>
        <div class="w-72">
          <Input
            v-model:value="queryParams.textSearch"
            allow-clear
            :placeholder="$t('tb.common.searchPlaceholder')"
            @change="onSearch"
          >
            <template #suffix>
              <IconifyIcon icon="lucide:search" />
            </template>
          </Input>
        </div>
      </template>
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('tb.customer.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
