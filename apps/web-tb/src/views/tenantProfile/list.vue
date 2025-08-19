<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { TenantProfile } from '#/api';
import type { ActionItem } from '#/components/Table';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenantProfileApi,
  setTenantProfileDefaultApi,
  tenantProfileListApi,
} from '#/api';
import { TableTopAction } from '#/components/Table';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'TenantProfileList',
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
      label: `${$t('设为默认')}`,
      tooltip: `${$t('设置该租户配置为默认')}`,
      icon: 'mdi:flag',
      disabled: record.default === true,
      onClick: handleDefault.bind(this, { ...record }),
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

const tableColumns: VxeGridPropTypes.Columns<TenantProfile> = [
  { title: '序号', type: 'seq', width: 60 },
  {
    field: 'name',
    title: $t('tenantProfile.form.name'),
    sortable: true,
  },
  {
    field: 'description',
    title: $t('tenantProfile.form.description'),
  },
  {
    field: 'isolatedTbRuleEngine',
    title: $t('tenantProfile.form.isolatedTbRuleEngine'),
    width: 100,
    cellRender: { name: 'CellCheckbox' },
  },
  {
    field: 'default',
    title: $t('tenantProfile.form.default'),
    width: 100,
    cellRender: { name: 'CellCheckbox' },
  },
  {
    field: 'createdTime',
    sortable: true,
    formatter: 'formatDateTime',
    width: 160,
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
  return await tenantProfileListApi({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortProperty: sort.field,
    sortOrder: sort.order,
    ...searchParam,
  });
}

function handleDetail(record: any | TenantProfile) {
  detailDrawerApi.setData({ id: record?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm(record: any | TenantProfile) {
  formModalApi
    .setState({
      title: record?.id?.id
        ? `${$t('tenantProfile.button.edit')}`
        : `${$t('tenantProfile.button.add')}`,
    })
    .setData({ id: record?.id?.id })
    .open();
}

function handleDelete(record: any | TenantProfile) {
  confirm({
    title: `${$t('tenantProfile.button.remove')}[${record.name}]`,
    content: `${$t('tenantProfile.removeContent')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? deleteTenantProfileApi(record.id.id) : true;
    },
  }).then(async () => {
    message.success(
      `${$t('tenantProfile.button.remove')}[${record.name}]成功！`,
    );
    await reload();
  });
}

function handleDefault(record: any | TenantProfile) {
  confirm({
    title: `设为默认租户配置[${record.name}]`,
    content: `${$t('此租户配置将被标记为默认配置，并将用于未指定配置的新租户。')}`,
    icon: 'warning',
    beforeClose({ isConfirm }) {
      return isConfirm ? setTenantProfileDefaultApi(record.id.id) : true;
    },
  }).then(async () => {
    message.success(`设为默认租户配置[${record.name}]成功！`);
    await reload();
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-header-title="$t('tenantProfile.title')">
      <template #toolbar-actions>
        <TableTopAction
          :btn-title="$t('tenantProfile.button.add')"
          v-model:search-text="searchParam.textSearch"
          @btn-click="handleForm({})"
        />
      </template>
    </Grid>
    <FormModal @success="handleSuccess" />
    <DetailDrawer
      @edit="handleForm"
      @delete="handleDelete"
      @default="handleDefault"
    />
  </Page>
</template>
