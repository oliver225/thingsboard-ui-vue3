<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TenantApi } from '#/api';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { areaList } from '@vant/area-data';
import { Button, Input, message } from 'ant-design-vue';

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

const gridOptions: VxeGridProps<TenantApi.TenantInfo> = {
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
    <Grid>
      <template #table-top>
        <p class="text-lg font-semibold">{{ $t('tenant.title') }}</p>
        <p class="text-muted-foreground">
          这是一个基础的租户列表，包含了租户的基本信息。
        </p>
      </template>
      <template #toolbar-actions>
        <div class="flex items-center justify-start space-x-2">
          <Button
            @click="() => handleForm({})"
            type="primary"
            class="flex items-center"
          >
            <IconifyIcon class="size-4" icon="mdi:plus" />
            <span class="font-semibold">
              {{ $t('tenant.button.addTenant') }}
            </span>
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
        </div>
      </template>
      <template #citySolt="{ row }">
        <span v-if="row.city"> {{ areaList.city_list[row.city] }}</span>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <VbenIconButton
            v-tippy="{
              content: `${$t('page.refresh.title')}`,
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
