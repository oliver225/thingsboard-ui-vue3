<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { NotificationRequestInfo } from '#/api/tb/notification';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteNotificationRequest,
  deleteNotificationRequests,
  getNotificationRequests,
} from '#/api/tb/notification';
import {
  Authority,
  NotificationRequestStatus,
  notificationRequestStatusLabel,
} from '#/enums';
import { $t } from '#/locales';

import { deliveryMethodOptions } from '../templates/template';
import ErrorModal from './error-modal.vue';
import RequestForm from './form.vue';

defineOptions({ name: 'NotificationRequestList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [ErrorDetailModal, errorModalApi] = useVbenModal({
  connectedComponent: ErrorModal,
  destroyOnClose: true,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RequestForm,
  destroyOnClose: true,
});

const methodOptions = computed(deliveryMethodOptions);

const STATUS_COLOR: Record<string, string> = {
  [NotificationRequestStatus.PROCESSING]: 'processing',
  [NotificationRequestStatus.SCHEDULED]: 'warning',
  [NotificationRequestStatus.SENT]: 'success',
};

interface StatsSummary {
  color: string;
  text: string;
}

const tableColumns = computed<BasicColumn<NotificationRequestInfo>[]>(() => [
  {
    title: $t('notification.features.request.fields.template'),
    dataIndex: 'templateName',
    key: 'templateName',
    width: 200,
    align: 'left',
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    key: 'deliveryMethods',
    slot: 'deliveryMethods',
    title: $t('notification.features.request.fields.deliveryMethods'),
    width: 200,
  },
  {
    title: $t('notification.features.request.fields.status'),
    dataIndex: 'status',
    key: 'status',
    width: 130,
    slot: 'status',
  },
  {
    title: $t('notification.features.request.fields.result'),
    dataIndex: 'stats',
    key: 'stats',
    width: 120,
    slot: 'stats',
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

const actionColumn: ActionColumn<NotificationRequestInfo> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'sendAgain',
        icon: 'lucide:repeat-2',
        text: $t('notification.features.request.actions.sendAgain'),
        tooltip: $t('notification.features.request.actions.sendAgain'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        disabled: record.status === NotificationRequestStatus.SCHEDULED,
        onClick: () => handleSendAgain(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('notification.features.request.actions.delete'),
        tooltip: $t('notification.features.request.actions.delete'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<NotificationRequestInfo>({
  api: getNotificationRequests,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('notification.sections.sent'),
    enabled: () =>
      hasAccessByRoles([Authority.SYS_ADMIN, Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteNotificationRequests,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

async function handleDelete(record: NotificationRequestInfo) {
  const notificationRequestId = record.id?.id;
  if (!notificationRequestId) return;

  await confirm({
    title: $t('notification.features.request.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('notification.sections.sent'),
      name: record.templateName,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteNotificationRequest(notificationRequestId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleSendAgain(record: NotificationRequestInfo) {
  formModalApi.setData({ notificationRequestId: record.id?.id }).open();
}

/** 点击错误结果查看详情 */
function handleOpenErrorDetail(record: NotificationRequestInfo) {
  if (!hasErrors(record)) {
    return;
  }
  errorModalApi.setData({ stats: record.stats }).open();
}

function statusColor(status?: NotificationRequestStatus) {
  return status ? (STATUS_COLOR[status] ?? 'default') : 'default';
}

function statsSummary(record: NotificationRequestInfo): StatsSummary {
  const stats = record.stats;
  if (!stats) {
    return {
      color: 'default',
      text: $t('notification.features.request.result.none'),
    };
  }
  if (stats.totalErrors && stats.totalErrors > 0) {
    return {
      color: 'error',
      text: $t('notification.features.request.result.failed', {
        count: stats.totalErrors,
      }),
    };
  }
  if (stats.error) {
    return {
      color: 'error',
      text: $t('notification.features.request.result.error'),
    };
  }

  // totalSent 后端 @JsonIgnore 不下发,成功总数由 sent 映射求和
  const sentCount = stats.sent
    ? Object.values(stats.sent).reduce((sum, count) => sum + Number(count), 0)
    : 0;
  return {
    color: 'success',
    text: $t('notification.features.request.result.success', {
      count: sentCount,
    }),
  };
}

/** 是否存在错误(请求级错误或任一投递方式有失败收件人) */
function hasErrors(record: NotificationRequestInfo): boolean {
  const stats = record.stats;
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

defineExpose({ reload });
</script>

<template>
  <FormModal @success="reload()" />
  <ErrorDetailModal />
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
    <template #deliveryMethods="{ record }">
      <div class="flex flex-wrap gap-1">
        <Tag v-for="method in record.deliveryMethods" :key="method">
          {{
            methodOptions.find((item) => item.value === method)?.label ?? method
          }}
        </Tag>
      </div>
    </template>
    <template #status="{ record }">
      <Tag :color="statusColor(record.status)">
        {{ notificationRequestStatusLabel(record.status) }}
      </Tag>
    </template>
    <template #stats="{ record }">
      <Tag
        :color="statsSummary(record).color"
        :class="{ 'cursor-pointer': hasErrors(record) }"
        @click="handleOpenErrorDetail(record)"
      >
        {{ statsSummary(record).text }}
        <IconifyIcon
          v-if="hasErrors(record)"
          icon="lucide:chevron-right"
          class="inline-block align-[-2px]"
        />
      </Tag>
    </template>
  </BasicTable>
</template>
