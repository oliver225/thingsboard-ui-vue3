<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationRequestInfo } from '#/api/tb/notification';

import { reactive } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotificationRequest,
  getNotificationRequests,
} from '#/api/tb/notification';
import { DEFAULT_SORT_FIELD } from '#/constants';
import {
  NotificationRequestStatus,
  notificationRequestStatusLabel,
} from '#/enums';
import { $t } from '#/locales';

import ErrorModal from './error-modal.vue';

defineOptions({ name: 'NotificationSentList' });

const [ErrorDetailModal, errorModalApi] = useVbenModal({
  connectedComponent: ErrorModal,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getNotificationRequests({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

const STATUS_COLOR: Record<string, string> = {
  [NotificationRequestStatus.PROCESSING]: 'processing',
  [NotificationRequestStatus.SCHEDULED]: 'warning',
  [NotificationRequestStatus.SENT]: 'success',
};

function statusColor(status?: NotificationRequestStatus) {
  return status ? (STATUS_COLOR[status] ?? 'default') : 'default';
}

interface StatsSummary {
  color: string;
  text: string;
}

function statsSummary(row: NotificationRequestInfo): StatsSummary {
  const stats = row.stats;
  if (!stats) {
    return {
      color: 'default',
      text: $t('tb.notification.request.result.none'),
    };
  }
  if (stats.totalErrors && stats.totalErrors > 0) {
    return {
      color: 'error',
      text: $t('tb.notification.request.result.failed', {
        count: stats.totalErrors,
      }),
    };
  }
  if (stats.error) {
    return { color: 'error', text: $t('tb.notification.request.result.error') };
  }

  // totalSent 后端 @JsonIgnore 不下发,成功总数由 sent 映射求和
  const sentCount = stats.sent
    ? Object.values(stats.sent).reduce((sum, count) => sum + Number(count), 0)
    : 0;
  return {
    color: 'success',
    text: $t('tb.notification.request.result.success', { count: sentCount }),
  };
}

/** 是否存在错误(请求级错误或任一投递方式有失败收件人) */
function hasErrors(row: NotificationRequestInfo): boolean {
  const stats = row.stats;
  if (!stats) {
    return false;
  }
  if (stats.error) {
    return true;
  }
  if (stats.totalErrors && stats.totalErrors > 0) {
    return true;
  }
  return false;
}

/** 点击错误结果查看详情 */
function openErrorDetail(row: NotificationRequestInfo) {
  if (!hasErrors(row)) {
    return;
  }
  errorModalApi.setData({ stats: row.stats }).open();
}

const [Grid, gridApi] = useVbenVxeGrid<NotificationRequestInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        align: 'left',
        field: 'templateName',
        minWidth: 200,
        title: $t('tb.notification.request.fields.template'),
      },
      {
        field: 'deliveryMethods',
        slots: { default: 'deliveryMethods' },
        title: $t('tb.notification.request.fields.deliveryMethods'),
        width: 200,
      },
      {
        field: 'status',
        slots: { default: 'status' },
        title: $t('tb.notification.request.fields.status'),
        width: 130,
      },
      {
        field: 'stats',
        slots: { default: 'stats' },
        title: $t('tb.notification.request.fields.result'),
        width: 120,
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
  } as VxeTableGridOptions<NotificationRequestInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: NotificationRequestInfo): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: NotificationRequestInfo) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteNotificationRequest(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: NotificationRequestInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.notification.request.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.notification.request.delete.title', {
      template: row.templateName,
    }),
  }).catch(() => {});
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
    <template #deliveryMethods="{ row }">
      <div class="flex flex-wrap gap-1">
        <Tag v-for="method in row.deliveryMethods" :key="method">
          {{ method }}
        </Tag>
      </div>
    </template>
    <template #status="{ row }">
      <Tag :color="statusColor(row.status)">
        {{ notificationRequestStatusLabel(row.status) }}
      </Tag>
    </template>
    <template #stats="{ row }">
      <Tag
        :color="statsSummary(row).color"
        :class="{ 'cursor-pointer': hasErrors(row) }"
        @click="openErrorDetail(row)"
      >
        {{ statsSummary(row).text }}
        <IconifyIcon
          v-if="hasErrors(row)"
          icon="lucide:chevron-right"
          class="inline-block align-[-2px]"
        />
      </Tag>
    </template>
  </Grid>
  <ErrorDetailModal />
</template>
