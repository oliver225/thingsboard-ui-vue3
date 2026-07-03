<script lang="ts" setup>
/**
 * 告警规则列表(底层为 ALARM 类型的计算字段)。
 * 仅查看 + 删除;新建/编辑需完整的规则配置编辑器(条件/严重程度/调度等),暂未实现。
 */
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlarmRuleDefinitionInfo } from '#/api/tb/alarm-rule';

import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message, Segmented } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAlarmRule, getAlarmRules } from '#/api/tb/alarm-rule';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { entityTypeLabel } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'AlarmRuleList' });

const router = useRouter();

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getAlarmRules({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<AlarmRuleDefinitionInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 180,
        sortable: true,
        title: $t('tb.alarmRule.fields.name'),
      },
      {
        field: 'entityType',
        slots: {
          default: ({ row }) => entityTypeLabel(row.entityId?.entityType),
        },
        title: $t('tb.alarmRule.fields.entityType'),
        width: 130,
      },
      {
        field: 'entityName',
        minWidth: 180,
        title: $t('tb.alarmRule.fields.entityName'),
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
  } as VxeTableGridOptions<AlarmRuleDefinitionInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: AlarmRuleDefinitionInfo): ActionItem[] {
  return [
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

async function deleteByRow(row: AlarmRuleDefinitionInfo) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteAlarmRule(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: AlarmRuleDefinitionInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.alarmRule.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.alarmRule.delete.title', { name: row.name }),
  }).catch(() => {});
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #table-title>
        <Segmented
          size="large"
          :options="[
            { label: $t('tb.menu.alarmList'), value: 'AlarmList' },
            { label: $t('tb.menu.alarmRule'), value: 'AlarmRule' },
          ]"
          value="AlarmRule"
          @change="
            (value: number | string) => {
              router.push({ name: value as string });
            }
          "
        />
      </template>
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
