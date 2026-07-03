<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NotificationRuleInfo } from '#/api/tb/notification-rule';

import { reactive } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotificationRule,
  getNotificationRules,
} from '#/api/tb/notification-rule';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { notificationRuleTriggerTypeLabel } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'NotificationRulesList' });

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getNotificationRules({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<NotificationRuleInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        align: 'left',
        field: 'name',
        minWidth: 180,
        title: $t('tb.notification.rule.fields.name'),
      },
      {
        align: 'left',
        field: 'templateName',
        minWidth: 160,
        title: $t('tb.notification.rule.fields.template'),
      },
      {
        field: 'triggerType',
        slots: { default: 'triggerType' },
        title: $t('tb.notification.rule.fields.triggerType'),
        width: 170,
      },
      {
        align: 'left',
        field: 'deliveryMethods',
        minWidth: 180,
        slots: { default: 'deliveryMethods' },
        title: $t('tb.notification.rule.fields.deliveryMethods'),
      },
      {
        field: 'enabled',
        slots: { default: 'enabled' },
        title: $t('tb.notification.rule.fields.enabled'),
        width: 100,
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
  } as VxeTableGridOptions<NotificationRuleInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: NotificationRuleInfo): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: NotificationRuleInfo) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteNotificationRule(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: NotificationRuleInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.notification.rule.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.notification.rule.delete.title', { name: row.name }),
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
    <template #triggerType="{ row }">
      <Tag color="blue">
        {{ notificationRuleTriggerTypeLabel(row.triggerType) }}
      </Tag>
    </template>
    <template #deliveryMethods="{ row }">
      <div class="flex flex-wrap gap-1">
        <Tag v-for="method in row.deliveryMethods" :key="method">
          {{ method }}
        </Tag>
      </div>
    </template>
    <template #enabled="{ row }">
      <Tag :color="row.enabled ? 'success' : 'default'">
        {{
          row.enabled
            ? $t('tb.notification.rule.status.enabled')
            : $t('tb.notification.rule.status.disabled')
        }}
      </Tag>
    </template>
  </Grid>
</template>
