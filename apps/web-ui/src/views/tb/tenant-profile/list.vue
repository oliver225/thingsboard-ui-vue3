<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TenantProfile } from '#/api/tb/tenant-profile';

import { reactive } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenantProfile,
  getTenantProfileById,
  getTenantProfiles,
  saveTenantProfile,
  setDefaultTenantProfile,
} from '#/api/tb/tenant-profile';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import TenantProfileForm from './form.vue';

defineOptions({ name: 'TenantProfileList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TenantProfileForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getTenantProfiles({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<TenantProfile>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 200,
        sortable: true,
        title: $t('tb.tenantProfile.fields.name'),
      },
      {
        field: 'description',
        minWidth: 200,
        title: $t('tb.tenantProfile.fields.description'),
      },
      {
        field: 'isolatedTbRuleEngine',
        formatter: ({ cellValue }) =>
          cellValue ? $t('tb.common.yes') : $t('tb.common.no'),
        title: $t('tb.tenantProfile.fields.isolatedTbRuleEngine'),
        width: 140,
      },
      {
        field: 'default',
        formatter: ({ cellValue }) =>
          cellValue ? $t('tb.common.yes') : $t('tb.common.no'),
        title: $t('tb.tenantProfile.fields.default'),
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
  } as VxeTableGridOptions<TenantProfile>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: TenantProfile): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onExport(row),
      tooltip: $t('tb.tenantProfile.actions.export'),
    },
    {
      icon: 'lucide:flag',
      ifShow: !!row.default,
      onClick: () => confirmSetDefault(row),
      tooltip: $t('tb.tenantProfile.actions.setDefault'),
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

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: TenantProfile) {
  formModalApi.setData({ tenantProfileId: row.id?.id }).open();
}

/** 导出租户配置为 JSON 文件 */
async function onExport(row: TenantProfile) {
  if (!row.id?.id) {
    return;
  }
  const tenantProfile = await getTenantProfileById(row.id.id);
  const exportData = prepareEntityExport(tenantProfile);
  // 导出的配置不再标记为默认
  exportData.default = false;
  exportJsonFile(exportData, tenantProfile.name);
}

/** 校验导入文件是否为合法的租户配置 */
function validateImportedTenantProfile(data: any): data is TenantProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    data.name !== undefined &&
    data.profileData !== undefined &&
    data.isolatedTbRuleEngine !== undefined
  );
}

/** 从 JSON 文件导入租户配置 */
async function onImport() {
  let data: unknown;
  try {
    data = await importJsonFile<TenantProfile>();
  } catch {
    message.error($t('tb.tenantProfile.import.parseError'));
    return;
  }
  if (!validateImportedTenantProfile(data)) {
    message.error($t('tb.tenantProfile.import.invalidFile'));
    return;
  }
  await saveTenantProfile(prepareEntityImport(data));
  message.success($t('tb.tenantProfile.import.success'));
  gridApi.query();
}

async function deleteByRow(row: TenantProfile) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteTenantProfile(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: TenantProfile) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.tenantProfile.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.tenantProfile.delete.title', { name: row.name }),
  }).catch(() => {});
}

async function setDefaultByRow(row: TenantProfile) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await setDefaultTenantProfile(row.id.id);
    message.success($t('tb.tenantProfile.setDefault.success'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmSetDefault(row: TenantProfile) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return setDefaultByRow(row);
    },
    content: $t('tb.tenantProfile.setDefault.content'),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.tenantProfile.setDefault.title', { name: row.name }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.tenantProfile')">
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
            {{ $t('tb.tenantProfile.actions.create') }}
          </Button>
          <Tooltip :title="$t('tb.tenantProfile.actions.import')">
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
