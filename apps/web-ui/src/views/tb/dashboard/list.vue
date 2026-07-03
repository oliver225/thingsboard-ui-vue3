<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbUserInfo } from '#/api/core/user';
import type { DashboardInfo } from '#/api/tb/dashboard';

import { reactive } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDashboard,
  getCustomerDashboards,
  getTenantDashboards,
} from '#/api/tb/dashboard';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import DashboardForm from './form.vue';

defineOptions({ name: 'DashboardList' });

const { hasAccessByRoles } = useAccess();
const userStore = useUserStore();

/** 客户用户的 customerId(用于按客户作用域拉取仪表板) */
const customerId =
  (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DashboardForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  const pageLink = {
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: (sort?.order === 'desc' ? 'DESC' : 'ASC') as 'ASC' | 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  };
  return hasAccessByRoles([Authority.TENANT_ADMIN])
    ? getTenantDashboards(pageLink)
    : getCustomerDashboards(customerId, pageLink);
}

const [Grid, gridApi] = useVbenVxeGrid<DashboardInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 200,
        sortable: true,
        title: $t('tb.dashboard.fields.title'),
      },
      {
        field: 'assignedCustomers',
        minWidth: 200,
        slots: {
          default: ({ row }) =>
            (row.assignedCustomers ?? [])
              .map((customer) => customer.title)
              .filter(Boolean)
              .join('、'),
        },
        title: $t('tb.dashboard.fields.assignedCustomers'),
      },
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
  } as VxeTableGridOptions<DashboardInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: DashboardInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: DashboardInfo) {
  formModalApi.setData({ dashboardId: row.id?.id }).open();
}

async function deleteByRow(row: DashboardInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteDashboard(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: DashboardInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.dashboard.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.dashboard.delete.title', { title: row.title }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.dashboard')">
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
        <Button
          v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
          type="primary"
          @click="onCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('tb.dashboard.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
