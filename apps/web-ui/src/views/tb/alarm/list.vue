<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { AlarmInfo } from '#/api/tb/alarm';
import type { EntityId, PageLink } from '#/types/tb';

import { computed, h, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Select, Tag } from 'antdv-next';

import { RangePicker } from '#/adapter/component';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteAlarm,
  deleteAlarms,
  getAlarmsByEntity,
  getAllAlarms,
} from '#/api/tb/alarm';
import {
  AlarmSearchStatus,
  alarmSearchStatusOptions,
  alarmSeverityColor,
  alarmSeverityLabel,
  alarmStatusLabel,
  Authority,
} from '#/enums';
import { $t } from '#/locales';

import Detail from './detail.vue';

defineOptions({ name: 'AlarmList' });

const props = defineProps<{ entityId?: EntityId }>();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const router = useRouter();

const { hasAccessByRoles } = useAccess();

type DateRange = [Dayjs, Dayjs];

const searchInfo = reactive({
  searchText: '',
  searchStatus: AlarmSearchStatus.ANY,
  timeRange: null as DateRange | null,
});

const tableColumns = computed<BasicColumn<AlarmInfo>[]>(() => [
  {
    title: $t('alarm.fields.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
  {
    title: $t('alarm.fields.originator'),
    dataIndex: 'originatorName',
    key: 'originatorName',
    width: 150,
  },
  {
    title: $t('alarm.fields.type'),
    dataIndex: 'type',
    key: 'type',
    width: 160,
    sorter: true,
  },
  {
    title: $t('alarm.fields.severity'),
    dataIndex: 'severity',
    key: 'severity',
    width: 110,
    sorter: true,
    customRender: ({ record }) =>
      h(Tag, { color: alarmSeverityColor(record.severity) }, () =>
        alarmSeverityLabel(record.severity),
      ),
  },
  {
    key: 'status',
    customRender: ({ record }) => alarmStatusLabel(record),
    title: $t('alarm.fields.status'),
    width: 130,
  },
  {
    title: $t('alarm.fields.startTime'),
    dataIndex: 'startTs',
    key: 'startTs',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<AlarmInfo> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'detail',
        icon: 'lucide:eye',
        text: $t('alarm.actions.detail'),
        tooltip: $t('alarm.actions.detail'),
        onClick: () =>
          detailModalApi.setData({ alarmId: record.id?.id }).open(),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('alarm.actions.delete'),
        tooltip: $t('alarm.actions.delete'),
        auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<AlarmInfo>({
  api: fetchList,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('alarm.menu'),
    enabled: () =>
      hasAccessByRoles([Authority.TENANT_ADMIN, Authority.CUSTOMER_USER]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteAlarms,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);
watch(
  [() => props.entityId?.id, () => props.entityId?.entityType],
  handleSearch,
);

async function fetchList({
  timeRange,
  searchStatus,
  ...pageLink
}: PageLink & {
  timeRange: DateRange | null;
  searchStatus: AlarmSearchStatus;
}) {
  const params = {
    fetchOriginator: true,
    searchStatus,
    ...(timeRange && {
      startTime: timeRange[0].valueOf(),
      endTime: timeRange[1].valueOf(),
    }),
  };
  return props.entityId
    ? getAlarmsByEntity(
        props.entityId.entityType,
        props.entityId.id,
        pageLink,
        params,
      )
    : getAllAlarms(pageLink, params);
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleNavigateList(value: string | undefined) {
  if (!value) return;
  return router.push({ name: value });
}

async function handleDelete(record: AlarmInfo) {
  const alarmId = record.id?.id;
  if (!alarmId) return;

  await confirm({
    title: $t('alarm.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('alarm.menu'),
      name: record.type,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteAlarm(alarmId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}
</script>

<template>
  <component
    :is="entityId ? 'section' : Page"
    :auto-content-height="!entityId"
    :class="
      entityId &&
      'flex min-h-96 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card'
    "
  >
    <DetailModal @success="reload()" />
    <BasicTable
      :title-icon="
        hasAccessByRoles([Authority.TENANT_ADMIN])
          ? undefined
          : $route.meta.icon
      "
      class="h-full"
      @register="registerTable"
    >
      <template v-if="!entityId" #tableTitle>
        <VbenSegmented
          v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
          variant="navigation"
          :tabs="[
            {
              icon: $router.resolve({ name: 'AlarmList' }).meta.icon,
              label: $t('tb.menu.alarmList'),
              value: 'AlarmList',
            },
            {
              icon: $router.resolve({ name: 'AlarmRule' }).meta.icon,
              label: $t('tb.menu.alarmRule'),
              value: 'AlarmRule',
            },
          ]"
          model-value="AlarmList"
          @update:model-value="handleNavigateList"
        />
        <span v-else>
          {{ $t('tb.menu.alarmList') }}
        </span>
      </template>
      <template #query>
        <Select
          class="w-full sm:w-48 sm:max-w-full"
          v-model:value="searchInfo.searchStatus"
          :options="alarmSearchStatusOptions()"
          @change="handleSearch"
        />
        <RangePicker
          class="w-full sm:w-[22rem] sm:max-w-full"
          v-model:value="searchInfo.timeRange"
          allow-clear
          :placeholder="[$t('alarm.options.allTime'), '']"
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
    </BasicTable>
  </component>
</template>
