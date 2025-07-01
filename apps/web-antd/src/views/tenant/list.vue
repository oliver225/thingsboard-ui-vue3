<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TenantApi } from '#/api';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { tenantDeleteApi, tenantInfoListApi } from '#/api';

import Detail from './detail.vue';
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

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: Detail,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
});

function handleDetail({ _column, _$table, row }: any) {
  detailDrawerApi.setData({ id: row?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm({ _column, _$table, row }: any) {
  formModalApi
    .setState({
      title: row?.id?.id
        ? `${$t('page.tenant.editTenant')}`
        : `${$t('page.tenant.addTenant')}`,
    })
    .setData({ id: row?.id?.id })
    .open();
}

function handleDelete({ _column, _$table, row }: any) {
  confirm({
    title: `刪除租户[${row.title}]`,
    content: '确认后，租户和所有相关数据将不可恢复!',
    icon: 'error',
    confirmText: '删除',
    beforeClose({ isConfirm }) {
      return isConfirm ? tenantDeleteApi(row.id.id) : true;
    },
  }).then(async () => {
    message.success(`删除租户[${row.title}]成功！`);
    await reload();
  });
}

function handleAdmin({ _column, _$table, row }: any) {
  console.log(_column, _$table, row);
}

const tableAction = {
  actions: [
    {
      label: '详情',
      tooltip: '详情',
      icon: 'ant-design:appstore-outlined',
      onClick: handleDetail,
    },
    {
      label: '删除',
      tooltip: '删除',
      icon: 'ant-design:delete-outlined',
      danger: true,
      onClick: handleDelete,
    },
  ],
};

const gridOptions: VxeGridProps<TenantApi.TenantInfo> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'title', sortable: true, title: '名称' },
    { field: 'tenantProfileName', sortable: true, title: '配置' },
    { field: 'email', title: '邮箱' },
    { field: 'phone', title: '电话' },
    { field: 'address', title: '地址' },
    {
      field: 'createdTime',
      sortable: true,
      formatter: 'formatDateTime',
      title: '创建时间',
    },
    {
      title: '操作',
      field: 'action',
      align: 'center',
      fixed: 'right',
      cellRender: {
        name: 'CellActions',
        props: tableAction,
      },
      width: 120,
    },
  ],

  proxyConfig: {
    ajax: {
      query: fetch,
    },
    sort: true,
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
          @click="() => handleForm({})"
          type="primary"
          class="mr-2 flex items-center"
        >
          <IconifyIcon class="size-4" icon="mdi:plus" />
          <span class="font-semibold"> {{ $t('page.tenant.addTenant') }} </span>
        </Button>
        <Input
          class="w-80"
          v-model:value="searchParam.textSearch"
          :placeholder="$t('page.search.placeholder')"
        >
          <template #suffix>
            <IconifyIcon class="size-4" icon="mdi:magnify" />
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
            <IconifyIcon class="size-6" icon="mdi:refresh" @click="reload" />
          </VbenIconButton>
        </div>
      </template>
    </Grid>
    <FormModal @success="handleSuccess" />
    <DetailDrawer
      @edit="handleForm"
      @delete="handleDelete"
      @admin="handleAdmin"
    />
  </Page>
</template>
