<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { NotificationTemplate } from '#/api/tb/notification-template';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tag } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteNotificationTemplate,
  deleteNotificationTemplates,
  getNotificationTemplates,
} from '#/api/tb/notification-template';
import { Authority, notificationTypeLabel } from '#/enums';
import { $t } from '#/locales';

import TemplateForm from './form.vue';
import { deliveryMethodOptions } from './template';

defineOptions({ name: 'NotificationTemplatesList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TemplateForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<NotificationTemplate>[]>(() => [
  {
    title: $t('notification.features.template.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 240,
    align: 'left',
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('notification.features.template.fields.notificationType'),
    dataIndex: 'notificationType',
    key: 'notificationType',
    width: 120,
    slot: 'notificationType',
  },
  {
    align: 'left',
    key: 'deliveryMethods',
    width: 200,
    slot: 'deliveryMethods',
    title: $t('notification.features.template.fields.deliveryMethods'),
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

const actionColumn: ActionColumn<NotificationTemplate> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('notification.features.template.actions.edit'),
        tooltip: $t('notification.features.template.actions.edit'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleEdit(record),
      },
      {
        key: 'copy',
        icon: 'lucide:copy',
        text: $t('notification.features.template.actions.copy'),
        tooltip: $t('notification.features.template.actions.copy'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleCopy(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('notification.features.template.actions.delete'),
        tooltip: $t('notification.features.template.actions.delete'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<NotificationTemplate>({
  api: getNotificationTemplates,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('notification.sections.templates'),
    enabled: () =>
      hasAccessByRoles([Authority.SYS_ADMIN, Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteNotificationTemplates,
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

function handleEdit(record: NotificationTemplate) {
  const notificationTemplateId = record.id?.id;
  if (!notificationTemplateId) return;
  formModalApi.setData({ notificationTemplateId }).open();
}

function handleCopy(record: NotificationTemplate) {
  const notificationTemplateId = record.id?.id;
  if (!notificationTemplateId) return;
  formModalApi.setData({ notificationTemplateId, isCopy: true }).open();
}

async function handleDelete(record: NotificationTemplate) {
  const notificationTemplateId = record.id?.id;
  if (!notificationTemplateId) return;

  await confirm({
    title: $t('notification.features.template.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('notification.sections.templates'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteNotificationTemplate(notificationTemplateId);
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

/** 取模板中启用的投递方式 */
function enabledMethods(record: NotificationTemplate) {
  return deliveryMethodOptions().filter(
    ({ value }) =>
      record.configuration?.deliveryMethodsTemplates?.[value]?.enabled,
  );
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
        {{ $t('notification.features.template.actions.create') }}
      </Button>
    </template>
    <template #notificationType="{ record }">
      <Tag color="blue">
        {{ notificationTypeLabel(record.notificationType) }}
      </Tag>
    </template>
    <template #deliveryMethods="{ record }">
      <div class="flex flex-wrap gap-1">
        <Tag v-for="method in enabledMethods(record)" :key="method.value">
          {{ method.label }}
        </Tag>
      </div>
    </template>
  </BasicTable>
</template>
