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
import { getTenantById } from '#/api/tb/tenant';
import { deleteUser, deleteUsers, getTenantAdmins } from '#/api/tb/user';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';

import TenantAdminForm from './form.vue';

defineOptions({ name: 'TenantAdminList' });

const { hasAccessByRoles } = useAccess();

const route = useRoute();

const authStore = useAuthStore();

const tenantId = route.params.tenantId as string;

const tenantTitle = ref('');

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TenantAdminForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<TbUser>[]>(() => [
  {
    title: $t('tenant-admin.fields.email'),
    dataIndex: 'email',
    key: 'email',
    slot: 'detailLink',
    width: 200,
    sorter: true,
  },
  {
    title: $t('tenant-admin.fields.firstName'),
    dataIndex: 'firstName',
    key: 'firstName',
    width: 140,
  },
  {
    title: $t('tenant-admin.fields.lastName'),
    dataIndex: 'lastName',
    key: 'lastName',
    width: 140,
  },
  {
    title: $t('tenant-admin.fields.phone'),
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
        text: $t('tenant-admin.actions.loginAs'),
        tooltip: $t('tenant-admin.actions.loginAs'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleLoginAs(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('tenant-admin.actions.edit'),
        tooltip: $t('tenant-admin.actions.edit'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('tenant-admin.actions.delete'),
        tooltip: $t('tenant-admin.actions.delete'),
        auth: Authority.SYS_ADMIN,
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
    entityName: () => $t('tenant-admin.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteUsers,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

onMounted(async () => {
  if (tenantId) {
    const tenant = await getTenantById(tenantId);
    tenantTitle.value = tenant.title;
  }
});

async function fetchList(pageLink: PageLink) {
  return getTenantAdmins(tenantId, {
    ...pageLink,
  });
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({ tenantId }).open();
}

function handleEdit(record: TbUser) {
  if (!record.id?.id) return;
  formModalApi.setData({ tenantId, userId: record.id?.id }).open();
}

async function handleDelete(record: TbUser) {
  const userId = record.id?.id;
  if (!userId) return;

  await confirm({
    title: $t('tenant-admin.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('tenant-admin.menu'),
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

/** 以该管理员身份登录:委托 authStore.loginAs(换取令牌 → 重置会话 → 整页重载) */
async function handleLoginAs(record: TbUser) {
  if (!record.id?.id) return;
  await confirm({
    content: $t('tenant-admin.features.loginAs.content'),
    icon: 'warning',
    title: $t('tenant-admin.features.loginAs.title', { name: record.email }),
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
        tenantTitle
          ? `${$t('tb.menu.tenantAdmin')} : ${tenantTitle}`
          : $t('tb.menu.tenantAdmin')
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
          v-access:role="[Authority.SYS_ADMIN]"
          type="primary"
          @click="handleCreate"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" class="size-4" aria-hidden="true" />
          </template>
          {{ $t('tenant-admin.actions.create') }}
        </Button>
      </template>
      <template #detailLink="{ record }">
        <RouterLink
          v-if="record.id"
          :to="{
            name: 'TenantAdminDetail',
            params: { tenantId, userId: record.id.id },
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
