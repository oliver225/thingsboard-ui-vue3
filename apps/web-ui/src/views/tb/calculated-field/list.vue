<script lang="ts" setup>
/**
 * 计算字段列表(租户级全局视图,GET /api/calculatedFields)
 * 仅提供查看 + 删除;新建/编辑需完整的配置编辑器(arguments/表达式/output),暂未实现。
 */
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CalculatedFieldInfo } from '#/api/tb/calculated-field';

import { reactive } from 'vue';

import { confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCalculatedField,
  getCalculatedFields,
} from '#/api/tb/calculated-field';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { calculatedFieldTypeLabel, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'CalculatedFieldList' });

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getCalculatedFields({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<CalculatedFieldInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 180,
        sortable: true,
        title: $t('tb.calculatedField.fields.name'),
      },
      {
        field: 'type',
        formatter: ({ cellValue }) => calculatedFieldTypeLabel(cellValue),
        title: $t('tb.calculatedField.fields.type'),
        width: 140,
      },
      {
        field: 'entityType',
        slots: {
          default: ({ row }) => entityTypeLabel(row.entityId?.entityType),
        },
        title: $t('tb.calculatedField.fields.entityType'),
        width: 130,
      },
      {
        field: 'entityName',
        minWidth: 180,
        title: $t('tb.calculatedField.fields.entityName'),
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
        align: 'center',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 80,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<CalculatedFieldInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: CalculatedFieldInfo): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: CalculatedFieldInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteCalculatedField(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: CalculatedFieldInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.calculatedField.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.calculatedField.delete.title', { name: row.name }),
  }).catch(() => {});
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('tb.menu.calculatedField')">
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
    </Grid>
  </Page>
</template>
