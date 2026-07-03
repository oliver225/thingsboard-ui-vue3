<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbUser } from '#/types/tb';

import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTenantById } from '#/api/tb/tenant';
import { deleteUser, getTenantAdmins } from '#/api/tb/user';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

import TenantAdminForm from './form.vue';

defineOptions({ name: 'TenantAdminList' });

const route = useRoute();
const authStore = useAuthStore();
const tenantId = route.params.tenantId as string;
const tenantTitle = ref('');

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TenantAdminForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getTenantAdmins(tenantId, {
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<TbUser>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'email',
        minWidth: 200,
        sortable: true,
        title: $t('tb.tenantAdmin.fields.email'),
      },
      {
        field: 'firstName',
        minWidth: 140,
        title: $t('tb.tenantAdmin.fields.firstName'),
      },
      {
        field: 'lastName',
        minWidth: 140,
        title: $t('tb.tenantAdmin.fields.lastName'),
      },
      {
        field: 'phone',
        minWidth: 140,
        title: $t('tb.tenantAdmin.fields.phone'),
      },
      {
        field: 'createdTime',
        formatter: ({ cellValue }) => formatDateTime(cellValue),
        sortable: true,
        title: $t('tb.common.createdTime'),
        width: 170,
      },
      {
        field: 'actions',
        fixed: 'right',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 120,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<TbUser>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: TbUser): ActionItem[] {
  return [
    {
      icon: 'lucide:log-in',
      onClick: () => confirmLoginAs(row),
      tooltip: $t('tb.tenantAdmin.actions.loginAs'),
    },
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

/** 以该管理员身份登录:委托 authStore.loginAs(换取令牌 → 重置会话 → 整页重载) */
async function loginAsUser(row: TbUser) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await authStore.userLogin(row.id.id);
  } catch {
    return false;
  }
}

function confirmLoginAs(row: TbUser) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return loginAsUser(row);
    },
    content: $t('tb.tenantAdmin.loginAs.content'),
    icon: 'warning',
    title: $t('tb.tenantAdmin.loginAs.title', { name: row.email }),
  }).catch(() => {});
}

function onCreate() {
  formModalApi.setData({ tenantId }).open();
}

function onEdit(row: TbUser) {
  formModalApi.setData({ tenantId, userId: row.id?.id }).open();
}

async function deleteByRow(row: TbUser) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteUser(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: TbUser) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.tenantAdmin.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.tenantAdmin.delete.title', {
      name: row.email,
    }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}

onMounted(async () => {
  if (tenantId) {
    const tenant = await getTenantById(tenantId);
    tenantTitle.value = tenant.title;
  }
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid
      :table-title="
        tenantTitle
          ? `${$t('tb.menu.tenantAdmin')} : ${tenantTitle}`
          : $t('tb.menu.tenantAdmin')
      "
    >
      <template #toolbar-actions>
        <div class="flex items-center gap-2">
          <div class="w-72">
            <Input
              v-model:value="queryParams.textSearch"
              allow-clear
              :placeholder="$t('tb.common.searchPlaceholder')"
              @change="onSearch"
            >
              <template #suffix>
                <IconifyIcon icon="lucide:search" />
              </template>
            </Input>
          </div>
        </div>
      </template>
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('tb.tenantAdmin.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
