<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbUserInfo } from '#/api/core/user';
import type { AssetInfo } from '#/api/tb/asset';

import { reactive } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAsset,
  getCustomerAssetInfos,
  getTenantAssetInfos,
} from '#/api/tb/asset';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import AssetForm from './form.vue';

defineOptions({ name: 'AssetList' });

const { hasAccessByRoles } = useAccess();
const userStore = useUserStore();

const customerId =
  (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AssetForm,
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
    ? getTenantAssetInfos(pageLink)
    : getCustomerAssetInfos(customerId, pageLink);
}

const [Grid, gridApi] = useVbenVxeGrid<AssetInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 160,
        sortable: true,
        title: $t('tb.asset.fields.name'),
      },
      {
        field: 'assetProfileName',
        minWidth: 130,
        title: $t('tb.asset.fields.assetProfile'),
      },
      { field: 'label', minWidth: 120, title: $t('tb.asset.fields.label') },
      {
        field: 'customerTitle',
        minWidth: 130,
        title: $t('tb.asset.fields.customer'),
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
        width: 100,
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<AssetInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: AssetInfo): ActionItem[] {
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

function onEdit(row: AssetInfo) {
  formModalApi.setData({ assetId: row.id?.id }).open();
}

async function deleteAssetByRow(row: AssetInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteAsset(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: AssetInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteAssetByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.asset.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.asset.delete.title', { name: row.name }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.asset')">
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
          {{ $t('tb.asset.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
