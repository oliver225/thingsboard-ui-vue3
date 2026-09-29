<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TenantInfo } from '#/api/tb/tenant';

import { computed, reactive, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { areaList } from '@vant/area-data';
import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { deleteTenant, deleteTenants, getTenantInfos } from '#/api/tb/tenant';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import TenantForm from './form.vue';

defineOptions({ name: 'TenantList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。
const router = useRouter();

const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TenantForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<TenantInfo>[]>(() => [
  {
    title: $t('tenant.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 220,
    sorter: true,
    slot: 'tenantTitle',
  },
  {
    title: $t('tenant.fields.tenantProfile'),
    dataIndex: 'tenantProfileName',
    key: 'tenantProfileName',
    width: 160,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('tenant.fields.city'),
    dataIndex: 'city',
    key: 'city',
    width: 130,
    sorter: true,
    customRender: ({ value }) =>
      areaList.county_list[String(value)] || value || '—',
  },
  {
    title: $t('tenant.fields.phone'),
    dataIndex: 'phone',
    key: 'phone',
    width: 160,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('tenant.fields.email'),
    dataIndex: 'email',
    key: 'email',
    width: 220,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) =>
      value === null || value === undefined || value === ''
        ? '—'
        : formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<TenantInfo> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'manageAdmins',
        icon: 'lucide:users',
        text: $t('tb.menu.tenantAdmin'),
        tooltip: $t('tb.menu.tenantAdmin'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleManageAdmins(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('tenant.actions.edit'),
        tooltip: $t('tenant.actions.edit'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('tenant.actions.delete'),
        tooltip: $t('tenant.actions.delete'),
        auth: Authority.SYS_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<TenantInfo>({
  api: getTenantInfos,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id.id,
  batch: {
    entityName: () => $t('tenant.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteTenants,
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

function handleEdit(record: TenantInfo) {
  const tenantId = record.id?.id;
  if (!tenantId) return;

  formModalApi.setData({ tenantId }).open();
}

async function handleDelete(record: TenantInfo) {
  const tenantId = record.id?.id;
  if (!tenantId) return;

  await confirm({
    title: $t('tenant.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('tenant.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteTenant(tenantId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleManageAdmins(record: TenantInfo) {
  const tenantId = record.id?.id;
  if (!tenantId) return;

  return router.push({
    name: 'TenantAdmin',
    params: { tenantId },
  });
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <Page auto-content-height class="tenant-page">
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      :title="$t('tb.menu.tenant')"
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
          v-access:role="[Authority.SYS_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('tenant.actions.create') }}
        </Button>
      </template>

      <template #tenantTitle="{ record }">
        <RouterLink
          :to="{ name: 'TenantDetail', params: { tenantId: record.id.id } }"
          class="text-primary hover:underline"
        >
          {{ record.title }}
        </RouterLink>
      </template>
    </BasicTable>
  </Page>
</template>
