<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { TenantInfo } from '#/api';
import type { ActionItem } from '#/components/Table';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { areaList } from '@vant/area-data';
import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { tenantDeleteApi, tenantInfoListApi } from '#/api';
import { TableTopAction } from '#/components/Table';
import { router } from '#/router';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'TenantList',
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
      label: `${$t('租户管理员')}`,
      tooltip: `${$t('租户管理员')}`,
      icon: 'mdi:account-circle-outline',
      onClick: handleAdmin.bind(this, { ...record }),
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

const tableColumns: VxeGridPropTypes.Columns<TenantInfo> = [
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
  return await tenantInfoListApi({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortProperty: sort.field,
    sortOrder: sort.order,
    ...searchParam,
  });
}

function handleDetail(record: any | TenantInfo) {
  detailDrawerApi.setData({ id: record?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm(record: any | TenantInfo) {
  formModalApi
    .setState({
      title: record?.id?.id
        ? `${$t('tenant.button.editTenant')}`
        : `${$t('tenant.button.addTenant')}`,
    })
    .setData({ id: record?.id?.id })
    .open();
}

function handleDelete(record: any | TenantInfo) {
  confirm({
    title: `${$t('tenant.button.removeTenant')}[${record.title}]`,
    content: `${$t('tenant.removeContent')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? tenantDeleteApi(record.id.id) : true;
    },
  }).then(async () => {
    message.success(
      `${$t('tenant.button.removeTenant')}[${record.title}]成功！`,
    );
    await reload();
  });
}

function handleAdmin(record: any | TenantInfo) {
  router.push({
    path: `/tenants/${record.id.id}/users`,
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid
      :table-header-title="$t('tenant.title')"
      table-header-title-help="租户管理租户内部内部信息。"
    >
      <template #toolbar-actions>
        <TableTopAction
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
