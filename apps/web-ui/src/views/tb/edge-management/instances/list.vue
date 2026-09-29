<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { EdgeInfo } from '#/api/tb/edge';

import { computed, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteEdge,
  deleteEdges,
  getTenantEdgeInfos,
  syncEdge,
} from '#/api/tb/edge';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import EdgeNavigation from '../navigation.vue';
import EdgeForm from './form.vue';

defineOptions({ name: 'EdgeInstanceList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。
const syncingIds = ref(new Set<string>());

const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: EdgeForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<EdgeInfo>[]>(() => [
  {
    title: $t('edge-management.features.instances.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 220,
    sorter: true,
    slot: 'edgeName',
  },
  {
    title: $t('edge-management.features.instances.fields.type'),
    dataIndex: 'type',
    key: 'type',
    width: 160,
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('edge-management.features.instances.fields.label'),
    dataIndex: 'label',
    key: 'label',
    width: 180,
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('edge-management.features.instances.fields.customer'),
    dataIndex: 'customerTitle',
    key: 'customerTitle',
    width: 180,
    customRender: ({ value }) => value || '—',
  },
  {
    title: $t('edge-management.features.instances.fields.public'),
    dataIndex: 'customerIsPublic',
    key: 'customerIsPublic',
    width: 100,
    slot: 'customerIsPublic',
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

const actionColumn: ActionColumn<EdgeInfo> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'sync',
        icon: 'lucide:refresh-cw',
        text: $t('edge-management.features.instances.actions.sync'),
        tooltip: $t('edge-management.features.instances.actions.sync'),
        auth: Authority.TENANT_ADMIN,
        disabled: syncingIds.value.has(record.id?.id ?? ''),
        onClick: () => handleSync(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('edge-management.features.instances.actions.edit'),
        tooltip: $t('edge-management.features.instances.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('edge-management.features.instances.actions.delete'),
        tooltip: $t('edge-management.features.instances.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<EdgeInfo>({
  api: getTenantEdgeInfos,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  batch: {
    entityName: () => $t('edge-management.features.instances.title'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteEdges,
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

function handleEdit(record: EdgeInfo) {
  const edgeId = record.id?.id;
  if (!edgeId) return;

  formModalApi.setData({ edgeId }).open();
}

async function handleDelete(record: EdgeInfo) {
  const edgeId = record.id?.id;
  if (!edgeId) return;

  await confirm({
    title: $t('edge-management.features.instances.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('edge-management.features.instances.title'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteEdge(edgeId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleSync(record: EdgeInfo) {
  const edgeId = record.id?.id;
  if (!edgeId || syncingIds.value.has(edgeId)) return;
  await confirm({
    title: $t('edge-management.features.instances.actions.sync'),
    content: $t('edge-management.features.instances.sync.confirm', {
      name: record.name,
    }),
  });
  syncingIds.value.add(edgeId);
  try {
    await syncEdge(edgeId);
    message.success($t('edge-management.features.instances.sync.success'));
  } finally {
    syncingIds.value.delete(edgeId);
  }
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <Page auto-content-height class="edge-instances-page">
    <FormModal @success="handleSaved" />
    <BasicTable class="h-full" @register="registerTable">
      <template #tableTitle><EdgeNavigation /></template>
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
          {{ $t('edge-management.features.instances.actions.create') }}
        </Button>
      </template>

      <template #edgeName="{ record }">
        <RouterLink
          v-if="record.id"
          :to="{ name: 'EdgeDetail', params: { edgeId: record.id.id } }"
          class="text-primary hover:underline"
        >
          {{ record.name }}
        </RouterLink>
        <span v-else>{{ record.name }}</span>
      </template>
      <template #customerIsPublic="{ record }">
        <TbCheckbox
          :checked="!!record.customerIsPublic"
          disabled
          :aria-label="$t('edge-management.features.instances.fields.public')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
