<script lang="ts" setup>
/**
 * AI 模型列表(TENANT_ADMIN)。
 * 仅查看 + 删除;新建/编辑需多态供应商配置(9 种 provider + 密钥),暂未实现。
 * 内嵌于 settings 外壳的内容区(已是有界高度),故 Grid 用 height:'auto' 而非 Page。
 */
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiModel } from '#/api/tb/ai-model';

import { reactive } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAiModel, getAiModels } from '#/api/tb/ai-model';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { aiProviderLabel } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'SettingsAiModels' });

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getAiModels({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<AiModel>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 180,
        sortable: true,
        title: $t('tb.aiModel.fields.name'),
      },
      {
        field: 'provider',
        slots: {
          default: ({ row }) => aiProviderLabel(row.configuration?.provider),
        },
        title: $t('tb.aiModel.fields.provider'),
        width: 200,
      },
      {
        field: 'modelId',
        minWidth: 180,
        slots: {
          default: ({ row }) => row.configuration?.modelId ?? '',
        },
        title: $t('tb.aiModel.fields.modelId'),
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
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<AiModel>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: AiModel): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: AiModel) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteAiModel(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: AiModel) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.aiModel.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.aiModel.delete.title', { name: row.name }),
  }).catch(() => {});
}
</script>

<template>
  <Grid :table-title="$t('tb.settings.aiModels')">
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
</template>
