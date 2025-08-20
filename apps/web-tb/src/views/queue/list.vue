<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { Queue } from '#/api';
import type { ActionItem } from '#/components/Table';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { queueListApi, tenantDeleteApi } from '#/api';
import { TableTopAction } from '#/components/Table';
import {
  PROCESSING_STRATEGY_OPTIONS,
  SUBMIT_STRATEGY_OPTIONS,
} from '#/constants';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'QueueList',
});

const searchParam = reactive({
  textSearch: '',
});

const tableAction = {
  actions: (record: Recordable<any>): ActionItem[] => [
    {
      label: `${$t('page.detail.title')}`,
      tooltip: `${$t('page.detail.title')}`,
      icon: 'ant-design:appstore-outlined',
      onClick: handleDetail.bind(this, { ...record }),
    },
    {
      label: `${$t('page.remove.title')}`,
      tooltip: `${$t('page.remove.title')}`,
      icon: 'ant-design:delete-outlined',
      color: 'destructive',
      onClick: handleDelete.bind(this, { ...record }),
    },
  ],
};

const tableColumns: VxeGridPropTypes.Columns<Queue> = [
  { title: '序号', type: 'seq', width: 60 },
  { field: 'name', sortable: true, title: $t('名称') },
  {
    field: 'partitions',
    width: 80,
    title: $t('分区'),
  },
  {
    field: 'submitStrategy',
    title: $t('提交策略'),
    formatter: ({ cellValue }) =>
      cellValue.type
        ? SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === cellValue.type)
            ?.label || cellValue.type
        : '',
  },
  {
    field: 'processingStrategy',
    title: $t('处理策略'),
    formatter: ({ cellValue }) =>
      cellValue.type
        ? PROCESSING_STRATEGY_OPTIONS.find(
            (item) => item.value === cellValue.type,
          )?.label || cellValue.type
        : '',
  },
  {
    field: 'createdTime',
    sortable: true,
    width: 160,
    formatter: 'formatDateTime',
    title: $t('tenant.form.createdTime'),
  },
  {
    title: $t('page.action.title'),
    field: 'action',
    align: 'center',
    fixed: 'right',
    cellRender: {
      name: 'CellAction',
      props: tableAction,
    },
    width: 180,
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: tableColumns,
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  },
});

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: Detail,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
});

watch(
  () => searchParam.textSearch,
  () => {
    if (gridApi) {
      gridApi.query();
    }
  },
);

async function reload() {
  searchParam.textSearch = '';
  if (gridApi) {
    await gridApi.query();
  }
}

async function fetch({ page, sort }: any) {
  return await queueListApi({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortProperty: sort.field,
    sortOrder: sort.order,
    ...searchParam,
  });
}

function handleDetail(record: any | Queue) {
  detailDrawerApi.setData({ id: record?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm(record: any | Queue) {
  formModalApi
    .setState({
      title: record?.id?.id ? `${$t('编辑队列')}` : `${$t('添加队列')}`,
    })
    .setData({ id: record?.id?.id })
    .open();
}

function handleDelete(record: any | Queue) {
  confirm({
    title: `${$t('删除队列')}[${record.name}]`,
    content: `${$t('确认后队列和所有相关数据将不可恢复。')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? tenantDeleteApi(record.id.id) : true;
    },
  }).then(async () => {
    message.success(`${$t('删除队列')}[${record.name}]成功！`);
    await reload();
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-header-title="$t('队列')">
      <template #toolbar-actions>
        <TableTopAction
          :btn-title="$t('添加队列')"
          v-model:search-text="searchParam.textSearch"
          @btn-click="handleForm({})"
        />
      </template>
    </Grid>
    <FormModal @success="handleSuccess" />
    <DetailDrawer @edit="handleForm" @delete="handleDelete" />
  </Page>
</template>
