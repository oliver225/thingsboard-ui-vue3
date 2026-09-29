<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { NotificationRuleInfo } from '#/api/tb/notification-rule';

import { computed, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteNotificationRule,
  deleteNotificationRules,
  getNotificationRuleById,
  getNotificationRules,
  saveNotificationRule,
} from '#/api/tb/notification-rule';
import { Authority, notificationRuleTriggerTypeLabel } from '#/enums';
import { $t } from '#/locales';

import NotificationRuleForm from './form.vue';

defineOptions({ name: 'NotificationRulesList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。
const searchInfo = reactive({ searchText: '' });

const pendingRuleIds = ref(new Set<string>());

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: NotificationRuleForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<NotificationRuleInfo>[]>(() => [
  {
    title: $t('notification.features.rule.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 230,
    align: 'left',
    fixed: 'left',
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('notification.features.rule.fields.template'),
    dataIndex: 'templateName',
    key: 'templateName',
    width: 230,
    align: 'left',
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('notification.features.rule.fields.triggerType'),
    dataIndex: 'triggerType',
    key: 'triggerType',
    width: 170,
    slot: 'triggerType',
  },
  {
    title: $t('notification.features.rule.fields.enabled'),
    dataIndex: 'enabled',
    key: 'enabled',
    width: 100,
    slot: 'enabled',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) =>
      value === null || value === undefined || value === ''
        ? '—'
        : formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<NotificationRuleInfo> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'enable',
        icon: 'lucide:toggle-left',
        text: $t('notification.features.rule.actions.enable'),
        tooltip: $t('notification.features.rule.actions.enable'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        ifShow: !record.enabled,
        disabled: pendingRuleIds.value.has(record.id?.id ?? ''),
        onClick: () => handleEnable(record),
      },
      {
        key: 'disable',
        icon: 'lucide:toggle-right',
        text: $t('notification.features.rule.actions.disable'),
        tooltip: $t('notification.features.rule.actions.disable'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        ifShow: !!record.enabled,
        disabled: pendingRuleIds.value.has(record.id?.id ?? ''),
        onClick: () => handleDisable(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('notification.features.rule.actions.edit'),
        tooltip: $t('notification.features.rule.actions.edit'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleEdit(record),
      },
      {
        key: 'copy',
        icon: 'lucide:copy',
        text: $t('notification.features.rule.actions.copy'),
        tooltip: $t('notification.features.rule.actions.copy'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleCopy(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('notification.features.rule.actions.delete'),
        tooltip: $t('notification.features.rule.actions.delete'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<NotificationRuleInfo>({
  api: getNotificationRules,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  batch: {
    entityName: () => $t('notification.sections.rules'),
    enabled: () =>
      hasAccessByRoles([Authority.SYS_ADMIN, Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteNotificationRules,
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

function handleEdit(record: NotificationRuleInfo) {
  const notificationRuleId = record.id?.id;
  if (!notificationRuleId) return;
  formModalApi.setData({ notificationRuleId }).open();
}

function handleCopy(record: NotificationRuleInfo) {
  const notificationRuleId = record.id?.id;
  if (!notificationRuleId) return;
  formModalApi.setData({ notificationRuleId, isCopy: true }).open();
}

async function handleDelete(record: NotificationRuleInfo) {
  const notificationRuleId = record.id?.id;
  if (!notificationRuleId) return;

  await confirm({
    title: $t('notification.features.rule.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('notification.sections.rules'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteNotificationRule(notificationRuleId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleEnable(record: NotificationRuleInfo) {
  return setRuleEnabled(record, true);
}

function handleDisable(record: NotificationRuleInfo) {
  return setRuleEnabled(record, false);
}

function handleSaved() {
  return reload();
}

async function setRuleEnabled(record: NotificationRuleInfo, enabled: boolean) {
  const notificationRuleId = record.id?.id;
  if (!notificationRuleId || pendingRuleIds.value.has(notificationRuleId))
    return;
  pendingRuleIds.value.add(notificationRuleId);
  try {
    const notificationRule = await getNotificationRuleById(notificationRuleId);
    await saveNotificationRule({
      ...notificationRule,
      enabled,
    });
    message.success($t('tb.common.saveSuccess'));
    await reload();
  } finally {
    pendingRuleIds.value.delete(notificationRuleId);
  }
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
        {{ $t('notification.features.rule.actions.create') }}
      </Button>
    </template>
    <template #triggerType="{ record }">
      <Tag color="blue">
        {{ notificationRuleTriggerTypeLabel(record.triggerType) }}
      </Tag>
    </template>
    <template #enabled="{ record }">
      <Tag :color="record.enabled ? 'success' : 'default'">
        {{
          record.enabled
            ? $t('notification.features.rule.status.enabled')
            : $t('notification.features.rule.status.disabled')
        }}
      </Tag>
    </template>
  </BasicTable>
</template>
