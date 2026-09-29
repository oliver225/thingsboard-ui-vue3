<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { WidgetsBundle } from '#/api/tb/widgets-bundle';

import { computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import {
  confirm,
  Page,
  useVbenModal,
  VbenIconButton,
  VbenSegmented,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteWidgetsBundle,
  deleteWidgetsBundles,
  getWidgetsBundleById,
  getWidgetsBundles,
  saveWidgetsBundle,
} from '#/api/tb/widgets-bundle';
import { SYS_TENANT_ID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import WidgetsBundleForm from './form.vue';

defineOptions({ name: 'WidgetsBundleList' });

const router = useRouter();

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: WidgetsBundleForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<WidgetsBundle>[]>(() => [
  {
    title: $t('widgets-bundle.fields.title'),
    dataIndex: 'title',
    key: 'title',
    width: 200,
    align: 'left',
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('widgets-bundle.fields.description'),
    dataIndex: 'description',
    key: 'description',
    width: 260,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('widgets-bundle.fields.scope'),
    dataIndex: 'tenantId',
    key: 'tenantId',
    width: 100,
    customRender: ({ record }) =>
      isSystem(record)
        ? $t('widgets-bundle.options.scope.system')
        : $t('widgets-bundle.options.scope.tenant'),
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

const actionColumn: ActionColumn<WidgetsBundle> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('widgets-bundle.actions.export'),
        tooltip: $t('widgets-bundle.actions.export'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleExport(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('widgets-bundle.actions.edit'),
        tooltip: $t('widgets-bundle.actions.edit'),
        auth: Authority.SYS_ADMIN,
        disabled: !isSystem(record),
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('widgets-bundle.actions.delete'),
        tooltip: $t('widgets-bundle.actions.delete'),
        auth: Authority.SYS_ADMIN,
        disabled: !isSystem(record),
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<WidgetsBundle>({
  api: getWidgetsBundles,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('widgets-bundle.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) =>
      !!(
        !!record.id?.id &&
        hasAccessByRoles([Authority.SYS_ADMIN]) &&
        isSystem(record)
      ),
    deleteApi: deleteWidgetsBundles,
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

function handleEdit(record: WidgetsBundle) {
  if (!record.id?.id) return;
  formModalApi.setData({ widgetsBundleId: record.id?.id }).open();
}

function handleNavigateList(value: string | undefined) {
  if (!value) return;
  return router.push({ name: value });
}

/** 从 JSON 文件导入部件包 */
async function handleImport() {
  let data: unknown;
  try {
    data = await importJsonFile<WidgetsBundle>();
  } catch {
    message.error($t('widgets-bundle.features.import.parseError'));
    return;
  }
  if (!isImportedDataValid(data)) {
    message.error($t('widgets-bundle.features.import.invalidFile'));
    return;
  }
  await saveWidgetsBundle(prepareEntityImport(data));
  message.success($t('widgets-bundle.features.import.success'));
  reload();
}

/** 导出部件包为 JSON 文件 */
async function handleExport(record: WidgetsBundle) {
  if (!record.id?.id) {
    return;
  }
  const widgetsBundle = await getWidgetsBundleById(record.id.id, true);
  const exportData = prepareEntityExport(widgetsBundle);
  exportJsonFile(exportData, widgetsBundle.title ?? 'widgets-bundle');
}

async function handleDelete(record: WidgetsBundle) {
  const widgetsBundleId = record.id?.id;
  if (!widgetsBundleId) return;

  await confirm({
    title: $t('widgets-bundle.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('widgets-bundle.menu'),
      name: record.title,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteWidgetsBundle(widgetsBundleId);
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

/** 系统级部件包(NULL_UUID 租户)对租户管理员只读 */
function isSystem(record: WidgetsBundle) {
  return !record.tenantId?.id || record.tenantId.id === SYS_TENANT_ID;
}

/** 校验导入文件是否为合法的部件包 */
function isImportedDataValid(data: any): data is WidgetsBundle {
  return data !== null && typeof data === 'object' && data.title !== undefined;
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable class="h-full" @register="registerTable">
      <template #tableTitle>
        <VbenSegmented
          variant="navigation"
          :tabs="[
            {
              icon: $router.resolve({ name: 'WidgetType' }).meta.icon,
              label: $t('tb.menu.widgetTypes'),
              value: 'WidgetType',
            },
            {
              icon: $router.resolve({ name: 'WidgetsBundle' }).meta.icon,
              label: $t('tb.menu.widgetsBundle'),
              value: 'WidgetsBundle',
            },
          ]"
          model-value="WidgetsBundle"
          @update:model-value="handleNavigateList"
        />
      </template>
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
          {{ $t('widgets-bundle.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          :tooltip="$t('widgets-bundle.actions.import')"
          :aria-label="$t('widgets-bundle.actions.import')"
          tooltip-side="top"
          class="rounded-md border border-border"
          @click="handleImport"
        >
          <IconifyIcon
            icon="lucide:file-up"
            class="size-4"
            aria-hidden="true"
          />
        </VbenIconButton>
      </template>
    </BasicTable>
  </Page>
</template>
