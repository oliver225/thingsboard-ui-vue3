<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AuditLog, AuditLogQuery } from '#/api/tb/audit-log';
import type { EntityType } from '#/enums';

import { computed, reactive, ref } from 'vue';

import { JsonViewer, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { DatePicker, Input, Tag } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAuditLogs, getAuditLogsByEntityId } from '#/api/tb/audit-log';
import { DEFAULT_SORT_FIELD } from '#/constants';
import {
  ActionStatus,
  actionStatusLabel,
  actionTypeLabel,
  actionTypeOptions,
  entityTypeLabel,
} from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'AuditLogsList' });

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
    entityId?: string;
    entityType?: EntityType | string;
  }>(),
  { embedded: false, entityId: undefined, entityType: undefined },
);

const RangePicker = DatePicker.RangePicker;

type DateRange = [Dayjs, Dayjs];

const queryParams = reactive<{
  textSearch: string;
  timeRange: DateRange;
}>({
  textSearch: '',
  timeRange: [dayjs().startOf('day'), dayjs()],
});

const detailRecord = ref<AuditLog | null>(null);

const rangePresets = computed(() => [
  {
    label: $t('tb.common.range.today'),
    value: [dayjs().startOf('day'), dayjs()] as DateRange,
  },
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

async function fetch({ filters, page, sort }: any) {
  const [start, end] = queryParams.timeRange;
  const actionTypes =
    filters?.find((item: any) => item.field === 'actionType')?.values ?? [];
  const params: AuditLogQuery = {
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    actionTypes: actionTypes.join(',') || undefined,
    endTime: end?.valueOf() || 0,
    startTime: start?.valueOf() || 0,
    textSearch: queryParams.textSearch,
  };
  return props.entityType && props.entityId
    ? getAuditLogsByEntityId(props.entityType, props.entityId, params)
    : getAuditLogs(params);
}

const [DetailModal, detailModalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) {
      detailRecord.value = null;
      return;
    }
    const data = detailModalApi.getData<{ record?: AuditLog }>() ?? {};
    detailRecord.value = data.record ?? null;
    detailModalApi.setState({ title: $t('tb.auditLog.detail.title') });
  },
});

const [Grid, gridApi] = useVbenVxeGrid<AuditLog>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'createdTime',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.auditLog.fields.createdTime'),
        width: 170,
      },
      {
        field: 'userName',
        minWidth: 190,
        sortable: true,
        title: $t('tb.auditLog.fields.userName'),
      },
      {
        field: 'entityId.entityType',
        minWidth: 150,
        formatter: ({ cellValue }) => entityTypeLabel(cellValue) || '-',
        sortable: true,
        title: $t('tb.auditLog.fields.entityType'),
      },
      {
        field: 'entityName',
        minWidth: 190,
        sortable: true,
        title: $t('tb.auditLog.fields.entityName'),
      },
      {
        field: 'actionType',
        filterMultiple: true,
        minWidth: 190,
        filters: actionTypeOptions(),
        formatter: ({ cellValue }) => actionTypeLabel(cellValue) || '-',
        title: $t('tb.auditLog.fields.actionType'),
      },
      {
        field: 'actionStatus',
        slots: { default: 'actionStatus' },
        sortable: true,
        title: $t('tb.auditLog.fields.actionStatus'),
        width: 110,
      },
      {
        field: 'actions',
        fixed: 'right',
        title: $t('tb.common.actions'),
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        width: 100,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<AuditLog>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: AuditLog): ActionItem[] {
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
    <JsonViewer
      boxed
      copyable
      expanded
      :value="detailRecord?.actionData ?? {}"
    />
  </DetailModal>

  <Grid v-if="embedded">
    <template #toolbar-actions>
      <RangePicker
        v-model:value="queryParams.timeRange"
        class="w-[330px]"
        :allow-clear="false"
        format="YYYY-MM-DD HH:mm"
        :presets="rangePresets"
        show-time
        @change="onSearch"
      />
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
    <template #actionStatus="{ row }">
      <Tag
        v-if="row.actionStatus"
        :color="row.actionStatus === ActionStatus.SUCCESS ? 'success' : 'error'"
      >
        {{ actionStatusLabel(row.actionStatus) }}
      </Tag>
    </template>
  </Grid>

  <Page v-else auto-content-height>
    <Grid :table-title="$t('tb.menu.auditLogs')">
      <template #toolbar-actions>
        <RangePicker
          v-model:value="queryParams.timeRange"
          class="w-[330px]"
          :allow-clear="false"
          format="YYYY-MM-DD HH:mm"
          :presets="rangePresets"
          show-time
          @change="onSearch"
        />
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
      <template #actionStatus="{ row }">
        <Tag
          v-if="row.actionStatus"
          :color="
            row.actionStatus === ActionStatus.SUCCESS ? 'success' : 'error'
          "
        >
          {{ actionStatusLabel(row.actionStatus) }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
