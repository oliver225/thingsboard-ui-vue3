<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RuleChain } from '#/api/tb/rule-chain';

import { reactive } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRuleChain,
  getRuleChains,
  setRootRuleChain,
} from '#/api/tb/rule-chain';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';

import RuleChainForm from './form.vue';

defineOptions({ name: 'RuleChainList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RuleChainForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getRuleChains({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<RuleChain>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        minWidth: 200,
        sortable: true,
        title: $t('tb.ruleChain.fields.name'),
      },
      {
        field: 'root',
        formatter: ({ cellValue }) =>
          cellValue ? $t('tb.common.yes') : $t('tb.common.no'),
        sortable: true,
        title: $t('tb.ruleChain.fields.root'),
        width: 120,
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
        width: 120,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<RuleChain>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: RuleChain): ActionItem[] {
  return [
    {
      icon: 'lucide:flag',
      ifShow: !row.root,
      onClick: () => confirmSetRoot(row),
      tooltip: $t('tb.ruleChain.actions.setRoot'),
    },
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      ifShow: !row.root,
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: RuleChain) {
  formModalApi.setData({ ruleChainId: row.id?.id }).open();
}

async function deleteByRow(row: RuleChain) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteRuleChain(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: RuleChain) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.ruleChain.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.ruleChain.delete.title', { name: row.name }),
  }).catch(() => {});
}

async function setRootByRow(row: RuleChain) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await setRootRuleChain(row.id.id);
    message.success($t('tb.ruleChain.setRoot.success'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmSetRoot(row: RuleChain) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return setRootByRow(row);
    },
    content: $t('tb.ruleChain.setRoot.content'),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.ruleChain.setRoot.title', { name: row.name }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.ruleChain')">
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
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('tb.ruleChain.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
