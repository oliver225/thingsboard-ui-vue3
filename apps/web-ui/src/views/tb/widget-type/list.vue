<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WidgetTypeDetails, WidgetTypeInfo } from '#/api/tb/widget-type';

import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Segmented, Tag, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWidgetType,
  getWidgetTypeById,
  getWidgetTypes,
  saveWidgetType,
} from '#/api/tb/widget-type';
import { DEFAULT_SORT_FIELD, SYS_TENANT_ID } from '#/constants';
import { Authority, widgetCategoryLabel, widgetCategoryOptions } from '#/enums';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import WidgetTypeForm from './form.vue';

defineOptions({ name: 'WidgetTypeList' });

const router = useRouter();

const { hasAccessByRoles } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: WidgetTypeForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ filters, page, sort }: any) {
  return getWidgetTypes({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'desc' ? 'DESC' : 'ASC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
    widgetTypeList:
      filters?.find((item: any) => item.field === 'widgetType')?.values ?? [],
  });
}

/** 系统级部件(NULL_UUID 租户)对租户管理员只读 */
function isSystem(row: WidgetTypeInfo) {
  return !row.tenantId?.id || row.tenantId.id === SYS_TENANT_ID;
}

const [Grid, gridApi] = useVbenVxeGrid<WidgetTypeInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 200,
        sortable: true,
        title: $t('tb.widgetType.fields.name'),
      },
      {
        field: 'bundles',
        minWidth: 200,
        slots: { default: 'bundles' },
        title: $t('tb.widgetType.fields.bundles'),
      },
      {
        field: 'widgetType',
        filterMultiple: true,
        filters: widgetCategoryOptions(),
        formatter: ({ cellValue }) => widgetCategoryLabel(cellValue),
        title: $t('tb.widgetType.fields.widgetType'),
        width: 120,
      },
      {
        field: 'tenantId',
        formatter: ({ row }) =>
          isSystem(row)
            ? $t('tb.widgetType.scope.system')
            : $t('tb.widgetType.scope.tenant'),
        title: $t('tb.widgetType.fields.scope'),
        width: 110,
      },
      {
        field: 'deprecated',
        slots: { default: 'deprecated' },
        title: $t('tb.widgetType.fields.deprecated'),
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
        width: 120,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<WidgetTypeInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: WidgetTypeInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onExport(row),
      tooltip: $t('tb.widgetType.actions.export'),
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

function onEdit(row: WidgetTypeInfo) {
  formModalApi.setData({ widgetTypeId: row.id?.id }).open();
}

/** 导出部件为 JSON 文件 */
async function onExport(row: WidgetTypeInfo) {
  if (!row.id?.id) {
    return;
  }
  const widgetType = await getWidgetTypeById(row.id.id, true);
  const exportData = prepareEntityExport(widgetType);
  exportJsonFile(exportData, widgetType.name ?? 'widget-type');
}

/** 校验导入文件是否为合法的部件类型 */
function validateImported(data: any): data is WidgetTypeDetails {
  return (
    data !== null &&
    typeof data === 'object' &&
    data.fqn !== undefined &&
    data.descriptor !== undefined
  );
}

/** 从 JSON 文件导入部件 */
async function onImport() {
  let data: unknown;
  try {
    data = await importJsonFile<WidgetTypeDetails>();
  } catch {
    message.error($t('tb.widgetType.import.parseError'));
    return;
  }
  if (!validateImported(data)) {
    message.error($t('tb.widgetType.import.invalidFile'));
    return;
  }
  await saveWidgetType(prepareEntityImport(data));
  message.success($t('tb.widgetType.import.success'));
  gridApi.query();
}

async function deleteByRow(row: WidgetTypeInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteWidgetType(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: WidgetTypeInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.widgetType.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.widgetType.delete.title', { name: row.name }),
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
          value="WidgetType"
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
            {{ $t('tb.widgetType.actions.create') }}
          </Button>
          <Tooltip :title="$t('tb.widgetType.actions.import')">
            <Button shape="circle" @click="onImport">
              <template #icon>
                <IconifyIcon icon="lucide:upload" />
              </template>
            </Button>
          </Tooltip>
        </div>
      </template>
      <template #bundles="{ row }">
        <div class="flex flex-wrap gap-1">
          <Tag
            v-for="bundle in row.bundles"
            :key="bundle.id?.id ?? bundle.name"
          >
            {{ bundle.name }}
          </Tag>
        </div>
      </template>
      <template #deprecated="{ row }">
        <Tag variant="outlined" :color="row.deprecated ? 'error' : 'success'">
          {{ row.deprecated ? $t('tb.common.yes') : $t('tb.common.no') }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
