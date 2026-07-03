<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationTarget } from '#/api/tb/notification-target';

import { reactive } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotificationTarget,
  getNotificationTargets,
} from '#/api/tb/notification-target';
import { DEFAULT_SORT_FIELD } from '#/constants';
import {
  notificationTargetConfigTypeLabel,
  NotificationTargetType,
  notificationTargetTypeLabel,
} from '#/enums';
import { $t } from '#/locales';

import RecipientForm from './form.vue';

defineOptions({ name: 'NotificationRecipientsList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RecipientForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getNotificationTargets({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<NotificationTarget>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        align: 'left',
        field: 'name',
        minWidth: 180,
        title: $t('tb.notification.recipient.fields.name'),
      },
      {
        field: 'type',
        slots: { default: 'type' },
        title: $t('tb.notification.recipient.fields.type'),
        width: 150,
      },
      {
        field: 'filterType',
        slots: { default: 'filterType' },
        title: $t('tb.notification.recipient.fields.filterType'),
        width: 160,
      },
      {
        align: 'left',
        field: 'configuration.description',
        minWidth: 200,
        slots: { default: 'description' },
        title: $t('tb.notification.recipient.fields.description'),
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
  } as VxeTableGridOptions<NotificationTarget>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: NotificationTarget) {
  formModalApi.setData({ targetId: row.id?.id }).open();
}

function getActionItems(row: NotificationTarget): ActionItem[] {
  return [
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: NotificationTarget) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteNotificationTarget(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: NotificationTarget) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.notification.recipient.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.notification.recipient.delete.title', { name: row.name }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Grid>
    <template #toolbar-actions>
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
      <Button type="primary" @click="onCreate">
        <template #icon>
          <IconifyIcon icon="lucide:plus" />
        </template>
        {{ $t('tb.notification.recipient.actions.create') }}
      </Button>
    </template>
    <template #type="{ row }">
      <Tag color="blue">
        {{ notificationTargetTypeLabel(row.configuration?.type) }}
      </Tag>
    </template>
    <template #filterType="{ row }">
      <Tag
        v-if="row.configuration?.type === NotificationTargetType.PLATFORM_USERS"
        color="purple"
      >
        {{
          notificationTargetConfigTypeLabel(
            row.configuration?.usersFilter?.type,
          )
        }}
      </Tag>
      <span v-else class="text-muted-foreground">--</span>
    </template>
    <template #description="{ row }">
      {{ row.configuration?.description }}
    </template>
  </Grid>
  <FormModal @success="onFormSuccess" />
</template>
