<script lang="ts" setup>
import type { EntityId, EntityType } from '@vben/constants';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { tenantInfoListApi } from '#/api';

interface RowType {
  id: EntityId<EntityType.TENANT>;
  title: string;
  tenantProfileName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  createdTime: number;
}

const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'title', sortable: true, title: '标题' },
    { field: 'tenantProfileName', title: '配置' },
    { field: 'email', title: '邮箱' },
    { field: 'phone', title: '电话' },
    { field: 'address', title: '地址' },
    {
      field: 'createdTime',
      sortable: true,
      formatter: 'formatDateTime',
      title: '创建时间',
    },
  ],

  exportConfig: {},
  height: 'auto',
  keepSource: true,
  border: true,
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }) => {
        return await tenantInfoListApi({
          page: page.currentPage - 1,
          pageSize: page.pageSize,
          sortProperty: sort.field,
          sortOrder: sort.order,
        });
      },
    },
    sort: true,
  },
  sortConfig: {
    defaultSort: { field: 'createdTime', order: 'desc' },
    remote: true,
  },
  toolbarConfig: {
    custom: true,
    export: true,
    // import: true,
    refresh: { code: 'query' },
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="租户">
      <template #table-top>
        <p class="text-lg font-semibold">租户</p>
        <p class="text-muted-foreground">
          这是一个基础的租户列表，包含了租户的基本信息。
        </p>
      </template>
      <!-- <template #table-title>asd </template> -->
      <!-- <template #toolbar-actions>
        <Button class="mr-2" type="primary" @click="() => gridApi.query()">
          刷新当前页面
        </Button>
      </template> -->
      <template #toolbar-tools>
        <Button class="mr-2" type="primary" @click="() => gridApi.query()">
          刷新当前页面
        </Button>
        <Button type="primary" @click="() => gridApi.reload()">
          刷新并返回第一页
        </Button>
      </template>
    </Grid>
  </Page>
</template>
