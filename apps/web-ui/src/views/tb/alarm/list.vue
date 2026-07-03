<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlarmInfo } from '#/api/tb/alarm';

import { h, reactive } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Segmented, Select, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  ackAlarm,
  clearAlarm,
  deleteAlarm,
  getAllAlarms,
} from '#/api/tb/alarm';
import { DEFAULT_SORT_FIELD } from '#/constants';
import {
  AlarmSearchStatus,
  alarmSearchStatusOptions,
  alarmSeverityColor,
  alarmSeverityLabel,
  alarmStatusLabel,
  Authority,
} from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'AlarmList' });

const router = useRouter();
const { hasAccessByRoles } = useAccess();

const queryParams = reactive({
  searchStatus: AlarmSearchStatus.ANY,
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getAllAlarms(
    {
      page: page.currentPage - 1,
      pageSize: page.pageSize,
      sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
      sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
      textSearch: queryParams.textSearch,
    },
    { searchStatus: queryParams.searchStatus },
  );
}

const [Grid, gridApi] = useVbenVxeGrid<AlarmInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'createdTime',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.alarm.fields.createdTime'),
        width: 170,
      },
      {
        field: 'originatorName',
        minWidth: 150,
        title: $t('tb.alarm.fields.originator'),
      },
      {
        field: 'type',
        minWidth: 160,
        sortable: true,
        title: $t('tb.alarm.fields.type'),
      },
      {
        field: 'severity',
        slots: {
          default: ({ row }) =>
            h(Tag, { color: alarmSeverityColor(row.severity) }, () =>
              alarmSeverityLabel(row.severity),
            ),
        },
        sortable: true,
        title: $t('tb.alarm.fields.severity'),
        width: 110,
      },
      {
        field: 'status',
        slots: {
          default: ({ row }) => alarmStatusLabel(row),
        },
        title: $t('tb.alarm.fields.status'),
        width: 130,
      },
      {
        field: 'startTs',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.alarm.fields.startTime'),
        width: 170,
      },
      {
        field: 'actions',
        fixed: 'right',
        align: 'center',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 120,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<AlarmInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: AlarmInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:check',
      ifShow: !row.acknowledged,
      onClick: () => onAck(row),
      tooltip: $t('tb.alarm.actions.ack'),
    },
    {
      icon: 'lucide:circle-x',
      ifShow: !row.cleared,
      onClick: () => onClear(row),
      tooltip: $t('tb.alarm.actions.clear'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function onAck(row: AlarmInfo) {
  if (!row.id?.id) {
    return;
  }
  await ackAlarm(row.id.id);
  message.success($t('tb.alarm.actions.ackSuccess'));
  gridApi.query();
}

async function onClear(row: AlarmInfo) {
  if (!row.id?.id) {
    return;
  }
  await clearAlarm(row.id.id);
  message.success($t('tb.alarm.actions.clearSuccess'));
  gridApi.query();
}

async function deleteByRow(row: AlarmInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteAlarm(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: AlarmInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.alarm.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.alarm.delete.title', { type: row.type }),
  }).catch(() => {});
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #table-title>
        <Segmented
          v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
          size="large"
          :options="[
            { label: $t('tb.menu.alarmList'), value: 'AlarmList' },
            { label: $t('tb.menu.alarmRule'), value: 'AlarmRule' },
          ]"
          value="AlarmList"
          @change="
            (value: number | string) => {
              router.push({ name: value as string });
            }
          "
        />
        <span v-else>
          {{ $t('tb.menu.alarmList') }}
        </span>
      </template>
      <template #toolbar-actions>
        <Select
          v-model:value="queryParams.searchStatus"
          :options="alarmSearchStatusOptions()"
          style="width: 140px"
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
    </Grid>
  </Page>
</template>
