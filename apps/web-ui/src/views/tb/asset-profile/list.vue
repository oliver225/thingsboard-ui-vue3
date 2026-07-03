<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AssetProfile } from '#/api/tb/asset-profile';

import { reactive } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAssetProfile,
  getAssetProfileById,
  getAssetProfiles,
  saveAssetProfile,
  setDefaultAssetProfile,
} from '#/api/tb/asset-profile';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import AssetProfileForm from './form.vue';

defineOptions({ name: 'AssetProfileList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AssetProfileForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getAssetProfiles({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<AssetProfile>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 200,
        sortable: true,
        title: $t('tb.assetProfile.fields.name'),
      },
      {
        field: 'description',
        minWidth: 200,
        title: $t('tb.assetProfile.fields.description'),
      },
      {
        field: 'default',
        formatter: ({ cellValue }) =>
          cellValue ? $t('tb.common.yes') : $t('tb.common.no'),
        title: $t('tb.assetProfile.fields.default'),
        width: 100,
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
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 150,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<AssetProfile>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: AssetProfile): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onExport(row),
      tooltip: $t('tb.assetProfile.actions.export'),
    },
    {
      icon: 'lucide:flag',
      ifShow: !row.default,
      onClick: () => confirmSetDefault(row),
      tooltip: $t('tb.assetProfile.actions.setDefault'),
    },
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      ifShow: !row.default,
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: AssetProfile) {
  formModalApi.setData({ assetProfileId: row.id?.id }).open();
}

/** 导出资产配置为 JSON 文件 */
async function onExport(row: AssetProfile) {
  if (!row.id?.id) {
    return;
  }
  const assetProfile = await getAssetProfileById(row.id.id);
  const exportData = prepareEntityExport(assetProfile);
  // 导出的配置不再标记为默认
  exportData.default = false;
  exportJsonFile(exportData, assetProfile.name);
}

/** 校验导入文件是否为合法的资产配置 */
function validateImported(data: any): data is AssetProfile {
  return data !== null && typeof data === 'object' && data.name !== undefined;
}

/** 从 JSON 文件导入资产配置 */
async function onImport() {
  let data: unknown;
  try {
    data = await importJsonFile<AssetProfile>();
  } catch {
    message.error($t('tb.assetProfile.import.parseError'));
    return;
  }
  if (!validateImported(data)) {
    message.error($t('tb.assetProfile.import.invalidFile'));
    return;
  }
  await saveAssetProfile(prepareEntityImport(data));
  message.success($t('tb.assetProfile.import.success'));
  gridApi.query();
}

async function deleteByRow(row: AssetProfile) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteAssetProfile(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: AssetProfile) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.assetProfile.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.assetProfile.delete.title', { name: row.name }),
  }).catch(() => {});
}

async function setDefaultByRow(row: AssetProfile) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await setDefaultAssetProfile(row.id.id);
    message.success($t('tb.assetProfile.setDefault.success'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmSetDefault(row: AssetProfile) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return setDefaultByRow(row);
    },
    content: $t('tb.assetProfile.setDefault.content'),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.assetProfile.setDefault.title', { name: row.name }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.assetProfile')">
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
        <div class="flex items-center gap-2">
          <Button type="primary" @click="onCreate">
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
            {{ $t('tb.assetProfile.actions.create') }}
          </Button>
          <Tooltip :title="$t('tb.assetProfile.actions.import')">
            <Button shape="circle" @click="onImport">
              <template #icon>
                <IconifyIcon icon="lucide:upload" />
              </template>
            </Button>
          </Tooltip>
        </div>
      </template>
    </Grid>
  </Page>
</template>
