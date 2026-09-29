<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { WidgetTypeDetails, WidgetTypeInfo } from '#/api/tb/widget-type';
import type { PageLink } from '#/types/tb';

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

import { Button, Input, message, Tag } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteWidgetType,
  deleteWidgetTypes,
  getWidgetTypeById,
  getWidgetTypes,
  saveWidgetType,
} from '#/api/tb/widget-type';
import { SYS_TENANT_ID } from '#/constants';
import { Authority, widgetCategoryLabel, widgetCategoryOptions } from '#/enums';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import WidgetTypeForm from './form.vue';

defineOptions({ name: 'WidgetTypeList' });

const router = useRouter();

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: WidgetTypeForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<WidgetTypeInfo>[]>(() => [
  {
    title: $t('widget-type.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 200,
    align: 'left',
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('widget-type.fields.bundles'),
    dataIndex: 'bundles',
    key: 'bundles',
    width: 230,
    slot: 'bundles',
  },
  {
    title: $t('widget-type.fields.widgetType'),
    dataIndex: 'widgetType',
    key: 'widgetType',
    width: 120,
    filters: widgetCategoryOptions().map((item) => ({
      text: item.label,
      value: item.value,
    })),
    filterMultiple: true,
    customRender: ({ value }) => widgetCategoryLabel(value),
  },
  {
    title: $t('widget-type.fields.scope'),
    dataIndex: 'tenantId',
    key: 'tenantId',
    width: 110,
    customRender: ({ record }) =>
      isSystem(record)
        ? $t('widget-type.options.scope.system')
        : $t('widget-type.options.scope.tenant'),
  },
  {
    title: $t('widget-type.fields.deprecated'),
    dataIndex: 'deprecated',
    key: 'deprecated',
    width: 100,
    slot: 'deprecated',
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

const actionColumn: ActionColumn<WidgetTypeInfo> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('widget-type.actions.export'),
        tooltip: $t('widget-type.actions.export'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        onClick: () => handleExport(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('widget-type.actions.edit'),
        tooltip: $t('widget-type.actions.edit'),
        auth: Authority.SYS_ADMIN,
        disabled: !isSystem(record),
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('widget-type.actions.delete'),
        tooltip: $t('widget-type.actions.delete'),
        auth: Authority.SYS_ADMIN,
        disabled: !isSystem(record),
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<WidgetTypeInfo>({
  api: fetchList,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('widget-type.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) =>
      !!(
        !!record.id?.id &&
        hasAccessByRoles([Authority.SYS_ADMIN]) &&
        isSystem(record)
      ),
    deleteApi: deleteWidgetTypes,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

async function fetchList(pageLink: PageLink & { widgetType?: string[] }) {
  return getWidgetTypes({
    ...pageLink,
    widgetTypeList: pageLink.widgetType?.join(',') || undefined,
  });
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: WidgetTypeInfo) {
  if (!record.id?.id) return;
  formModalApi.setData({ widgetTypeId: record.id?.id }).open();
}

function handleNavigateList(value: string | undefined) {
  if (!value) return;
  return router.push({ name: value });
}

/** 从 JSON 文件导入部件 */
async function handleImport() {
  let data: unknown;
  try {
    data = await importJsonFile<WidgetTypeDetails>();
  } catch {
    message.error($t('widget-type.features.import.parseError'));
    return;
  }
  if (!isImportedDataValid(data)) {
    message.error($t('widget-type.features.import.invalidFile'));
    return;
  }
  await saveWidgetType(prepareEntityImport(data));
  message.success($t('widget-type.features.import.success'));
  reload();
}

/** 导出部件为 JSON 文件 */
async function handleExport(record: WidgetTypeInfo) {
  if (!record.id?.id) {
    return;
  }
  const widgetType = await getWidgetTypeById(record.id.id, true);
  const exportData = prepareEntityExport(widgetType);
  exportJsonFile(exportData, widgetType.name ?? 'widget-type');
}

async function handleDelete(record: WidgetTypeInfo) {
  const widgetTypeId = record.id?.id;
  if (!widgetTypeId) return;

  await confirm({
    title: $t('widget-type.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('widget-type.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteWidgetType(widgetTypeId);
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

/** 系统级部件(NULL_UUID 租户)对租户管理员只读 */
function isSystem(record: WidgetTypeInfo) {
  return !record.tenantId?.id || record.tenantId.id === SYS_TENANT_ID;
}

/** 校验导入文件是否为合法的部件类型 */
function isImportedDataValid(data: any): data is WidgetTypeDetails {
  return (
    data !== null &&
    typeof data === 'object' &&
    data.fqn !== undefined &&
    data.descriptor !== undefined
  );
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
          model-value="WidgetType"
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
          {{ $t('widget-type.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          :tooltip="$t('widget-type.actions.import')"
          :aria-label="$t('widget-type.actions.import')"
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
      <template #bundles="{ record }">
        <div class="flex flex-wrap gap-1">
          <Tag
            v-for="bundle in record.bundles"
            :key="bundle.id?.id ?? bundle.name"
          >
            {{ bundle.name }}
          </Tag>
        </div>
      </template>
      <template #deprecated="{ record }">
        <TbCheckbox
          :checked="!!record.deprecated"
          disabled
          :aria-label="$t('widget-type.fields.deprecated')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
