<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { Notification } from '#/api/tb/notification';

import { h, reactive } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Segmented } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '#/api/tb/notification';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { NotificationStatus, notificationTypeLabel } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'NotificationInboxList' });

const queryParams = reactive({
  textSearch: '',
  unreadOnly: 'unread',
});

async function fetch({ page, sort }: any) {
  return getNotifications({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
    unreadOnly: queryParams.unreadOnly === 'unread',
  });
}

const [Grid, gridApi] = useVbenVxeGrid<Notification>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'type',
        slots: {
          default: ({ row }) => notificationTypeLabel(row.type),
        },
        title: $t('tb.notification.fields.type'),
        width: 170,
      },
      {
        field: 'subject',
        align: 'left',
        minWidth: 200,
        slots: {
          default: ({ row }) =>
            h('div', {
              innerHTML: row.subject,
            }),
        },
        title: $t('tb.notification.fields.subject'),
      },
      {
        align: 'left',
        field: 'text',
        minWidth: 280,
        title: $t('tb.notification.fields.text'),
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
  } as VxeTableGridOptions<Notification>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: Notification): ActionItem[] {
  return [
    {
      icon: 'lucide:circle-check',
      onClick: () => onMarkRead(row),
      ifShow: row.status === NotificationStatus.SENT,
      tooltip: $t('tb.notification.actions.markRead'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function onMarkRead(row: Notification) {
  if (!row.id?.id) {
    return;
  }
  await markNotificationAsRead(row.id.id);
  message.success($t('tb.notification.actions.markReadSuccess'));
  gridApi.query();
}

async function onMarkAllRead() {
  await markAllNotificationsAsRead();
  message.success($t('tb.notification.actions.markAllReadSuccess'));
  gridApi.query();
}

async function deleteByRow(row: Notification) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteNotification(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: Notification) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.notification.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.notification.delete.title', { subject: row.subject }),
  }).catch(() => {});
}
</script>

<template>
  <Grid>
    <template #toolbar-actions>
      <Segmented
        v-model:value="queryParams.unreadOnly"
        :options="[
          { label: $t('tb.notification.filter.unread'), value: 'unread' },
          { label: $t('tb.notification.filter.all'), value: 'all' },
        ]"
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
    <template #toolbar-tools>
      <Button @click="onMarkAllRead">
        <template #icon>
          <IconifyIcon icon="lucide:check-check" />
        </template>
        {{ $t('tb.notification.actions.markAllRead') }}
      </Button>
    </template>
  </Grid>
</template>
