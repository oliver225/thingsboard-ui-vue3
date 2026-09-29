<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { PageLink, TbUser } from '#/types/tb';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { getCustomerById } from '#/api/tb/customer';
import { deleteUser, deleteUsers, getCustomerUsers } from '#/api/tb/user';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

import CustomerUserForm from './form.vue';

defineOptions({ name: 'CustomerUserList' });

const { hasAccessByRoles } = useAccess();

const route = useRoute();

const authStore = useAuthStore();

const customerId = route.params.customerId as string;

const customerTitle = ref('');

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CustomerUserForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<TbUser>[]>(() => [
  {
    title: $t('customer-user.fields.email'),
    dataIndex: 'email',
    key: 'email',
    slot: 'detailLink',
    width: 200,
    sorter: true,
  },
  {
    title: $t('customer-user.fields.firstName'),
    dataIndex: 'firstName',
    key: 'firstName',
    width: 140,
  },
  {
    title: $t('customer-user.fields.lastName'),
    dataIndex: 'lastName',
    key: 'lastName',
    width: 140,
  },
  {
    title: $t('customer-user.fields.phone'),
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<TbUser> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'loginAs',
        icon: 'lucide:log-in',
        text: $t('customer-user.actions.loginAs'),
        tooltip: $t('customer-user.actions.loginAs'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleLoginAs(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('customer-user.actions.edit'),
        tooltip: $t('customer-user.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('customer-user.actions.delete'),
        tooltip: $t('customer-user.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<TbUser>({
  api: fetchList,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('customer-user.menu'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteUsers,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

onMounted(async () => {
  if (customerId) {
    const customer = await getCustomerById(customerId);
    customerTitle.value = customer.title;
  }
});

async function fetchList(pageLink: PageLink) {
  return getCustomerUsers(customerId, {
    ...pageLink,
  });
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({ customerId }).open();
}

function handleEdit(record: TbUser) {
  if (!record.id?.id) return;
  formModalApi.setData({ customerId, userId: record.id?.id }).open();
}

async function handleDelete(record: TbUser) {
  const userId = record.id?.id;
  if (!userId) return;

  await confirm({
    title: $t('customer-user.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('customer-user.menu'),
      name: record.email,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteUser(userId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

/** 以该客户用户身份登录:委托 authStore.userLogin(换取令牌 → 重置会话 → 整页重载) */
async function handleLoginAs(record: TbUser) {
  if (!record.id?.id) return;
  await confirm({
    content: $t('customer-user.features.loginAs.content'),
    icon: 'warning',
    title: $t('customer-user.features.loginAs.title', { name: record.email }),
  });
  await authStore.userLogin(record.id.id);
}

function handleSaved() {
  return reload();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="
        customerTitle
          ? `${$t('tb.menu.customerUser')} : ${customerTitle}`
          : $t('tb.menu.customerUser')
      "
    >
      <template #query>
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-80 sm:max-w-full"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('tb.common.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <Button
          v-access:role="[Authority.TENANT_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('customer-user.actions.create') }}
        </Button>
      </template>
      <template #detailLink="{ record }">
        <RouterLink
          v-if="record.id"
          :to="{
            name: 'CustomerUserDetail',
            params: { customerId, userId: record.id.id },
          }"
          class="text-primary hover:underline"
        >
          {{ record.email || '—' }}
        </RouterLink>
        <span v-else>{{ record.email || '—' }}</span>
      </template>
    </BasicTable>
  </Page>
</template>
