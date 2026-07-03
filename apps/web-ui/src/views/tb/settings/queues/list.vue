<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Queue } from '#/api/tb/queue';

import { reactive } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteQueue, getQueues } from '#/api/tb/queue';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';

defineOptions({ name: 'SettingsQueuesList' });

const queryParams = reactive({
  textSearch: '',
});

function queueStrategyLabel(prefix: string, value?: string) {
  return value ? $t(`${prefix}.${value}`) : '--';
}

async function fetch({ page, sort }: any) {
  return getQueues({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<Queue>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 180,
        sortable: true,
        title: $t('tb.queue.fields.name'),
      },
      {
        field: 'topic',
        minWidth: 220,
        sortable: true,
        title: $t('tb.queue.fields.topic'),
      },
      {
        field: 'partitions',
        title: $t('tb.queue.fields.partitions'),
        width: 100,
      },
      {
        field: 'submitStrategy',
        minWidth: 210,
        slots: { default: 'submitStrategy' },
        title: $t('tb.queue.fields.submitStrategy'),
      },
      {
        field: 'processingStrategy',
        minWidth: 240,
        slots: { default: 'processingStrategy' },
        title: $t('tb.queue.fields.processingStrategy'),
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
        width: 100,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<Queue>,
});

function getActionItems(row: Queue): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

async function deleteByRow(row: Queue) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteQueue(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: Queue) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.queue.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.queue.delete.title', { name: row.name }),
  }).catch(() => {});
}
</script>

<template>
  <div class="h-full">
    <Grid :table-title="$t('tb.settings.queues')">
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

      <template #submitStrategy="{ row }">
        <Tag color="blue">
          {{
            queueStrategyLabel(
              'tb.queue.submitStrategy',
              row.submitStrategy?.type,
            )
          }}
        </Tag>
      </template>

      <template #processingStrategy="{ row }">
        <Tag color="green">
          {{
            queueStrategyLabel(
              'tb.queue.processingStrategy',
              row.processingStrategy?.type,
            )
          }}
        </Tag>
      </template>
    </Grid>
  </div>
</template>
