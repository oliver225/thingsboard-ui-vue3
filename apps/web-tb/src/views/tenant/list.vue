<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TenantInfo } from '#/api';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { areaList } from '@vant/area-data';
import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { tenantDeleteApi, tenantInfoListApi } from '#/api';
import { router } from '#/router';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'TenantList',
});

const searchParam = reactive({
  textSearch: '',
});

watch(
  () => searchParam.textSearch,
  () => {
    gridApi?.query();
  },
);

async function reload() {
  searchParam.textSearch = '';
  gridApi?.reload();
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

function handleDetail({ row }: any) {
  detailDrawerApi.setData({ id: row?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm({ row }: any) {
  formModalApi
    .setState({
      title: row?.id?.id
        ? `${$t('tenant.button.editTenant')}`
        : `${$t('tenant.button.addTenant')}`,
    })
    .setData({ id: row?.id?.id })
    .open();
}

function handleDelete({ row }: any) {
  confirm({
    title: `${$t('tenant.button.removeTenant')}[${row.title}]`,
    content: `${$t('tenant.removeContent')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? tenantDeleteApi(row.id.id) : true;
    },
  }).then(async () => {
    message.success(`删除租户[${row.title}]成功！`);
    await reload();
  });
}

function handleAdmin({ row }: any) {
  router.push({
    path: `/tenants/${row.id.id}/users`,
  });
}

const tableAction = {
  actions: [
    {
      label: `${$t('租户管理员')}`,
      tooltip: `${$t('租户管理员')}`,
      icon: 'mdi:account-circle-outline',
      onClick: handleAdmin,
    },
    {
      label: `${$t('page.detail.title')}`,
      tooltip: `${$t('page.detail.title')}`,
      icon: 'ant-design:appstore-outlined',
      onClick: handleDetail,
    },
    {
      label: `${$t('page.remove.title')}`,
      tooltip: `${$t('page.remove.title')}`,
      icon: 'ant-design:delete-outlined',
      danger: true,
      onClick: handleDelete,
    },
  ],
};

const gridOptions: VxeGridProps<TenantInfo> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'title', sortable: true, title: $t('tenant.form.title') },
    {
      field: 'tenantProfileName',
      sortable: true,
      title: $t('tenant.form.tenantProfileName'),
    },
    { field: 'email', title: $t('tenant.form.email') },
    { field: 'phone', title: $t('tenant.form.phone') },
    {
      field: 'city',
      title: $t('tenant.form.city'),
      slots: { default: 'citySolt' },
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
        name: 'CellActions',
        props: tableAction,
      },
      width: 160,
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
    <Grid
      :top-title="$t('tenant.title')"
      top-title-help="这是一个基础的租户列表，包含了租户的基本信息。"
    >
      <template #toolbar-tools>
        <ToolBar :api="gridApi" />
      </template>
      <template #toolbar-actions>
        <TopAction
          :btn-title="$t('tenant.button.addTenant')"
          v-model:search-text="searchParam.textSearch"
          @btn-click="handleForm({})"
        />
      </template>
      <template #citySolt="{ row }">
        <span v-if="row.city"> {{ areaList.city_list[row.city] }}</span>
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
