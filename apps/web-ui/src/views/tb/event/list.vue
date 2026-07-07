<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbUserInfo } from '#/api/core/user';
import type { EventInfo } from '#/api/tb/event';
import type { EntityType } from '#/enums';

import { computed, reactive, ref } from 'vue';

import { JsonViewer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { DatePicker, Input, Select } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { EventType, getEventsByType } from '#/api/tb/event';
import { $t } from '#/locales';

defineOptions({ name: 'EventTable' });

const props = defineProps<{
  entityId: string;
  entityType: EntityType | string;
}>();

const RangePicker = DatePicker.RangePicker;
type DateRange = [Dayjs, Dayjs];

const userStore = useUserStore();
const detailRecord = ref<EventInfo | null>(null);
const queryParams = reactive<{
  eventType: EventType;
  textSearch: string;
  timeRange: DateRange;
}>({
  eventType: EventType.LC_EVENT,
  textSearch: '',
  timeRange: [dayjs().subtract(1, 'day'), dayjs()],
});

const tenantId = computed(
  () => (userStore.userInfo as null | TbUserInfo)?.tbUser?.tenantId?.id ?? '',
);

const eventTypeOptions = computed(() => [
  { label: $t('tb.event.type.LC_EVENT'), value: EventType.LC_EVENT },
  { label: $t('tb.event.type.ERROR'), value: EventType.ERROR },
  { label: $t('tb.event.type.STATS'), value: EventType.STATS },
]);

const rangePresets = computed(() => [
  {
    label: $t('tb.common.range.last1Hour'),
    value: [dayjs().subtract(1, 'hour'), dayjs()] as DateRange,
  },
  {
    label: $t('tb.common.range.last6Hours'),
    value: [dayjs().subtract(6, 'hour'), dayjs()] as DateRange,
  },
  {
    label: $t('tb.common.range.last1Day'),
    value: [dayjs().subtract(1, 'day'), dayjs()] as DateRange,
  },
  {
    label: $t('tb.common.range.last3Days'),
    value: [dayjs().subtract(3, 'day'), dayjs()] as DateRange,
  },
  {
    label: $t('tb.common.range.last7Days'),
    value: [dayjs().subtract(7, 'day'), dayjs()] as DateRange,
  },
]);

async function fetch({ page, sort }: any) {
  const [start, end] = queryParams.timeRange;
  if (!tenantId.value) {
    return { data: [], totalElements: 0 };
  }

  return getEventsByType(
    props.entityType,
    props.entityId,
    queryParams.eventType,
    {
      page: page.currentPage - 1,
      pageSize: page.pageSize,
      sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
      sortProperty:
        sort?.field === 'createdTime' ? 'ts' : (sort?.field ?? 'ts'),
      endTime: end?.valueOf() || 0,
      startTime: start?.valueOf() || 0,
      tenantId: tenantId.value,
      textSearch: queryParams.textSearch,
    },
  );
}

const [DetailModal, detailModalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) {
      detailRecord.value = null;
      return;
    }
    const data = detailModalApi.getData<{ record?: EventInfo }>() ?? {};
    detailRecord.value = data.record ?? null;
    detailModalApi.setState({ title: $t('tb.event.detail.title') });
  },
});

const [Grid, gridApi] = useVbenVxeGrid<EventInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'createdTime',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.event.fields.createdTime'),
        width: 170,
      },
      {
        field: 'type',
        minWidth: 130,
        sortable: true,
        title: $t('tb.event.fields.type'),
      },
      {
        field: 'uid',
        minWidth: 210,
        title: $t('tb.event.fields.uid'),
      },
      {
        field: 'actions',
        fixed: 'right',
        title: $t('tb.common.actions'),
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        width: 100,
      },
    ],
    proxyConfig: { ajax: { query: fetch } },
    sortConfig: {
      defaultSort: { field: 'createdTime', order: 'desc' },
      remote: true,
    },
  } as VxeTableGridOptions<EventInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: EventInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:ellipsis',
      onClick: () => detailModalApi.setData({ record: row }).open(),
      tooltip: $t('tb.common.detail'),
    },
  ];
}
</script>

<template>
  <DetailModal
    class="w-1/2"
    :centered="true"
    :cancel-text="$t('tb.common.close')"
    :destroy-on-close="true"
    :fullscreen-button="false"
    :show-confirm-button="false"
  >
    <JsonViewer boxed copyable expanded :value="detailRecord?.body ?? {}" />
  </DetailModal>

  <Grid>
    <template #toolbar-actions>
      <Select
        v-model:value="queryParams.eventType"
        :options="eventTypeOptions"
        style="width: 120px"
        @change="onSearch"
      />
      <RangePicker
        v-model:value="queryParams.timeRange"
        class="ml-2 w-[330px]"
        :allow-clear="false"
        format="YYYY-MM-DD HH:mm"
        :presets="rangePresets"
        show-time
        @change="onSearch"
      />
      <div class="w-64">
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
  </Grid>
</template>
