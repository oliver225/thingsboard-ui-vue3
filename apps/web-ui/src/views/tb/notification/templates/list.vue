<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationTemplate } from '#/api/tb/notification-template';

import { reactive } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotificationTemplate,
  getNotificationTemplates,
} from '#/api/tb/notification-template';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { notificationTypeLabel } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'NotificationTemplatesList' });

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getNotificationTemplates({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

/** 取模板中启用的投递方式 */
function enabledMethods(row: NotificationTemplate): string[] {
  const templates = row.configuration?.deliveryMethodsTemplates ?? {};
  return Object.keys(templates).filter(
    (method) => (templates as Record<string, any>)[method]?.enabled !== false,
  );
}

const [Grid, gridApi] = useVbenVxeGrid<NotificationTemplate>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        align: 'left',
        field: 'name',
        minWidth: 180,
        title: $t('tb.notification.template.fields.name'),
      },
      {
        field: 'notificationType',
        slots: { default: 'notificationType' },
        title: $t('tb.notification.template.fields.notificationType'),
        width: 160,
      },
      {
        align: 'left',
        field: 'deliveryMethods',
        minWidth: 200,
        slots: { default: 'deliveryMethods' },
        title: $t('tb.notification.template.fields.deliveryMethods'),
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
  } as VxeTableGridOptions<NotificationTemplate>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: NotificationTemplate): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: NotificationTemplate) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteNotificationTemplate(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: NotificationTemplate) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.notification.template.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.notification.template.delete.title', { name: row.name }),
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
    <template #notificationType="{ row }">
      <Tag color="blue">
        {{ notificationTypeLabel(row.notificationType) }}
      </Tag>
    </template>
    <template #deliveryMethods="{ row }">
      <div class="flex flex-wrap gap-1">
        <Tag v-for="method in enabledMethods(row)" :key="method">
          {{ method }}
        </Tag>
      </div>
    </template>
  </Grid>
</template>
