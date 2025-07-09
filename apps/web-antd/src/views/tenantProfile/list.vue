<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TenantProfileApi } from '#/api';

import { reactive, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { areaList } from '@vant/area-data';
import { Button, Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTenantProfileApi,
  setTenantProfileDefaultApi,
  tenantProfileListApi,
} from '#/api';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'TenantProfileList',
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
  return await tenantProfileListApi({
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
        ? `${$t('tenantProfile.button.edit')}`
        : `${$t('tenantProfile.button.add')}`,
    })
    .setData({ id: row?.id?.id })
    .open();
}

function handleDelete({ _column, _$table, row }: any) {
  confirm({
    title: `${$t('tenantProfile.button.remove')}[${row.name}]`,
    content: `${$t('tenantProfile.removeContent')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? deleteTenantProfileApi(row.id.id) : true;
    },
  }).then(async () => {
    message.success(`${$t('tenantProfile.button.remove')}[${row.name}]成功！`);
    await reload();
  });
}

function handleDefault({ _column, _$table, row }: any) {
  confirm({
    title: `设为默认租户配置[${row.name}]`,
    content: `${$t('此租户配置将被标记为默认配置，并将用于未指定配置的新租户。')}`,
    icon: 'warning',
    beforeClose({ isConfirm }) {
      return isConfirm ? setTenantProfileDefaultApi(row.id.id) : true;
    },
  }).then(async () => {
    message.success(`设为默认租户配置[${row.name}]成功！`);
    await reload();
  });
}

const tableAction = {
  actions: [
    {
      label: `${$t('设为默认')}`,
      tooltip: `${$t('设置该租户配置为默认')}`,
      icon: 'mdi:flag',
      disabled: ({ row }: any) => row.default,
      onClick: handleDefault,
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

const gridOptions: VxeGridProps<TenantProfileApi.TenantProfile> = {
  columns: [
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
        name: 'CellActions',
        props: tableAction,
      },
      width: 180,
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
        <p class="text-lg font-semibold">{{ $t('tenantProfile.title') }}</p>
        <p class="text-muted-foreground">包含一个租户相关的配置信息。</p>
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
              {{ $t('tenantProfile.button.add') }}
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
      @default="handleDefault"
    />
  </Page>
</template>
