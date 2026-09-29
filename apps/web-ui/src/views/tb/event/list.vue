<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbUserInfo } from '#/api/core/user';
import type { EventInfo, EventType } from '#/api/tb/event';
import type { EntityId, PageLink } from '#/types/tb';

import { computed, reactive, ref, watch } from 'vue';

import {
  confirm,
  JsonViewer,
  useVbenModal,
  VbenIconButton,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Badge } from '@vben-core/shadcn-ui';

import { Input, message, Select } from 'antdv-next';
import dayjs from 'dayjs';

import { RangePicker } from '#/adapter/component';
import { parseJsonText } from '#/adapter/component/code-editor/utils/json';
import { BasicTable, useTable } from '#/adapter/table';
import { clearEvents, getEventsByFilter } from '#/api/tb/event';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'EntityEvents' });

const props = defineProps<{
  entityId: EntityId;
  eventTypes: EventType[];
  tenantId?: string;
}>();
const userStore = useUserStore();

type DateRange = [Dayjs, Dayjs] | null;

const searchInfo = reactive({
  searchText: '',
  eventType: props.eventTypes[0],
  timeRange: [dayjs().subtract(1, 'day'), dayjs()] as DateRange,
});

const eventTypeOptions = computed(() =>
  props.eventTypes.map((value) => ({
    value,
    label: $t(`event.options.type.${value}`),
  })),
);

const detailRecord = ref<EventInfo>();
const detailBody = computed(() => {
  const body: Record<string, unknown> = { ...detailRecord.value?.body };
  if (detailRecord.value?.type === 'DEBUG_CALCULATED_FIELD') {
    for (const key of ['arguments', 'result']) {
      if (typeof body[key] === 'string') {
        const parsed = parseJsonText(body[key]);
        if (parsed.valid) body[key] = parsed.value;
      }
    }
  }
  return body;
});

const [DetailModal, detailModalApi] = useVbenModal<{ record: EventInfo }>({
  title: $t('event.features.detail.title'),
  onOpenChange(open) {
    detailRecord.value = open ? detailModalApi.getData()?.record : undefined;
  },
});

