<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { Notification } from '#/api/tb/notification';
import type { PageLink } from '#/types/tb';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Segmented } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteNotification,
  deleteNotifications,
  getNotifications,
} from '#/api/tb/notification';
import { Authority, NotificationStatus, notificationTypeLabel } from '#/enums';
import { useNotifications } from '#/hooks/use-notifications';
import { $t } from '#/locales';

defineOptions({ name: 'NotificationInboxList' });

const { hasAccessByRoles } = useAccess();
const notificationStream = useNotifications();

const searchInfo = reactive({
  searchText: '',
  unreadOnly: 'unread',
});

const tableColumns = computed<BasicColumn<Notification>[]>(() => [
  {
    title: $t('notification.fields.type'),
    dataIndex: 'type',
    key: 'type',
    width: 130,
    customRender: ({ record }) => notificationTypeLabel(record.type),
  },
  {
    title: $t('notification.fields.subject'),
    dataIndex: 'subject',
    key: 'subject',
    width: 230,
    align: 'left',
    customRender: ({ record }) =>
      record.subject?.replaceAll(/<[^>]+>/g, '') || '—',
  },
  {
    title: $t('notification.fields.text'),
    dataIndex: 'text',
    key: 'text',
    width: 280,
    align: 'left',
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
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

const actionColumn: ActionColumn<Notification> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'markRead',
        icon: 'lucide:circle-check',
        text: $t('notification.actions.markRead'),
        tooltip: $t('notification.actions.markRead'),
        auth: [
          Authority.SYS_ADMIN,
          Authority.TENANT_ADMIN,
          Authority.CUSTOMER_USER,
        ],
        disabled:
          record.status !== NotificationStatus.SENT ||
          notificationStream.status.value !== 'live',
        onClick: () => handleMarkRead(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('notification.actions.delete'),
        tooltip: $t('notification.actions.delete'),
        auth: [
          Authority.SYS_ADMIN,
          Authority.TENANT_ADMIN,
          Authority.CUSTOMER_USER,
        ],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<Notification>({
  api: fetchList,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('notification.menu'),
    enabled: () =>
      hasAccessByRoles([
        Authority.SYS_ADMIN,
        Authority.TENANT_ADMIN,
        Authority.CUSTOMER_USER,
      ]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteNotifications,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);
// 包括其他页面/会话产生的已读、删除和新通知，分页与筛选仍交给 REST。
watch(notificationStream.data, (update) => {
  if (update) void reload();
});

async function fetchList({
  unreadOnly,
  ...pageLink
}: PageLink & { unreadOnly: string }) {
  return getNotifications({
    ...pageLink,
    unreadOnly: unreadOnly === 'unread',
  });
}

function handleSearch() {
  return reload({ page: 1 });
}

async function handleDelete(record: Notification) {
  const notificationId = record.id?.id;
  if (!notificationId) return;

  await confirm({
    title: $t('notification.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('notification.menu'),
      name: record.subject,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteNotification(notificationId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleMarkRead(record: Notification) {
  if (!record.id?.id) {
    return;
  }
  notificationStream.markRead(record.id.id);
}

function handleMarkAllRead() {
  notificationStream.markRead();
}
</script>

<template>
  <BasicTable class="h-full" @register="registerTable">
    <template #query>
      <div
        v-if="
          notificationStream.error.value ||
          notificationStream.status.value === 'stale' ||
          notificationStream.actionError.value
        "
        class="flex w-full items-center gap-3 text-sm text-muted-foreground"
        role="status"
      >
        {{
          $t(
            notificationStream.status.value === 'stale'
              ? 'notification.bell.reconnecting'
              : 'notification.bell.error',
          )
        }}
        <Button size="small" @click="notificationStream.refresh">
          {{ $t('notification.bell.retry') }}
        </Button>
      </div>
      <Segmented
        v-model:value="searchInfo.unreadOnly"
        :options="[
          { label: $t('notification.features.filter.unread'), value: 'unread' },
          { label: $t('notification.features.filter.all'), value: 'all' },
        ]"
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
    <template #toolbar>
      <Button
        :disabled="
          notificationStream.status.value !== 'live' ||
          notificationStream.unreadCount.value === 0
        "
        v-access:role="[
          Authority.SYS_ADMIN,
          Authority.TENANT_ADMIN,
          Authority.CUSTOMER_USER,
        ]"
        @click="handleMarkAllRead"
      >
        <template #icon>
          <IconifyIcon
            icon="lucide:check-check"
            class="size-4"
            aria-hidden="true"
          />
        </template>
        {{ $t('notification.actions.markAllRead') }}
      </Button>
    </template>
  </BasicTable>
</template>
