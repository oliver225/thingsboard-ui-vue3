<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { TenantInfo } from '#/api';
import type { ActionItem } from '#/components/Table';
import type { UserInfo } from '#/types';

import { reactive, ref, watch } from 'vue';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUserApi,
  getTenantAdminListApi,
  getTenantInfoByIdApi,
  getUserTokenApi,
} from '#/api';
import { TableTopAction } from '#/components/Table';
import { Authority } from '#/constants';
import { router } from '#/router';
import { useAuthStore } from '#/store';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'TenantAdminList',
});
const authStore = useAuthStore();

const tenantInfo = ref<null | TenantInfo>(null);

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
      label: `${$t('以管理员身份登录')}`,
      tooltip: `${$t('以管理员身份登录')}`,
      icon: 'ant-design:login-outlined',
      onClick: handleLoginUser.bind(this, { ...record }),
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
const tableColumns: VxeGridPropTypes.Columns<UserInfo> = [
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
      name: 'CellAction',
      props: tableAction,
    },
    width: 160,
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: tableColumns,
    proxyConfig: {
      ajax: {
        query: fetch,
      },
      sort: true,
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
    gridApi?.query();
  },
);

async function reload() {
  searchParam.textSearch = '';
  gridApi?.reload();
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

function handleDetail(record: any | UserInfo) {
  detailDrawerApi.setData({ id: record?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm(record: any | UserInfo) {
  formModalApi
    .setState({
      title: record?.id?.id ? `${$t('编辑管理员')}` : `${$t('添加管理员')}`,
    })
    .setData({
      ...record,
      authority: Authority.TENANT_ADMIN,
      tenantId: tenantInfo.value?.id,
    })
    .open();
}

function handleDelete(record: any | UserInfo) {
  confirm({
    title: `${$t('删除用户')}[${record.email}]`,
    content: `${$t('确认后，用户和所有相关数据将不可恢复!')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose({ isConfirm }) {
      return isConfirm ? deleteUserApi(record.id.id) : true;
    },
  }).then(async () => {
    message.success(`删除用户[${record.email}]成功！`);
    await reload();
  });
}

async function handleLoginUser(record: any | UserInfo) {
  try {
    const jwtPair = await getUserTokenApi(record.id.id);
    await authStore.tokenLogin(jwtPair);
  } catch (error: any) {
    message.error(error.message);
  } finally {
    location.reload();
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid
      :table-header-title="$t('租户管理员')"
      :table-header-title-help="`这是租户 [ ${tenantInfo?.title} ] 的管理员列表`"
    >
      <template #toolbar-actions>
        <TableTopAction
          :btn-title="$t('tenant.button.addTenantAdmin')"
          v-model:search-text="searchParam.textSearch"
          @btn-click="handleForm({})"
        />
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
