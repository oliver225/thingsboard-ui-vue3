<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbResourceInfo } from '#/api/tb/resource';
import type { ResourceType } from '#/enums';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Input, message, Select } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteResourceById,
  deleteResources,
  downloadResource,
  getResources,
} from '#/api/tb/resource';
import { SYS_TENANT_ID } from '#/constants';
import { Authority, resourceTypeLabel, resourceTypeOptions } from '#/enums';
import { $t } from '#/locales';

import ResourceForm from './form.vue';

defineOptions({ name: 'ResourceLibraryList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive<{
  searchText: string;
  resourceType: ResourceType | undefined;
}>({
  searchText: '',
  resourceType: undefined,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ResourceForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<TbResourceInfo>[]>(() => [
  {
    title: $t('resource-library.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 220,
    sorter: true,
  },
  {
    title: $t('resource-library.fields.resourceKey'),
    dataIndex: 'resourceKey',
    key: 'resourceKey',
    width: 160,
  },
  {
    title: $t('resource-library.fields.resourceType'),
    dataIndex: 'resourceType',
    key: 'resourceType',
    width: 160,
    sorter: true,
    customRender: ({ value }) => resourceTypeLabel(value) || '—',
  },
  {
    key: 'scope',
    customRender: ({ record }) =>
      isSystem(record)
        ? $t('resource-library.options.scope.system')
        : $t('resource-library.options.scope.tenant'),
    title: $t('resource-library.fields.scope'),
    width: 100,
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<TbResourceInfo> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'download',
        icon: 'lucide:download',
        text: $t('resource-library.actions.download'),
        tooltip: $t('resource-library.actions.download'),
        onClick: () => handleDownload(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('resource-library.actions.delete'),
        tooltip: $t('resource-library.actions.delete'),
        disabled: !isSystem(record),
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<TbResourceInfo>({
  api: getResources,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('resource-library.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) =>
      !!(
        !!record.id?.id &&
        hasAccessByRoles([Authority.SYS_ADMIN]) &&
        isSystem(record)
      ),
    deleteApi: deleteResources,
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

/**
 * 执行删除。返回 true 表示允许关闭确认框(成功 / 已转入强制删除),
 * 返回 false 表示保持确认框打开(意外错误)。
 */
async function handleDelete(record: TbResourceInfo) {
  const resourceId = record.id?.id;
  if (!resourceId) return;

  await confirm({
    title: $t('resource-library.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('resource-library.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteResourceById(resourceId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

/** 下载原始资源文件 */
async function handleDownload(record: TbResourceInfo) {
  if (!record.id?.id) {
    return;
  }
  const blob = await downloadResource(record.id.id);
  downloadFileFromBlob({
    fileName: record.fileName ?? record.title ?? 'resource',
    source: blob,
  });
}

function handleSaved() {
  return reload();
}

/** 系统级资源(NULL_UUID 租户)对租户管理员只读 */
function isSystem(record: TbResourceInfo) {
  return !record.tenantId?.id || record.tenantId.id === SYS_TENANT_ID;
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.resourceLibrary')"
    >
      <template #query>
        <Select
          class="w-full sm:w-48 sm:max-w-full"
          v-model:value="searchInfo.resourceType"
          allow-clear
          :placeholder="$t('resource-library.features.filter.allTypes')"
          :options="resourceTypeOptions()"
          @change="handleSearch"
        />
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
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('resource-library.actions.add') }}
        </Button>
      </template>
    </BasicTable>
  </Page>
</template>
