<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { OtaPackageInfo } from '#/api/tb/ota-package';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteOtaPackage,
  deleteOtaPackages,
  downloadOtaPackage,
  getOtaPackages,
} from '#/api/tb/ota-package';
import { CopyText } from '#/components/widget';
import { Authority, otaPackageTypeLabel } from '#/enums';
import { $t } from '#/locales';

import OtaUpdateForm from './form.vue';

defineOptions({ name: 'OtaUpdateList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。
const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: OtaUpdateForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<OtaPackageInfo>[]>(() => [
  {
    title: $t('ota-updates.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 180,
    align: 'left',
    fixed: 'left',
    sorter: true,
  },
  {
    title: $t('ota-updates.fields.version'),
    dataIndex: 'version',
    key: 'version',
    width: 130,
    sorter: true,
  },
  {
    title: $t('ota-updates.fields.tag'),
    dataIndex: 'tag',
    key: 'tag',
    width: 160,
    sorter: true,
  },
  {
    title: $t('ota-updates.fields.type'),
    dataIndex: 'type',
    key: 'type',
    width: 110,
    sorter: true,
    slot: 'type',
  },
  {
    title: $t('ota-updates.fields.url'),
    dataIndex: 'url',
    key: 'url',
    width: 240,
    slot: 'url',
  },
  {
    title: $t('ota-updates.fields.fileName'),
    dataIndex: 'fileName',
    key: 'fileName',
    width: 180,
    sorter: true,
  },
  {
    title: $t('ota-updates.fields.dataSize'),
    dataIndex: 'dataSize',
    key: 'dataSize',
    width: 110,
    sorter: true,
    customRender: ({ value }) => formatSize(value),
  },
  {
    title: $t('ota-updates.fields.checksum'),
    dataIndex: 'checksum',
    key: 'checksum',
    width: 240,
    slot: 'checksum',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    fixed: 'right',
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<OtaPackageInfo> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'download',
        icon: 'lucide:download',
        text: $t('ota-updates.actions.download'),
        tooltip: $t('ota-updates.actions.download'),
        auth: Authority.TENANT_ADMIN,
        disabled: !record.hasData || !!record.url,
        onClick: () => handleDownload(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('tb.common.delete'),
        tooltip: $t('tb.common.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload, clearSelectedRowKeys }] =
  useTable<OtaPackageInfo>({
    api: getOtaPackages,
    searchInfo,
    columns: tableColumns,
    actionColumn,
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('ota-updates.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id,
      deleteApi: deleteOtaPackages,
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

async function handleDelete(record: OtaPackageInfo) {
  const otaPackageId = record.id?.id;
  if (!otaPackageId) return;

  await confirm({
    title: $t('tb.common.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('ota-updates.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteOtaPackage(otaPackageId);
        message.success($t('tb.common.messages.delete.success'));
        clearSelectedRowKeys();
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleDownload(record: OtaPackageInfo) {
  const otaPackageId = record.id?.id;
  if (!otaPackageId || !record.hasData || record.url) return;

  const blob = await downloadOtaPackage(otaPackageId);
  downloadFileFromBlob({
    fileName: record.fileName || `${record.title}-${record.version}`,
    source: blob,
  });
}

function handleSaved() {
  return reload();
}

function formatSize(size?: number) {
  if (size === undefined || size === null) return '-';
  if (size < 1024) return `${size} B`;
  const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), 4);
  return `${(size / 1024 ** unit).toFixed(1)} ${['B', 'KB', 'MB', 'GB', 'TB'][unit]}`;
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      :title="$t('ota-updates.sections.repository')"
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
          {{ $t('ota-updates.actions.add') }}
        </Button>
      </template>
      <template #type="{ record }">
        <Tag :color="record.type === 'FIRMWARE' ? 'blue' : 'purple'">
          {{ otaPackageTypeLabel(record.type) }}
        </Tag>
      </template>
      <template #url="{ record }">
        <CopyText :text="record.url || undefined" />
      </template>
      <template #checksum="{ record }">
        <CopyText
          v-if="record.checksum"
          :text="record.checksum"
          :display-text="`${record.checksumAlgorithm}: ${record.checksum}`"
        />
        <span v-else>—</span>
      </template>
    </BasicTable>
  </Page>
</template>