const tableColumns = computed<BasicColumn<EventInfo>[]>(() => [
  {
    title: $t('event.fields.server'),
    dataIndex: ['body', 'server'],
    key: 'server',
    width: 180,
  },
  {
    title: $t('event.fields.method'),
    dataIndex: ['body', 'method'],
    key: 'method',
    ifShow: searchInfo.eventType === 'ERROR',
    width: 200,
  },
  {
    title: $t('event.fields.event'),
    dataIndex: ['body', 'event'],
    key: 'event',
    ifShow: searchInfo.eventType === 'LC_EVENT',
    width: 200,
  },
  {
    title: $t('event.fields.messagesProcessed'),
    dataIndex: ['body', 'messagesProcessed'],
    key: 'messagesProcessed',
    ifShow: searchInfo.eventType === 'STATS',
    width: 160,
  },
  {
    title: $t('event.fields.errorsOccurred'),
    dataIndex: ['body', 'errorsOccurred'],
    key: 'errorsOccurred',
    ifShow: searchInfo.eventType === 'STATS',
    width: 160,
  },
  {
    title: $t('event.fields.direction'),
    dataIndex: ['body', 'type'],
    key: 'direction',
    ifShow: searchInfo.eventType === 'DEBUG_RULE_NODE',
    width: 100,
  },
  {
    title: $t('event.fields.entityId'),
    dataIndex: ['body', 'entityId'],
    key: 'entityId',
    ifShow: ['DEBUG_CALCULATED_FIELD', 'DEBUG_RULE_NODE'].includes(
      searchInfo.eventType ?? '',
    ),
    width: 240,
  },
  {
    title: $t('event.fields.messageType'),
    dataIndex: ['body', 'msgType'],
    key: 'msgType',
    ifShow: ['DEBUG_CALCULATED_FIELD', 'DEBUG_RULE_NODE'].includes(
      searchInfo.eventType ?? '',
    ),
    width: 180,
  },
  {
    title: $t('event.fields.message'),
    dataIndex: ['body', 'message'],
    key: 'message',
    ifShow: searchInfo.eventType === 'DEBUG_RULE_CHAIN',
    width: 240,
  },
  {
    title: $t('event.fields.status'),
    key: 'status',
    slot: 'status',
    ifShow:
      searchInfo.eventType !== 'STATS' && searchInfo.eventType !== 'ERROR',
    width: 100,
  },
  {
    title: $t('event.fields.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<EventInfo> = {
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
        onClick: () => handleDetail(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<EventInfo>({
  api: fetchList,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? record.uid ?? String(record.createdTime),
  tableSetting: { redo: true, setting: true, size: true },
  defaultRowSelection: null,
});

watch([() => searchInfo.searchText, () => searchInfo.eventType], handleSearch);
watch([() => props.entityId.id, () => props.entityId.entityType], handleSearch);
watch(
  () => props.eventTypes,
  (types) => {
    if (!searchInfo.eventType || !types.includes(searchInfo.eventType)) {
      searchInfo.eventType = types[0];
    }
  },
);

async function fetchList({
  eventType,
  timeRange,
  textSearch,
  ...pageLink
}: PageLink & { eventType?: EventType; timeRange: DateRange }) {
  if (!eventType)
    return { data: [], totalElements: 0, totalPages: 0, hasNext: false };
  return getEventsByFilter(
    props.entityId,
    { eventType, server: textSearch || undefined },
    {
      ...pageLink,
      tenantId:
        props.tenantId ??
        (props.entityId.entityType === EntityType.TENANT
          ? props.entityId.id
          : ((userStore.userInfo as TbUserInfo).tbUser.tenantId?.id ?? '')),
      sortProperty: 'ts',
      startTime: timeRange?.[0].valueOf(),
      endTime: timeRange?.[1].valueOf(),
    },
  );
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleDetail(record: EventInfo) {
  detailModalApi.setData({ record }).open();
}

async function handleClearEvents() {
  await confirm({
    title: $t('event.actions.clear'),
    content: $t('event.messages.clearConfirm'),
    icon: 'error',
    confirmText: $t('event.actions.clear'),
    confirmButtonProps: { variant: 'destructive' },
    async beforeClose({ isConfirm }) {
      if (!isConfirm || !searchInfo.eventType) return true;
      try {
        await clearEvents(
          props.entityId,
          {
            eventType: searchInfo.eventType,
            server: searchInfo.searchText.trim() || undefined,
          },
          {
            startTime: searchInfo.timeRange?.[0].valueOf(),
            endTime: searchInfo.timeRange?.[1].valueOf(),
          },
        );
        message.success($t('event.messages.cleared'));
        await handleSearch();
        return true;
      } catch {
        return false;
      }
    },
  });
}
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-card"
  >
    <DetailModal
      class="w-[calc(100%_-_2rem)] max-w-3xl rounded-xl"
      :cancel-text="$t('tb.common.close')"
      :show-confirm-button="false"
    >
      <JsonViewer boxed copyable expanded :value="detailBody" />
    </DetailModal>
    <BasicTable class="event-table h-full" @register="registerTable">
      <template #query>
        <Select
          v-model:value="searchInfo.eventType"
          class="w-full sm:w-36 sm:max-w-full"
          :options="eventTypeOptions"
          :aria-label="$t('event.fields.type')"
        />
        <RangePicker
          v-model:value="searchInfo.timeRange"
          class="w-full sm:w-[22rem] sm:max-w-full"
          allow-clear
          show-time
          @change="handleSearch"
        />
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-64 sm:max-w-full"
          allow-clear
          :aria-label="$t('event.fields.server')"
          :placeholder="$t('event.messages.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <VbenIconButton
          class="size-8 shrink-0 rounded-md text-destructive hover:text-destructive"
          :tooltip="$t('event.actions.clear')"
          tooltip-side="top"
          :aria-label="$t('event.actions.clear')"
          :disabled="!searchInfo.eventType"
          @click="handleClearEvents"
        >
          <IconifyIcon
            icon="lucide:trash-2"
            class="size-4.5"
            aria-hidden="true"
          />
        </VbenIconButton>
      </template>
      <template #status="{ record }">
        <Badge
          :variant="
            record.body.success === false || record.body.error
              ? 'destructive'
              : 'success'
          "
        >
          {{
            record.body.success === false || record.body.error
              ? $t('event.options.failure')
              : $t('event.options.success')
          }}
        </Badge>
      </template>
    </BasicTable>
  </section>
</template>

<style scoped>
.event-table :deep(.tb-basic-table-header__toolbar) {
  gap: 0;
}

.event-table :deep(.tb-basic-table-header__toolbar button svg) {
  width: 1.125rem;
  height: 1.125rem;
}
</style>
