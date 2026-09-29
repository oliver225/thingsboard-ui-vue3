<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { OAuth2DomainInfo } from '#/api/tb/oauth2';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

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

import TbSwitch from '#/adapter/component/tb-switch.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteOAuth2Domain,
  getOAuth2Domain,
  getOAuth2Domains,
  saveOAuth2Domain,
} from '#/api/tb/oauth2';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import OAuth2DomainForm from './domain-form.vue';

defineOptions({ name: 'OAuth2DomainList' });

// 页面状态与表单弹窗。
const router = useRouter();
const searchInfo = reactive({ searchText: '' });
const savingDomainIds = ref(new Set<string>());

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: OAuth2DomainForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<OAuth2DomainInfo>[]>(() => [
  {
    dataIndex: 'name',
    title: $t('oauth2.fields.domainName'),
    width: 220,
    sorter: true,
  },
  {
    dataIndex: 'oauth2ClientInfos',
    title: $t('oauth2.sections.clients'),
    width: 260,
    customRender: ({ record }) =>
      (record.oauth2ClientInfos ?? [])
        .map((client) => (typeof client === 'string' ? client : client.title))
        .join(', ') || '—',
  },
  {
    dataIndex: 'oauth2Enabled',
    title: $t('oauth2.fields.enabled'),
    width: 170,
    slot: 'oauth2Enabled',
  },
  {
    dataIndex: 'propagateToEdge',
    title: $t('oauth2.fields.propagateToEdge'),
    width: 170,
    slot: 'propagateToEdge',
  },
  {
    dataIndex: 'createdTime',
    title: $t('tb.common.createdTime'),
    width: 180,
    sorter: true,
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<OAuth2DomainInfo> = {
  align: 'center',
  width: 240,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('oauth2.actions.editDomain'),
        tooltip: $t('oauth2.actions.editDomain'),
        auth: Authority.SYS_ADMIN,
        disabled: savingDomainIds.value.has(record.id?.id ?? ''),
        variant: 'ghost',
        size: 'icon',
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('oauth2.actions.deleteDomain'),
        tooltip: $t('oauth2.actions.deleteDomain'),
        auth: Authority.SYS_ADMIN,
        disabled: savingDomainIds.value.has(record.id?.id ?? ''),
        variant: 'ghost',
        size: 'icon',
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<OAuth2DomainInfo>({
  api: getOAuth2Domains,
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

function handleEdit(record: OAuth2DomainInfo) {
  const domainId = record.id?.id;
  if (!domainId) return;

  formModalApi.setData({ domainId }).open();
}

function onSuccess() {
  return reload();
}

function handleNavigateList(value: string | undefined) {
  if (value !== 'OAuth2ClientList') return;
  return router.push({ name: value });
}

async function handleDelete(record: OAuth2DomainInfo) {
  const domainId = record.id?.id;
  if (!domainId) return;

  await confirm({
    title: $t('oauth2.actions.deleteDomain'),
    content: $t('oauth2.messages.delete.domainConfirm', { name: record.name }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteOAuth2Domain(domainId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleToggleDomainSetting(
  record: OAuth2DomainInfo,
  field: 'oauth2Enabled' | 'propagateToEdge',
) {
  const domainId = record.id?.id;
  if (!domainId || savingDomainIds.value.has(domainId)) return;

  savingDomainIds.value.add(domainId);
  try {
    const { oauth2ClientInfos: _clients, ...domain } =
      await getOAuth2Domain(domainId);
    await saveOAuth2Domain({ ...domain, [field]: !record[field] });
    await reload();
  } finally {
    savingDomainIds.value.delete(domainId);
  }
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onSuccess" />
    <BasicTable
      class="h-full"
      :title="$t('oauth2.sections.domains')"
      @register="registerTable"
    >
      <template #tableTitle>
        <VbenSegmented
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
          model-value="OAuth2DomainList"
          @update:model-value="handleNavigateList"
        />
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
          v-access:role="[Authority.SYS_ADMIN]"
          type="button"
          @click="handleCreate"
        >
          <IconifyIcon
            icon="ant-design:plus-outlined"
            class="mr-2 size-4"
            aria-hidden="true"
          />
          {{ $t('oauth2.actions.addDomain') }}
        </VbenButton>
      </template>

      <template #oauth2Enabled="{ record }">
        <TbSwitch
          v-access:role="[Authority.SYS_ADMIN]"
          :checked="record.oauth2Enabled"
          :loading="savingDomainIds.has(record.id?.id ?? '')"
          :aria-label="$t('oauth2.fields.enabled')"
          @change="handleToggleDomainSetting(record, 'oauth2Enabled')"
        />
      </template>

      <template #propagateToEdge="{ record }">
        <TbSwitch
          v-access:role="[Authority.SYS_ADMIN]"
          :checked="record.propagateToEdge"
          :loading="savingDomainIds.has(record.id?.id ?? '')"
          :aria-label="$t('oauth2.fields.propagateToEdge')"
          @change="handleToggleDomainSetting(record, 'propagateToEdge')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
