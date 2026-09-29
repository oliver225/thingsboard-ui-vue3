<script setup lang="ts">
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { Queue } from '#/api/tb/queue';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { deleteQueue, deleteQueues, getQueues } from '#/api/tb/queue';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import QueueForm from './form.vue';

defineOptions({ name: 'SettingsQueuesList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: QueueForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<Queue>[]>(() => [
  {
    title: $t('settings.features.queues.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 180,
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('settings.features.queues.fields.topic'),
    dataIndex: 'topic',
    key: 'topic',
    width: 220,
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('settings.features.queues.fields.partitions'),
    dataIndex: 'partitions',
    key: 'partitions',
    width: 100,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('settings.features.queues.fields.submitStrategy'),
    dataIndex: 'submitStrategy',
    key: 'submitStrategy',
    width: 210,
    slot: 'submitStrategy',
  },
  {
    title: $t('settings.features.queues.fields.processingStrategy'),
    dataIndex: 'processingStrategy',
    key: 'processingStrategy',
    width: 240,
    slot: 'processingStrategy',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) =>
      value === null || value === undefined || value === ''
        ? '—'
        : formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<Queue> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('settings.features.queues.actions.edit'),
        tooltip: $t('settings.features.queues.actions.edit'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('settings.features.queues.actions.delete'),
        tooltip: $t('settings.features.queues.actions.delete'),
        auth: Authority.SYS_ADMIN,
        disabled: record.name === 'Main',
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<Queue>({
  api: getQueues,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('settings.sections.navigation.queues'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) => !!record.id?.id && record.name !== 'Main',
    deleteApi: deleteQueues,
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

function handleEdit(record: Queue) {
  const queueId = record.id?.id;
  if (!queueId) return;
  formModalApi.setData({ queueId }).open();
}

async function handleDelete(record: Queue) {
  const queueId = record.id?.id;
  if (!queueId) return;

  await confirm({
    title: $t('settings.features.queues.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('settings.sections.navigation.queues'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteQueue(queueId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleSaved() {
  return reload();
}

function queueStrategyLabel(prefix: string, value?: string) {
  return value ? $t(`${prefix}.${value}`) : '--';
}
</script>

<template>
  <div class="h-full min-h-[420px]">
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('settings.sections.navigation.queues')"
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
          v-access:role="[Authority.SYS_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('settings.features.queues.actions.create') }}
        </Button>
      </template>
      <template #submitStrategy="{ record }">
        <Tag color="blue">
          {{
            queueStrategyLabel(
              'settings.features.queues.submitStrategy',
              record.submitStrategy?.type,
            )
          }}
        </Tag>
      </template>
      <template #processingStrategy="{ record }">
        <Tag color="green">
          {{
            queueStrategyLabel(
              'settings.features.queues.processingStrategy',
              record.processingStrategy?.type,
            )
          }}
        </Tag>
      </template>
    </BasicTable>
  </div>
</template>
