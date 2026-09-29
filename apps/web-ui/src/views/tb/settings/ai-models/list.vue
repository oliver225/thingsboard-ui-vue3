<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { AiModel } from '#/api/tb/ai-model';

import { computed, reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { deleteAiModel, deleteAiModels, getAiModels } from '#/api/tb/ai-model';
import { aiProviderLabel, Authority } from '#/enums';
import { $t } from '#/locales';

import AiModelForm from './form.vue';

defineOptions({ name: 'AiModelList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。

const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AiModelForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<AiModel>[]>(() => [
  {
    title: $t('settings.features.ai.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 220,
    sorter: true,
    slot: 'aiModelName',
  },
  {
    title: $t('settings.features.ai.fields.provider'),
    dataIndex: 'configuration',
    key: 'configuration',
    width: 180,
    customRender: ({ record }) =>
      aiProviderLabel(record.configuration?.provider),
  },
  {
    title: $t('settings.features.ai.fields.modelId'),
    dataIndex: ['configuration', 'modelId'],
    key: 'configuration.modelId',
    width: 200,
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

const actionColumn: ActionColumn<AiModel> = {
  align: 'center',
  width: 100,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('settings.features.ai.actions.edit'),
        tooltip: $t('settings.features.ai.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('settings.features.ai.actions.delete'),
        tooltip: $t('settings.features.ai.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<AiModel>({
  api: getAiModels,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: { type: 'checkbox' },
  batch: {
    entityName: () => $t('settings.sections.navigation.aiModels'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteAiModels,
  },
  tableSetting: { redo: true, setting: true, size: true },
  clickToRowSelect: false,
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: AiModel) {
  const aiModelId = record.id?.id;
  if (!aiModelId) return;

  formModalApi.setData({ aiModelId }).open();
}

async function handleDelete(record: AiModel) {
  const aiModelId = record.id?.id;
  if (!aiModelId) return;
  try {
    await confirm({
      title: $t('settings.features.ai.actions.delete'),
      content: `${$t('tb.common.messages.delete.title', { entity: $t('settings.sections.navigation.aiModels'), name: record.name })} ${$t('settings.features.ai.delete.content')}`,
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        try {
          await deleteAiModel(aiModelId);
          message.success($t('tb.common.messages.delete.success'));
          await reload();
          return true;
        } catch {
          return false;
        }
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'dialog cancelled') return;
    throw error;
  }
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <div class="ai-model-page h-full min-h-[420px]">
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      :title="$t('settings.sections.navigation.aiModels')"
      @register="registerTable"
    >
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
          v-access:role="[Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('settings.features.ai.actions.create') }}
        </Button>
      </template>
      <template #aiModelName="{ record }">
        <Button
          v-access:role="[Authority.TENANT_ADMIN]"
          class="h-auto p-0"
          @click="handleEdit(record)"
          type="link"
        >
          {{ record.name }}
        </Button>
      </template>
    </BasicTable>
  </div>
</template>
