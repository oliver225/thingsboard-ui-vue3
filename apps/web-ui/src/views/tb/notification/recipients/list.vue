<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { NotificationTarget } from '#/api/tb/notification-target';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteNotificationTarget,
  deleteNotificationTargets,
  getNotificationTargets,
} from '#/api/tb/notification-target';
import {
  Authority,
  notificationTargetConfigTypeLabel,
  NotificationTargetType,
  notificationTargetTypeLabel,
} from '#/enums';
import { $t } from '#/locales';

import RecipientForm from './form.vue';

defineOptions({ name: 'NotificationRecipientsList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RecipientForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<NotificationTarget>[]>(() => [
  {
    title: $t('notification.features.recipient.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 180,
    align: 'left',
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    key: 'type',
    slot: 'type',
    title: $t('notification.features.recipient.fields.type'),
    width: 150,
  },
  {
    key: 'filterType',
    slot: 'filterType',
    title: $t('notification.features.recipient.fields.filterType'),
    width: 160,
  },
  {
    title: $t('notification.features.recipient.fields.description'),
    dataIndex: ['configuration', 'description'],
    key: 'description',
    width: 200,
    align: 'left',
    slot: 'description',
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

const actionColumn: ActionColumn<NotificationTarget> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('notification.features.recipient.actions.edit'),
        tooltip: $t('notification.features.recipient.actions.edit'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('notification.features.recipient.actions.delete'),
        tooltip: $t('notification.features.recipient.actions.delete'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<NotificationTarget>({
  api: getNotificationTargets,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('notification.sections.recipients'),
    enabled: () =>
      hasAccessByRoles([Authority.SYS_ADMIN, Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteNotificationTargets,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: NotificationTarget) {
  const notificationTargetId = record.id?.id;
  if (!notificationTargetId) return;
  formModalApi.setData({ notificationTargetId }).open();
}

async function handleDelete(record: NotificationTarget) {
  const notificationTargetId = record.id?.id;
  if (!notificationTargetId) return;

  await confirm({
    title: $t('notification.features.recipient.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('notification.sections.recipients'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteNotificationTarget(notificationTargetId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <FormModal @success="handleSaved" />
  <BasicTable class="h-full" @register="registerTable">
    <template #query>
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
        v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
        type="primary"
        @click="handleCreate"
      >
        <template #icon>
          <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
        </template>
        {{ $t('notification.features.recipient.actions.create') }}
      </Button>
    </template>
    <template #type="{ record }">
      <Tag color="blue">
        {{ notificationTargetTypeLabel(record.configuration?.type) }}
      </Tag>
    </template>
    <template #filterType="{ record }">
      <Tag
        v-if="
          record.configuration?.type === NotificationTargetType.PLATFORM_USERS
        "
        color="purple"
      >
        {{
          notificationTargetConfigTypeLabel(
            record.configuration?.usersFilter?.type,
          )
        }}
      </Tag>
      <span v-else class="text-muted-foreground">--</span>
    </template>
    <template #description="{ record }">
      {{ record.configuration?.description }}
    </template>
  </BasicTable>
</template>
