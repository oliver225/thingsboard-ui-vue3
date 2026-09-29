<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { AuditLog, AuditLogQuery } from '#/api/tb/audit-log';
import type { EntityId, PageLink } from '#/types/tb';

import { computed, reactive, ref, watch } from 'vue';

import { JsonViewer, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, Tag } from 'antdv-next';
import dayjs from 'dayjs';

import { RangePicker } from '#/adapter/component';
import { BasicTable, useTable } from '#/adapter/table';
import { getAuditLogs, getAuditLogsByEntityId } from '#/api/tb/audit-log';
import {
  ActionStatus,
  actionStatusLabel,
  actionTypeLabel,
  actionTypeOptions,
  Authority,
  entityTypeLabel,
} from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'AuditLogsList' });

const props = defineProps<{ entityId?: EntityId }>();

type DateRange = [Dayjs, Dayjs] | null;

const searchInfo = reactive<{ searchText: string; timeRange: DateRange }>({
  searchText: '',
  timeRange: [dayjs().startOf('day'), dayjs()],
});

const detailRecord = ref<AuditLog | null>(null);

const [DetailModal, detailModalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) {
      detailRecord.value = null;
      return;
    }
    const data = (detailModalApi.getData() as { record?: AuditLog }) ?? {};
    detailRecord.value = data.record ?? null;
    detailModalApi.setState({ title: $t('audit-log.features.detail.title') });
  },
});

const tableColumns = computed<BasicColumn<AuditLog>[]>(() => [
  {
    title: $t('audit-log.fields.userName'),
    dataIndex: 'userName',
    key: 'userName',
    width: 190,
    sorter: true,
  },
  {
    title: $t('audit-log.fields.entityType'),
    dataIndex: ['entityId', 'entityType'],
    key: 'entityType',
    width: 150,
    sorter: true,
    ifShow: !props.entityId,
    customRender: ({ value }) => entityTypeLabel(value) || '—',
  },
  {
    title: $t('audit-log.fields.entityName'),
    dataIndex: 'entityName',
    key: 'entityName',
    width: 190,
    sorter: true,
    ifShow: !props.entityId,
  },
  {
    title: $t('audit-log.fields.actionType'),
    dataIndex: 'actionType',
    key: 'actionType',
    width: 190,
    filters: actionTypeOptions().map((item) => ({
      text: item.label,
      value: item.value,
    })),
    filterMultiple: true,
    customRender: ({ value }) => actionTypeLabel(value) || '—',
  },
  {
    title: $t('audit-log.fields.actionStatus'),
    dataIndex: 'actionStatus',
    key: 'actionStatus',
    width: 110,
    sorter: true,
    slot: 'actionStatus',
  },
  {
    title: $t('audit-log.fields.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<AuditLog> = {
  align: 'center',
  width: 80,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'detail',
        icon: 'lucide:ellipsis',
        text: $t('tb.common.detail'),
        tooltip: $t('tb.common.detail'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleDetail(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<AuditLog>({
  api: fetchList,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  tableSetting: { redo: true, setting: true, size: true },
  defaultRowSelection: null,
});

watch(() => searchInfo.searchText, handleSearch);
watch(
  [() => props.entityId?.id, () => props.entityId?.entityType],
  handleSearch,
);

async function fetchList({
  timeRange,
  ...pageLink
}: PageLink & { actionType?: string[]; timeRange: DateRange }) {
  const actionTypes = pageLink.actionType ?? [];
  const params: AuditLogQuery = {
    ...pageLink,
    actionTypes: actionTypes.join(',') || undefined,
    endTime: timeRange?.[1].valueOf(),
    startTime: timeRange?.[0].valueOf(),
    textSearch: pageLink.textSearch,
  };
  return props.entityId
    ? getAuditLogsByEntityId(
        props.entityId.entityType,
        props.entityId.id,
        params,
      )
    : getAuditLogs(params);
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleDetail(record: AuditLog) {
  detailModalApi.setData({ record }).open();
}
</script>

<template>
  <DetailModal
    class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
    :cancel-text="$t('tb.common.close')"
    :show-confirm-button="false"
  >
    <JsonViewer
      boxed
      copyable
      expanded
      :value="detailRecord?.actionData ?? {}"
    />
  </DetailModal>

  <component
    :is="entityId ? 'section' : Page"
    :auto-content-height="!entityId"
    :class="
      entityId &&
      'flex min-h-96 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card'
    "
  >
    <BasicTable
      :title-icon="entityId ? undefined : $route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="entityId ? undefined : $t('tb.menu.auditLogs')"
    >
      <template #query>
        <RangePicker
          class="w-full sm:w-[22rem] sm:max-w-full"
          v-model:value="searchInfo.timeRange"
          allow-clear
          show-time
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
      <template #actionStatus="{ record }">
        <Tag
          v-if="record.actionStatus"
          :color="
            record.actionStatus === ActionStatus.SUCCESS ? 'success' : 'error'
          "
        >
          {{ actionStatusLabel(record.actionStatus) }}
        </Tag>
      </template>
    </BasicTable>
  </component>
</template>
