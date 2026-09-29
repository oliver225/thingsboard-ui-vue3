<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbUserInfo } from '#/api/core/user';
import type { DashboardInfo } from '#/api/tb/dashboard';
import type { PageLink } from '#/types/tb';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteDashboard,
  deleteDashboards,
  exportDashboard,
  getCustomerDashboards,
  getTenantDashboards,
  makeDashboardPrivate,
  makeDashboardPublic,
} from '#/api/tb/dashboard';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { exportJsonFile, prepareEntityExport } from '#/utils/import-export';

import DashboardCustomerForm from './customer-form.vue';
import DashboardForm from './form.vue';

defineOptions({ name: 'DashboardList' });

// 页面状态与表单弹窗。
const userStore = useUserStore();

const { hasAccessByRoles } = useAccess();

const canManage = computed(() => hasAccessByRoles([Authority.TENANT_ADMIN]));

const customerId = computed(
  () => (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '',
);

const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DashboardForm,
  destroyOnClose: true,
});

const [CustomerModal, customerModalApi] = useVbenModal({
  connectedComponent: DashboardCustomerForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保权限与语言变化时同步更新。
const tableColumns = computed<BasicColumn<DashboardInfo>[]>(() => [
  {
    title: $t('dashboard.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 220,
    sorter: true,
    slot: 'dashboardTitle',
  },
  {
    title: $t('dashboard.fields.assignedCustomers'),
    dataIndex: 'assignedCustomers',
    key: 'assignedCustomers',
    width: 280,
    ifShow: canManage.value,
    customRender: ({ record }) => getAssignedCustomersText(record) || '—',
  },
  {
    key: 'public',
    title: $t('dashboard.fields.public'),
    width: 100,
    ifShow: canManage.value,
    slot: 'dashboardPublic',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<DashboardInfo> = {
  align: 'center',
  width: 220,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('dashboard.actions.export'),
        tooltip: $t('dashboard.actions.export'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleExport(record),
      },
      {
        key: 'manageCustomers',
        icon: 'lucide:users',
        text: $t('dashboard.features.customers.manage'),
        tooltip: $t('dashboard.features.customers.manage'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleManageCustomers(record),
      },
      {
        key: 'public',
        icon: isPublicDashboard(record)
          ? 'lucide:lock-keyhole'
          : 'lucide:share-2',
        text: isPublicDashboard(record)
          ? $t('dashboard.actions.makePrivate')
          : $t('dashboard.actions.makePublic'),
        tooltip: isPublicDashboard(record)
          ? $t('dashboard.actions.makePrivate')
          : $t('dashboard.actions.makePublic'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleChangePublic(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: canManage.value ? 'lucide:square-pen' : 'lucide:eye',
        text: canManage.value
          ? $t('dashboard.actions.edit')
          : $t('dashboard.actions.details'),
        tooltip: canManage.value
          ? $t('dashboard.actions.edit')
          : $t('dashboard.actions.details'),
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('dashboard.actions.delete'),
        tooltip: $t('dashboard.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload, setSelectedRowKeys }] = useTable<DashboardInfo>(
  {
    api: fetchList,
    searchInfo,
    columns: tableColumns,
    actionColumn,
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('dashboard.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id,
      deleteApi: deleteDashboards,
      actions: [
        {
          key: 'assign',
          label: () => $t('dashboard.features.customers.assign'),
          icon: 'lucide:users',
          onClick: ({ keys }) => handleBatchAssign('assign', keys.map(String)),
        },
        {
          key: 'unassign',
          label: () => $t('dashboard.features.customers.unassign'),
          icon: 'lucide:user-minus',
          onClick: ({ keys }) =>
            handleBatchAssign('unassign', keys.map(String)),
        },
      ],
    },
    tableSetting: { redo: true, setting: true, size: true },
  },
);

watch(() => searchInfo.searchText, handleSearch);

async function fetchList(pageLink: PageLink) {
  if (canManage.value) {
    return getTenantDashboards(pageLink);
  } else if (customerId.value) {
    return getCustomerDashboards(customerId.value, pageLink);
  } else {
    return { data: [], hasNext: false, totalElements: 0, totalPages: 0 };
  }
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  if (!canManage.value) return;
  formModalApi.setData({}).open();
}

function handleEdit(record: DashboardInfo) {
  const dashboardId = record.id?.id;
  if (!dashboardId) return;

  formModalApi.setData({ dashboardId }).open();
}

async function handleExport(record: DashboardInfo) {
  const dashboardId = record.id?.id;
  if (!canManage.value || !dashboardId) return;
  const dashboard = await exportDashboard(dashboardId);
  const exportData = prepareEntityExport(dashboard);
  delete exportData.assignedCustomers;
  exportJsonFile(exportData, dashboard.title);
}

async function handleDelete(record: DashboardInfo) {
  const dashboardId = record.id?.id;
  if (!canManage.value || !dashboardId) return;

  await confirm({
    title: $t('dashboard.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('dashboard.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteDashboard(dashboardId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleManageCustomers(record: DashboardInfo) {
  const dashboardId = record.id?.id;
  if (!canManage.value || !dashboardId) return;
  customerModalApi
    .setData({ action: 'manage', dashboardIds: [dashboardId] })
    .open();
}

function handleBatchAssign(action: 'assign' | 'unassign', keys: string[]) {
  if (!canManage.value || keys.length === 0) return;
  customerModalApi.setData({ action, dashboardIds: keys }).open();
}

async function handleChangePublic(record: DashboardInfo) {
  const dashboardId = record.id?.id;
  if (!canManage.value || !dashboardId) return;
  const isPublic = isPublicDashboard(record);
  await confirm({
    title: isPublic
      ? $t('dashboard.actions.makePrivate')
      : $t('dashboard.actions.makePublic'),
    content: isPublic
      ? $t('dashboard.features.public.makePrivateConfirm', {
          title: record.title,
        })
      : $t('dashboard.features.public.makePublicConfirm', {
          title: record.title,
        }),
    icon: 'warning',
  });
  await (isPublic
    ? makeDashboardPrivate(dashboardId)
    : makeDashboardPublic(dashboardId));
  message.success($t('dashboard.features.public.success'));
  await reload();
}

async function handleSaved() {
  await reload();
}

async function handleCustomersSaved(failedIds: string[]) {
  await reload();
  setSelectedRowKeys(failedIds);
}

function isPublicDashboard(dashboard: DashboardInfo) {
  return (
    dashboard.assignedCustomers?.some((customer) => customer.public) ?? false
  );
}

function getAssignedCustomersText(dashboard: DashboardInfo) {
  return (dashboard.assignedCustomers ?? [])
    .filter((customer) => !customer.public)
    .map((customer) => customer.title)
    .filter(Boolean)
    .join(', ');
}
</script>

<template>
  <Page auto-content-height class="dashboard-page">
    <FormModal @success="handleSaved" />
    <CustomerModal @success="handleCustomersSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      :title="$t('tb.menu.dashboard')"
      @register="registerTable"
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
          {{ $t('dashboard.actions.create') }}
        </Button>
      </template>
      <template #dashboardTitle="{ record }">
        <Button type="link" class="h-auto p-0" @click="handleEdit(record)">
          {{ record.title }}
        </Button>
      </template>
      <template #dashboardPublic="{ record }">
        <TbCheckbox
          :checked="isPublicDashboard(record)"
          disabled
          :aria-label="$t('dashboard.fields.public')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
