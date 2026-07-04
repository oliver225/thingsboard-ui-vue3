<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AttributeData } from '#/api/tb/telemetry';
import type { EntityType } from '#/enums';

import { h, nextTick, reactive, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Segmented } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEntityAttributes,
  getEntityAttributes,
} from '#/api/tb/telemetry';
import { AttributeScope, attributeScopeOptions } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import AttributeForm from './form.vue';

defineOptions({ name: 'AttributeTable' });

const props = withDefaults(
  defineProps<{
    entityId: string;
    entityType: EntityType | string;
  }>(),
  {},
);

const scope = ref<AttributeScope>(AttributeScope.SERVER_SCOPE);
const queryParams = reactive({ textSearch: '' });
const selectedItems = ref<AttributeData[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AttributeForm,
  destroyOnClose: true,
});

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * 属性接口一次性返回全部数据,这里做本地搜索 / 排序 / 分页,
 * 返回与其他列表一致的 { data, totalElements } 形态。
 */
async function fetch({ page, sort }: any) {
  const list = await getEntityAttributes(
    props.entityType,
    props.entityId,
    scope.value,
  );

  const keyword = queryParams.textSearch.trim().toLowerCase();
  const rows = keyword
    ? list.filter(
        (item) =>
          item.key.toLowerCase().includes(keyword) ||
          formatValue(item.value).toLowerCase().includes(keyword),
      )
    : [...list];

  const field = sort?.field as string | undefined;
  const asc = sort?.order === 'asc';
  rows.sort((a, b) => {
    const result =
      field === 'key'
        ? a.key.localeCompare(b.key)
        : (a.lastUpdateTs ?? 0) - (b.lastUpdateTs ?? 0);
    return asc ? result : -result;
  });

  const start = (page.currentPage - 1) * page.pageSize;
  return {
    data: rows.slice(start, start + page.pageSize),
    totalElements: rows.length,
  };
}

function copyIcon(text: string, tip: string, stopClick = false) {
  return h(IconifyIcon, {
    class:
      'text-muted-foreground hover:text-primary cursor-pointer opacity-0 transition-opacity group-hover:opacity-100',
    icon: 'lucide:copy',
    onClick: (event: MouseEvent) => {
      if (stopClick) event.stopPropagation();
      copyToClipboard(text, tip);
    },
  });
}

function buildColumns(): VxeTableGridOptions<AttributeData>['columns'] {
  return [
    { title: $t('tb.common.seq'), type: 'seq', width: 60 },
    {
      align: 'left',
      field: 'key',
      minWidth: 160,
      slots: {
        default: ({ row }) =>
          h('div', { class: 'group flex items-center gap-1' }, [
            h('span', { class: 'break-all' }, row.key),
            copyIcon(row.key, $t('tb.attribute.copy.keyCopied')),
          ]),
      },
      sortable: true,
      title: $t('tb.attribute.fields.key'),
    },
    {
      align: 'left',
      field: 'value',
      minWidth: 200,
      slots: {
        default: ({ row }) =>
          h(
            'div',
            {
              class: `group flex items-center gap-1${scope.value === AttributeScope.CLIENT_SCOPE ? '' : ' cursor-pointer'}`,
              onClick: () =>
                scope.value !== AttributeScope.CLIENT_SCOPE && onEdit(row),
            },
            [
              h('span', { class: 'break-all' }, formatValue(row.value)),
              copyIcon(
                formatValue(row.value),
                $t('tb.attribute.copy.valueCopied'),
                true,
              ),
            ],
          ),
      },
      title: $t('tb.attribute.fields.value'),
    },
    {
      field: 'lastUpdateTs',
      formatter: ({ cellValue }) =>
        cellValue ? formatDateTime(cellValue) : '-',
      sortable: true,
      title: $t('tb.attribute.fields.lastUpdateTs'),
    },
    {
      align: 'center',
      cellRender: { name: 'CellAction', props: { actions: getActionItems } },
      field: 'actions',
      fixed: 'right',
      title: $t('tb.common.actions'),
      width: 100,
    },
  ];
}

function getActionItems(row: AttributeData): ActionItem[] {
  return [
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      ifShow: scope.value !== AttributeScope.CLIENT_SCOPE,
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete([row.key]),
      ifShow: scope.value !== AttributeScope.CLIENT_SCOPE,
      tooltip: $t('tb.common.delete'),
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<AttributeData>({
  gridEvents: {
    checkboxAll: onSelectedChange,
    checkboxChange: onSelectedChange,
  },
  gridOptions: {
    columns: buildColumns(),
    proxyConfig: {
      ajax: { query: fetch },
    },
    rowConfig: { keyField: 'key' },
    sortConfig: {
      defaultSort: { field: 'lastUpdateTs', order: 'desc' },
      remote: true,
    },
  } as VxeTableGridOptions<AttributeData>,
});

async function onSelectedChange() {
  await nextTick();
  selectedItems.value = gridApi.grid.getCheckboxRecords?.() ?? [];
}

function clearSelectedItems() {
  selectedItems.value = [];
  gridApi.grid.clearCheckboxRow?.();
}

function onScopeChange() {
  queryParams.textSearch = '';
  clearSelectedItems();
  gridApi.setGridOptions({ columns: buildColumns() });
  gridApi.query({ page: { currentPage: 1 } });
}

function onSearch() {
  clearSelectedItems();
  gridApi.query({ page: { currentPage: 1 } });
}

function onAdd() {
  formModalApi
    .setData({
      entityId: props.entityId,
      entityType: props.entityType,
      scope: scope.value,
    })
    .open();
}

function onEdit(row: AttributeData) {
  formModalApi
    .setData({
      attribute: row,
      entityId: props.entityId,
      entityType: props.entityType,
      scope: scope.value,
    })
    .open();
}

async function doDelete(keys: string[]) {
  try {
    await deleteEntityAttributes(
      props.entityType,
      props.entityId,
      scope.value,
      keys,
    );
    message.success($t('tb.common.deleteSuccess'));
    clearSelectedItems();
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(keys: string[]) {
  if (keys.length === 0) return;
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return;
      return doDelete(keys);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.attribute.delete.content', { count: keys.length }),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.attribute.delete.title'),
  }).catch(() => {});
}

function confirmBatchDelete() {
  confirmDelete(selectedItems.value.map((item) => item.key));
}

function onModalSuccess() {
  clearSelectedItems();
  gridApi.query();
}
</script>

<template>
  <FormModal @success="onModalSuccess" />
  <Grid>
    <template #toolbar-actions>
      <Segmented
        v-model:value="scope"
        :options="attributeScopeOptions()"
        @change="onScopeChange"
      />
      <div class="ml-2 w-64">
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
    <template #toolbar-tools>
      <div class="flex items-center gap-2">
        <Button
          v-if="
            scope !== AttributeScope.CLIENT_SCOPE && selectedItems.length > 0
          "
          danger
          @click="confirmBatchDelete"
        >
          <template #icon>
            <IconifyIcon icon="lucide:trash-2" />
          </template>
          {{ $t('tb.common.delete') }}
        </Button>
        <Button
          v-if="scope !== AttributeScope.CLIENT_SCOPE"
          type="primary"
          @click="onAdd"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('tb.attribute.actions.add') }}
        </Button>
      </div>
    </template>
  </Grid>
</template>
