<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TenantInfo } from '#/api/tb/tenant';

import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { areaList } from '@vant/area-data';
import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTenant, getTenantInfos } from '#/api/tb/tenant';
import { DEFAULT_SORT_FIELD } from '#/constants/index.js';
import { $t } from '#/locales';

import TenantForm from './form.vue';

defineOptions({ name: 'TenantList' });

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TenantForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getTenantInfos({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<TenantInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 160,
        sortable: true,
        title: $t('tb.tenant.fields.title'),
      },
      {
        field: 'tenantProfileName',
        minWidth: 130,
        title: $t('tb.tenant.fields.tenantProfile'),
      },
      {
        field: 'city',
        minWidth: 110,
        sortable: true,
        title: $t('tb.tenant.fields.city'),
        slots: {
          default: ({ row }) => areaList.county_list[`${row.city}`] ?? row.city,
        },
      },
      { field: 'phone', minWidth: 130, title: $t('tb.tenant.fields.phone') },
      {
        field: 'email',
        minWidth: 160,
        title: $t('tb.tenant.fields.email'),
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
        title: $t('tb.common.actions'),
        width: 120,
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<TenantInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: TenantInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:users',
      onClick: () => onManageAdmins(row),
      tooltip: $t('tb.tenantAdmin.actions.manage'),
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

function onManageAdmins(row: TenantInfo) {
  if (!row.id?.id) {
    return;
  }
  router.push({ name: 'TenantAdmin', params: { tenantId: row.id.id } });
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: TenantInfo) {
  formModalApi.setData({ tenantId: row.id?.id }).open();
}

async function deleteTenantByRow(row: TenantInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteTenant(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: TenantInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteTenantByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.tenant.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.tenant.delete.title', { title: row.title }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.tenant')">
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
          {{ $t('tb.tenant.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
