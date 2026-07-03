<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WidgetsBundle } from '#/api/tb/widgets-bundle';

import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Segmented, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWidgetsBundle,
  getWidgetsBundleById,
  getWidgetsBundles,
  saveWidgetsBundle,
} from '#/api/tb/widgets-bundle';
import { DEFAULT_SORT_FIELD, SYS_TENANT_ID } from '#/constants';
import { Authority } from '#/enums/index.js';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import WidgetsBundleForm from './form.vue';

defineOptions({ name: 'WidgetsBundleList' });

const router = useRouter();

const { hasAccessByRoles } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: WidgetsBundleForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getWidgetsBundles({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

/** 系统级部件包(NULL_UUID 租户)对租户管理员只读 */
function isSystem(row: WidgetsBundle) {
  return !row.tenantId?.id || row.tenantId.id === SYS_TENANT_ID;
}

const [Grid, gridApi] = useVbenVxeGrid<WidgetsBundle>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 200,
        sortable: true,
        title: $t('tb.widgetsBundle.fields.title'),
      },
      {
        field: 'description',
        minWidth: 200,
        title: $t('tb.widgetsBundle.fields.description'),
      },
      {
        field: 'tenantId',
        formatter: ({ row }) =>
          isSystem(row)
            ? $t('tb.widgetsBundle.scope.system')
            : $t('tb.widgetsBundle.scope.tenant'),
        title: $t('tb.widgetsBundle.fields.scope'),
        width: 110,
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
        width: 120,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<WidgetsBundle>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: WidgetsBundle): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onExport(row),
      tooltip: $t('tb.widgetsBundle.actions.export'),
    },
    {
      ifShow: hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(row),
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      ifShow: hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(row),
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: WidgetsBundle) {
  formModalApi.setData({ widgetsBundleId: row.id?.id }).open();
}

/** 导出部件包为 JSON 文件 */
async function onExport(row: WidgetsBundle) {
  if (!row.id?.id) {
    return;
  }
  const widgetsBundle = await getWidgetsBundleById(row.id.id, true);
  const exportData = prepareEntityExport(widgetsBundle);
  exportJsonFile(exportData, widgetsBundle.title ?? 'widgets-bundle');
}

/** 校验导入文件是否为合法的部件包 */
function validateImported(data: any): data is WidgetsBundle {
  return data !== null && typeof data === 'object' && data.title !== undefined;
}

/** 从 JSON 文件导入部件包 */
async function onImport() {
  let data: unknown;
  try {
    data = await importJsonFile<WidgetsBundle>();
  } catch {
    message.error($t('tb.widgetsBundle.import.parseError'));
    return;
  }
  if (!validateImported(data)) {
    message.error($t('tb.widgetsBundle.import.invalidFile'));
    return;
  }
  await saveWidgetsBundle(prepareEntityImport(data));
  message.success($t('tb.widgetsBundle.import.success'));
  gridApi.query();
}

async function deleteByRow(row: WidgetsBundle) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteWidgetsBundle(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: WidgetsBundle) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.widgetsBundle.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.widgetsBundle.delete.title', { title: row.title }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid>
      <template #table-title>
        <Segmented
          size="large"
          :options="[
            { label: $t('tb.menu.widgetTypes'), value: 'WidgetType' },
            { label: $t('tb.menu.widgetsBundle'), value: 'WidgetsBundle' },
          ]"
          value="WidgetsBundle"
          @change="
            (value: number | string) => {
              router.push({ name: value as string });
            }
          "
        />
      </template>
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
            {{ $t('tb.widgetsBundle.actions.create') }}
          </Button>
          <Tooltip :title="$t('tb.widgetsBundle.actions.import')">
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
