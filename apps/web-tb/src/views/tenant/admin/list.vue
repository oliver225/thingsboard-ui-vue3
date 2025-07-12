<script lang="ts" setup>
import type { UserInfo } from '@vben/types';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { TenantApi } from '#/api';

import { reactive, ref, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Authority } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { isEmpty } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUserApi,
  getTenantAdminListApi,
  getTenantInfoByIdApi,
  getUserTokenApi,
} from '#/api';
import { router } from '#/router';
import { useAuthStore } from '#/store';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'TenantAdminList',
});
const authStore = useAuthStore();

const tenantInfo = ref<null | TenantApi.TenantInfo>(null);

const searchParam = reactive({
  textSearch: '',
});

watch(
  () => searchParam.textSearch,
  () => {
    if (gridApi) {
      gridApi.reload();
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
  const tenantId = router.currentRoute.value.params.tenantId as string;
  if (isEmpty(tenantId)) {
    throw new Error('租户为空！');
  }
  tenantInfo.value = await getTenantInfoByIdApi(tenantId);

  return await getTenantAdminListApi(
    {
      page: page.currentPage - 1,
      pageSize: page.pageSize,
      sortProperty: sort.field,
      sortOrder: sort.order,
      ...searchParam,
    },
    tenantId,
  );
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
      title: row?.id?.id ? `${$t('编辑管理员')}` : `${$t('添加管理员')}`,
    })
    .setData({
      ...row,
      authority: Authority.TENANT_ADMIN,
      tenantId: tenantInfo.value?.id,
    })
    .open();
}

function handleDelete({ row }: any) {
  confirm({
    title: `${$t('删除用户')}[${row.email}]`,
    content: `${$t('确认后，用户和所有相关数据将不可恢复!')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? deleteUserApi(row.id.id) : true;
    },
  }).then(async () => {
    message.success(`删除用户[${row.email}]成功！`);
    await reload();
  });
}

async function handleLoginUser({ row }: any) {
  try {
    const jwtPair = await getUserTokenApi(row.id.id);
    await authStore.tokenLogin(jwtPair);
  } catch (error: any) {
    message.error(error.message);
  } finally {
    location.reload();
  }
}

const tableAction = {
  actions: [
    {
      label: `${$t('以管理员身份登录')}`,
      tooltip: `${$t('以管理员身份登录')}`,
      icon: 'ant-design:login-outlined',
      onClick: handleLoginUser,
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

const gridOptions: VxeGridProps<UserInfo> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'email', title: $t('tenant.form.email') },
    {
      field: 'firstName',
      sortable: true,
      title: $t('用户名称'),
    },
    {
      field: 'lastName',
      sortable: true,
      title: $t('用户昵称'),
    },
    { field: 'phone', title: $t('tenant.form.phone') },
    {
      title: $t('账户状态'),
      field: 'additionalInfo.description',
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
        <p class="text-lg font-semibold">
          {{ $t('租户管理员') }}
          <span class="text-sm">（{{ tenantInfo?.title }}）</span>
        </p>
        <p class="text-muted-foreground">
          这是一个租户 {{ tenantInfo?.title }} 的管理员列表
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
              {{ $t('添加租户管理员') }}
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
      @login="handleLoginUser"
    />
  </Page>
</template>
