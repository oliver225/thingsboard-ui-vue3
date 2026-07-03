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
import { getCustomerById } from '#/api/tb/customer';
import { deleteUser, getCustomerUsers } from '#/api/tb/user';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

import CustomerUserForm from './form.vue';

defineOptions({ name: 'CustomerUserList' });

const route = useRoute();
const authStore = useAuthStore();
const customerId = route.params.customerId as string;
const customerTitle = ref('');

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CustomerUserForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getCustomerUsers(customerId, {
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'desc' ? 'DESC' : 'ASC',
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
        title: $t('tb.customerUser.fields.email'),
      },
      {
        field: 'firstName',
        minWidth: 140,
        title: $t('tb.customerUser.fields.firstName'),
      },
      {
        field: 'lastName',
        minWidth: 140,
        title: $t('tb.customerUser.fields.lastName'),
      },
      {
        field: 'phone',
        minWidth: 140,
        title: $t('tb.customerUser.fields.phone'),
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
      tooltip: $t('tb.customerUser.actions.loginAs'),
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

/** 以该客户用户身份登录:委托 authStore.userLogin(换取令牌 → 重置会话 → 整页重载) */
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
    content: $t('tb.customerUser.loginAs.content'),
    icon: 'warning',
    title: $t('tb.customerUser.loginAs.title', { name: row.email }),
  }).catch(() => {});
}

function onCreate() {
  formModalApi.setData({ customerId }).open();
}

function onEdit(row: TbUser) {
  formModalApi.setData({ customerId, userId: row.id?.id }).open();
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
    content: $t('tb.customerUser.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.customerUser.delete.title', { name: row.email }),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}

onMounted(async () => {
  if (customerId) {
    const customer = await getCustomerById(customerId);
    customerTitle.value = customer.title;
  }
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid
      :table-title="
        customerTitle
          ? `${$t('tb.menu.customerUser')} : ${customerTitle}`
          : $t('tb.menu.customerUser')
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
          {{ $t('tb.customerUser.actions.create') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
