<script setup lang="ts">
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { ApiKeyInfo } from '#/api/tb/api-key';

import { computed, reactive, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDate, formatDateTime } from '@vben/utils';

import { Button, Input, message, Switch } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { deleteApiKey, enableApiKey, getUserApiKeys } from '#/api/tb/api-key';
import { $t } from '#/locales';

import ApiKeyForm from './form.vue';

const props = defineProps<{
  userId: string;
}>();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ApiKeyForm,
  destroyOnClose: true,
});
const columns = computed<BasicColumn<ApiKeyInfo>[]>(() => [
  {
    title: $t('api-key.fields.description'),
    dataIndex: 'description',
    key: 'description',
    minWidth: 180,
  },
  {
    title: $t('api-key.fields.enabled'),
    dataIndex: 'enabled',
    key: 'enabled',
    width: 90,
    slot: 'enabled',
  },
  {
    title: $t('api-key.fields.expiration'),
    dataIndex: 'expirationTime',
    key: 'expirationTime',
    width: 190,
    customRender: ({ value }) =>
      value ? formatDate(value) : $t('api-key.options.never'),
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) => formatDateTime(value),
  },
]);
const actionColumn: ActionColumn<ApiKeyInfo> = {
  width: 110,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        icon: 'lucide:square-pen',
        text: $t('api-key.actions.edit'),
        tooltip: $t('api-key.actions.edit'),
        onClick: () =>
          formModalApi.setData({ apiKey: record, userId: props.userId }).open(),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        danger: true,
        text: $t('tb.common.delete'),
        tooltip: $t('tb.common.delete'),
        onClick: () => handleDelete(record),
      },
    ],
  }),
};
const [registerTable, { reload }] = useTable<ApiKeyInfo>({
  api: (params) => getUserApiKeys(props.userId, params),
  columns,
  actionColumn,
  searchInfo,
  rowKey: (record) => record.id?.id ?? '',
  tableSetting: { redo: true, size: true, setting: true },
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

watch(
  () => props.userId,
  () => {
    formModalApi.close();
    searchInfo.searchText = '';
    handleSearch();
  },
);

function handleToggleEnabled(record: ApiKeyInfo, enabled: boolean) {
  const id = record.id?.id;
  if (!id) return;
  return confirm({
    title: enabled
      ? $t('api-key.actions.enable')
      : $t('api-key.actions.disable'),
    content: enabled
      ? $t('api-key.messages.enableConfirm')
      : $t('api-key.messages.disableConfirm'),
    icon: enabled ? 'warning' : 'error',
    confirmButtonProps: enabled ? undefined : { variant: 'destructive' },
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await enableApiKey(id, enabled);
        message.success(
          enabled
            ? $t('api-key.messages.enableSuccess')
            : $t('api-key.messages.disableSuccess'),
        );
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}
function handleDelete(record: ApiKeyInfo) {
  const id = record.id?.id;
  if (!id) return;
  return confirm({
    title: $t('tb.common.delete'),
    content: $t('api-key.messages.delete.content'),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteApiKey(id);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}
</script>

<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
    <FormModal @success="reload()" />
    <BasicTable class="h-full min-h-0" @register="registerTable">
      <template #query>
        <Input
          v-model:value="searchInfo.searchText"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('tb.common.searchPlaceholder')"
          class="w-full sm:w-64"
        />
      </template>
      <template #toolbar>
        <Button
          :disabled="!userId"
          type="primary"
          @click="formModalApi.setData({ userId: props.userId }).open()"
        >
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          {{ $t('api-key.actions.create') }}
        </Button>
      </template>
      <template #enabled="{ record }">
        <Switch
          :checked="record.enabled"
          :aria-label="$t('api-key.fields.enabled')"
          @change="(value) => handleToggleEnabled(record, !!value)"
        />
      </template>
    </BasicTable>
  </div>
</template>
