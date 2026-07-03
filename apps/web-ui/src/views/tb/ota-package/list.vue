<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OtaPackageInfo } from '#/api/tb/ota-package';

import { reactive } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOtaPackage,
  downloadOtaPackage,
  getOtaPackages,
} from '#/api/tb/ota-package';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { otaPackageTypeLabel } from '#/enums';
import { $t } from '#/locales';

import OtaPackageForm from './form.vue';

defineOptions({ name: 'OtaPackageList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: OtaPackageForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

/** 字节大小格式化 */
function formatBytes(value?: number): string {
  if (!value && value !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

async function fetch({ page, sort }: any) {
  return getOtaPackages({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<OtaPackageInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 160,
        sortable: true,
        title: $t('tb.otaPackage.fields.title'),
      },
      {
        field: 'version',
        minWidth: 100,
        sortable: true,
        title: $t('tb.otaPackage.fields.version'),
      },
      {
        field: 'type',
        formatter: ({ cellValue }) => otaPackageTypeLabel(cellValue),
        title: $t('tb.otaPackage.fields.type'),
        width: 100,
      },
      {
        field: 'fileName',
        minWidth: 160,
        title: $t('tb.otaPackage.fields.fileName'),
      },
      {
        field: 'dataSize',
        formatter: ({ cellValue }) => formatBytes(cellValue),
        title: $t('tb.otaPackage.fields.dataSize'),
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
  } as VxeTableGridOptions<OtaPackageInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: OtaPackageInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      // 仅上传了二进制数据的包可下载;外部 URL 包无本地文件
      ifShow: !!row.hasData && !row.url,
      onClick: () => onDownload(row),
      tooltip: $t('tb.otaPackage.actions.download'),
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

async function onDownload(row: OtaPackageInfo) {
  if (!row.id?.id) {
    return;
  }
  const blob = await downloadOtaPackage(row.id.id);
  downloadFileFromBlob({
    fileName: row.fileName ?? `${row.title}_${row.version}`,
    source: blob,
  });
}

async function deleteByRow(row: OtaPackageInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteOtaPackage(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: OtaPackageInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.otaPackage.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.otaPackage.delete.title', { title: row.title }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.otaUpdate')">
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
          {{ $t('tb.otaPackage.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
