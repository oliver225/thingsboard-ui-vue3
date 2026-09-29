<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { OAuth2ClientInfo } from '#/api/tb/oauth2';

import { computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import {
  confirm,
  Page,
  useVbenModal,
  VbenButton,
  VbenSegmented,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { deleteOAuth2Client, getOAuth2Clients } from '#/api/tb/oauth2';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import OAuth2ClientForm from './client-form.vue';

defineOptions({ name: 'OAuth2ClientList' });

// 页面状态与表单弹窗。
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: OAuth2ClientForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<OAuth2ClientInfo>[]>(() => [
  {
    dataIndex: 'title',
    title: $t('oauth2.fields.title'),
    width: 220,
    sorter: true,
  },
  {
    dataIndex: 'providerName',
    title: $t('oauth2.fields.provider'),
    width: 180,
  },
  {
    dataIndex: 'platforms',
    title: $t('oauth2.fields.platforms'),
    width: 220,
    customRender: ({ value }) =>
      value?.length
        ? value
            .map((platform: string) =>
              $t(`oauth2.options.platform.${platform}`),
            )
            .join(', ')
        : $t('oauth2.features.form.allPlatforms'),
  },
  {
    dataIndex: 'createdTime',
    title: $t('tb.common.createdTime'),
    width: 180,
    sorter: true,
    customRender: ({ value }) => (value ? formatDateTime(value) : '—'),
  },
]);

const actionColumn: ActionColumn<OAuth2ClientInfo> = {
  align: 'center',
  width: 240,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('oauth2.actions.editClient'),
        tooltip: $t('oauth2.actions.editClient'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        disabled: !record.id?.id,
        variant: 'ghost',
        size: 'icon',
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('oauth2.actions.deleteClient'),
        tooltip: $t('oauth2.actions.deleteClient'),
        auth: [Authority.SYS_ADMIN, Authority.TENANT_ADMIN],
        disabled: !record.id?.id,
        variant: 'ghost',
        size: 'icon',
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<OAuth2ClientInfo>({
  api: getOAuth2Clients,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
});

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: OAuth2ClientInfo) {
  const clientId = record.id?.id;
  if (!clientId) return;

  formModalApi.setData({ clientId }).open();
}

function onSuccess() {
  return reload();
}

function handleNavigateList(value: string | undefined) {
  if (value !== 'OAuth2DomainList' || !hasAccessByRoles([Authority.SYS_ADMIN]))
    return;
  return router.push({ name: value });
}

async function handleDelete(record: OAuth2ClientInfo) {
  const clientId = record.id?.id;
  if (!clientId) return;

  await confirm({
    title: $t('oauth2.actions.deleteClient'),
    content: $t('oauth2.messages.delete.clientConfirm', { name: record.title }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteOAuth2Client(clientId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onSuccess" />
    <BasicTable
      :title-icon="
        hasAccessByRoles([Authority.SYS_ADMIN]) ? undefined : $route.meta.icon
      "
      class="h-full"
      :title="$t('oauth2.sections.clients')"
      @register="registerTable"
    >
      <template #tableTitle>
        <VbenSegmented
          v-if="hasAccessByRoles([Authority.SYS_ADMIN])"
          variant="navigation"
          :tabs="[
            {
              icon: $router.resolve({ name: 'OAuth2ClientList' }).meta.icon,
              label: $t('oauth2.sections.clients'),
              value: 'OAuth2ClientList',
            },
            {
              icon: $router.resolve({ name: 'OAuth2DomainList' }).meta.icon,
              label: $t('oauth2.sections.domains'),
              value: 'OAuth2DomainList',
            },
          ]"
          model-value="OAuth2ClientList"
          @update:model-value="handleNavigateList"
        />
        <span v-else>
          {{ $t('oauth2.sections.clients') }}
        </span>
      </template>

      <template #query>
        <Input
          v-model:value="searchInfo.searchText"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('tb.common.searchPlaceholder')"
          class="w-full sm:max-w-80"
        >
          <template #prefix>
            <IconifyIcon
              icon="ant-design:search-outlined"
              class="text-muted-foreground"
            />
          </template>
        </Input>
      </template>

      <template #toolbar>
        <VbenButton
          v-access:role="[Authority.SYS_ADMIN, Authority.TENANT_ADMIN]"
          type="button"
          @click="handleCreate"
        >
          <IconifyIcon
            icon="ant-design:plus-outlined"
            class="mr-2 size-4"
            aria-hidden="true"
          />
          {{ $t('oauth2.actions.addClient') }}
        </VbenButton>
      </template>
    </BasicTable>
  </Page>
</template>
