<script setup lang="ts">
import type { TableBatch } from '@vben/table';

import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { AttributeData } from '#/api/tb/telemetry';
import type { EntityId } from '#/types/tb';

import { computed, reactive, shallowRef, watch } from 'vue';

import { useVbenModal, VbenButton, VbenIconButton } from '@vben/common-ui';
import { IconifyIcon, RotateCw } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Badge } from '@vben-core/shadcn-ui';

import { Input } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { CopyText } from '#/components/widget';
import { useWs } from '#/hooks/use-ws';
import { $t } from '#/locales';

import TelemetryDelete from './telemetry-delete.vue';
import {
  formatTelemetryValue,
  getAttributeValueType,
  mergeTelemetry,
} from './utils';
import ValueForm from './value-form.vue';

const props = defineProps<{ entityId: EntityId }>();
const searchInfo = reactive({
  searchText: '',
});
const dataSource = shallowRef<AttributeData[]>([]);
const { data, loading, refresh } = useWs(() => ({
  type: 'TIMESERIES',
  entityType: props.entityId.entityType,
  entityId: props.entityId.id,
  scope: 'LATEST_TELEMETRY',
}));
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ValueForm,
  destroyOnClose: true,
});
const [DeleteModal, deleteModalApi] = useVbenModal({
  connectedComponent: TelemetryDelete,
  destroyOnClose: true,
});

const visualDatasource = computed(() => {
  const search = searchInfo.searchText.trim().toLocaleLowerCase();
  return dataSource.value.filter(
    (row) =>
      row.key.toLocaleLowerCase().includes(search) ||
      formatTelemetryValue(row.value).toLocaleLowerCase().includes(search),
  );
});

const columns = computed<BasicColumn<AttributeData>[]>(() => [
  {
    title: $t('attribute.fields.key'),
    dataIndex: 'key',
    key: 'key',
    width: 240,
    slot: 'key',
    sorter: (a, b) => a.key.localeCompare(b.key),
    defaultSortOrder: 'ascend',
  },
  {
    title: $t('attribute.fields.valueType'),
    key: 'valueType',
    width: 120,
    slot: 'valueType',
  },
  {
    title: $t('attribute.fields.value'),
    dataIndex: 'value',
    key: 'value',
    minWidth: 240,
    slot: 'value',
    align: 'left',
  },
  {
    title: $t('attribute.fields.lastUpdateTs'),
    dataIndex: 'lastUpdateTs',
    key: 'lastUpdateTs',
    width: 190,
    sorter: (a, b) => a.lastUpdateTs - b.lastUpdateTs,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<AttributeData> = {
  width: 110,
  actionProps: (record: AttributeData) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'delete',
        text: $t('tb.common.delete'),
        tooltip: $t('tb.common.delete'),
        icon: 'lucide:trash-2',
        danger: true,
        onClick: () => deleteModalApi.setData({ records: [record] }).open(),
      },
    ],
  }),
};
const batchAction: TableBatch<AttributeData> = {
  entityName: () => $t('telemetry.menu'),
  actions: [
    {
      key: 'delete',
      label: () => $t('tb.common.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      onClick: ({ rows }) => {
        deleteModalApi.setData({ records: rows }).open();
      },
    },
  ],
};

const [registerTable, { setSelectedRowKeys, selection }] =
  useTable<AttributeData>({
    rowKey: 'key',
    columns,
    actionColumn,
    batch: batchAction,
    dataSource: visualDatasource,
    loading,
    searchInfo,
    pagination: false,
    rowSelection: null,
    tableSetting: { redo: false, setting: true, size: true },
  });

// WS 首次返回全部键，后续只返回变化的键；刷新、重连时重新开始合并。
watch(
  data,
  (message) => {
    if (!message) {
      dataSource.value = [];
      if (selection.value.count) setSelectedRowKeys([]);
      return;
    }
    if ('subscriptionId' in message) {
      dataSource.value = mergeTelemetry(dataSource.value, message.data);
    }
  },
  { flush: 'sync' },
);
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground"
  >
    <FormModal
      :entity-id="entityId"
      scope="LATEST_TELEMETRY"
      @success="refresh"
    />
    <DeleteModal :entity-id="entityId" @success="refresh" />
    <BasicTable class="h-full min-h-96 flex-1" @register="registerTable">
      <template #query>
        <Input
          v-model:value="searchInfo.searchText"
          allow-clear
          class="w-full sm:w-72"
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('telemetry.messages.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="size-4 text-muted-foreground"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <VbenButton @click="formModalApi.setData({}).open()">
          <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />{{
            $t('telemetry.actions.add')
          }}
        </VbenButton>
        <VbenIconButton
          class="my-0 mr-1 rounded-md"
          :tooltip="$t('tb.common.refresh')"
          tooltip-side="top"
          :aria-label="$t('tb.common.refresh')"
          :disabled="loading"
          @click="refresh"
        >
          <RotateCw class="size-4" />
        </VbenIconButton>
      </template>

      <template #key="{ record }">
        <CopyText :text="record.key" />
      </template>

      <template #valueType="{ record }">
        <Badge variant="info" class="font-normal">
          {{
            $t(
              `attribute.options.valueType.${getAttributeValueType(record.value)}`,
            )
          }}
        </Badge>
      </template>

      <template #value="{ record }">
        <CopyText :text="formatTelemetryValue(record.value)" />
      </template>
    </BasicTable>
  </section>
</template>
