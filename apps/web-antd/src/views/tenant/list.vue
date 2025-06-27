<script lang="ts" setup>
import type { EntityId, EntityType } from '@vben/constants';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { reactive, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { MdiPlus, MdiRefresh, MdiSearch } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { tenantInfoListApi } from '#/api';

import Form from './form.vue';

const searchParam = reactive({
  textSearch: '',
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
  return await tenantInfoListApi({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortProperty: sort.field,
    sortOrder: sort.order,
    ...searchParam,
  });
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
});

function handleForm() {
  formModalApi.setData({}).open();
}

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
  // checkboxConfig: {
  //   highlight: true,
  //   labelField: 'name',
  // },
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

  height: 'auto',
  keepSource: true,
  border: true,
  proxyConfig: {
    ajax: {
      query: fetch,
    },
    sort: true,
  },
  sortConfig: {
    defaultSort: { field: 'createdTime', order: 'desc' },
    remote: true,
  },
  toolbarConfig: {
    custom: true,
    export: false,
    // // import: true,
    // refresh: { code: 'query' },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #table-top>
        <p class="text-lg font-semibold">{{ $t('page.tenant.title') }}</p>
        <p class="text-muted-foreground">
          这是一个基础的租户列表，包含了租户的基本信息。
        </p>
      </template>
      <template #toolbar-actions>
        <Button
          @click="() => handleForm()"
          type="primary"
          class="mr-2 flex items-center"
        >
          <MdiPlus class="size-5" />
          <span class="font-semibold"> {{ $t('page.tenant.addTenant') }} </span>
        </Button>
        <Input
          class="w-80"
          v-model:value="searchParam.textSearch"
          :placeholder="$t('page.search.placeholder')"
        >
          <template #suffix>
            <MdiSearch class="size-5" />
          </template>
        </Input>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <VbenIconButton
            v-tippy="{
              content: '刷新',
              theme: 'dark',
              delay: 100,
              animation: 'shift-away',
            }"
          >
            <MdiRefresh class="size-6" @click="reload" />
          </VbenIconButton>
        </div>
      </template>
    </Grid>
    <FormModal />
  </Page>
</template>
