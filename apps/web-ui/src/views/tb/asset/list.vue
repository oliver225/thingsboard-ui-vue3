<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbUserInfo } from '#/api/core/user';
import type { AssetInfo } from '#/api/tb/asset';
import type { PageLink } from '#/types/tb';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal, VbenIconButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteAsset,
  deleteAssets,
  getAssetProfileInfos,
  getCustomerAssetInfos,
  getTenantAssetInfos,
  makeAssetPublic,
  unassignAssetFromCustomer,
} from '#/api/tb/asset';
import { NULL_UUID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

import AssignCustomer from './assign-customer.vue';
import AssetForm from './form.vue';
import AssetImport from './import.vue';

defineOptions({ name: 'AssetList' });

const { hasAccessByRoles } = useAccess();

const userStore = useUserStore();

const profileFilters = ref<{ text: string; value: string }[]>([]);

const customerId =
  (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '';

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AssetForm,
  destroyOnClose: true,
});

const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: AssignCustomer,
  destroyOnClose: true,
});

const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: AssetImport,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<AssetInfo>[]>(() => [
  {
    title: $t('asset.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 180,
    sorter: true,
    customRender: ({ record, value }) =>
      h(
        RouterLink,
        { to: { name: 'AssetDetail', params: { assetId: record.id?.id } } },
        () => value || '—',
      ),
  },
  {
    title: $t('asset.fields.label'),
    dataIndex: 'label',
    key: 'label',
    width: 120,
  },
  {
    title: $t('asset.fields.assetProfile'),
    dataIndex: 'assetProfileName',
    key: 'assetProfileId',
    width: 140,
    filters: profileFilters.value,
    filterMultiple: false,
    filterSearch: true,
  },

  {
    title: $t('asset.fields.customer'),
    dataIndex: 'customerTitle',
    key: 'customerTitle',
    width: 140,
    ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]),
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

const actionColumn: ActionColumn<AssetInfo> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    align: 'center',
    actions: [
      {
        key: 'assign',
        icon: 'lucide:user-plus',
        text: $t('asset.actions.assign'),
        tooltip: $t('asset.actions.assign'),
        auth: Authority.TENANT_ADMIN,
        ifShow: !record.customerId?.id || record.customerId.id === NULL_UUID,
        onClick: () => handleAssign(record),
      },
      {
        key: 'unassign',
        icon: 'lucide:user-minus',
        text: $t('asset.actions.unassign'),
        tooltip: $t('asset.actions.unassign'),
        auth: Authority.TENANT_ADMIN,
        ifShow:
          !!record.customerId?.id &&
          record.customerId.id !== NULL_UUID &&
          !record.customerIsPublic,
        onClick: () => handleUnassign(record),
      },
      {
        key: 'makePublic',
        icon: 'lucide:globe',
        text: $t('asset.actions.makePublic'),
        tooltip: $t('asset.actions.makePublic'),
        auth: Authority.TENANT_ADMIN,
        ifShow: !record.customerId?.id || record.customerId.id === NULL_UUID,
        onClick: () => handleMakePublic(record),
      },
      {
        key: 'makePrivate',
        icon: 'lucide:lock-keyhole',
        text: $t('asset.actions.makePrivate'),
        tooltip: $t('asset.actions.makePrivate'),
        auth: Authority.TENANT_ADMIN,
        ifShow:
          !!record.customerId?.id &&
          record.customerId.id !== NULL_UUID &&
          !!record.customerIsPublic,
        onClick: () => handleMakePrivate(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('asset.actions.edit'),
        tooltip: $t('asset.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('asset.actions.delete'),
        tooltip: $t('asset.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { selection, reload, setSelectedRowKeys }] =
  useTable<AssetInfo>({
    api: fetchList,
    searchInfo,
    columns: tableColumns,
    actionColumn: computed(() =>
      hasAccessByRoles([Authority.TENANT_ADMIN]) ? actionColumn : null,
    ),
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('asset.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id,
      deleteApi: deleteAssets,
      actions: [
        {
          key: 'assign',
          label: () => $t('asset.actions.batchAssign'),
          icon: 'lucide:user-plus',
          onClick: ({ keys }) => handleBatchAssign(keys.map(String)),
        },
      ],
    },
    tableSetting: { redo: true, setting: true, size: true },
  });

const selectedRowKeys = computed(() => selection.value.keys.map(String));

watch(() => searchInfo.searchText, handleSearch);

onMounted(async () => {
  const profiles = await loadAllPages(getAssetProfileInfos);
  profileFilters.value = profiles.map((profile) => ({
    text: profile.name,
    value: profile.id.id,
  }));
});

async function fetchList({
  assetProfileId,
  ...pageLink
}: PageLink & { assetProfileId?: string[] }) {
  const params = { assetProfileId: assetProfileId?.[0] };
  return hasAccessByRoles([Authority.TENANT_ADMIN])
    ? getTenantAssetInfos(pageLink, params)
    : getCustomerAssetInfos(customerId, pageLink, params);
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: AssetInfo) {
  if (!record.id?.id) return;
  formModalApi.setData({ assetId: record.id?.id }).open();
}

function handleImport() {
  importModalApi.open();
}

async function handleDelete(record: AssetInfo) {
  const assetId = record.id?.id;
  if (!assetId) return;

  await confirm({
    title: $t('asset.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('asset.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteAsset(assetId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleAssign(record: AssetInfo) {
  if (!record.id?.id) return;
  assignModalApi.setData({ assetIds: [record.id.id] }).open();
}

function handleBatchAssign(keys: string[]) {
  if (keys.length === 0) return;
  assignModalApi.setData({ assetIds: keys }).open();
}

async function handleMakePublic(record: AssetInfo) {
  if (!record.id?.id) return;
  await confirm({
    title: $t('asset.features.makePublic.title'),
    content: $t('asset.features.makePublic.content', { name: record.name }),
  });
  await makeAssetPublic(record.id.id);
  message.success($t('asset.actions.makePublicSuccess'));
  await reload();
}

async function handleMakePrivate(record: AssetInfo) {
  if (!record.id?.id) return;
  await confirm({
    title: $t('asset.features.makePrivate.title'),
    content: $t('asset.features.makePrivate.content', { name: record.name }),
  });
  await unassignAssetFromCustomer(record.id.id);
  message.success($t('asset.actions.makePrivateSuccess'));
  await reload();
}

async function handleUnassign(record: AssetInfo) {
  if (!record.id?.id) return;
  await confirm({
    title: $t('asset.features.unassign.title'),
    content: $t('asset.features.unassign.content', {
      name: record.name,
      customer: record.customerTitle,
    }),
  });
  await unassignAssetFromCustomer(record.id.id);
  message.success($t('asset.actions.unassignSuccess'));
  await reload();
}

async function handleSaved() {
  await reload();
}

async function handleAssigned(assignedIds: string[]) {
  const remainingIds = selectedRowKeys.value.filter(
    (id) => !assignedIds.includes(id),
  );
  await reload();
  setSelectedRowKeys(remainingIds);
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <AssignModal @success="handleAssigned" />
    <ImportModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.asset')"
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
          {{ $t('asset.actions.create') }}
        </Button>
        <VbenIconButton
          v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
          :tooltip="$t('asset.features.import.title')"
          :aria-label="$t('asset.features.import.title')"
          tooltip-side="top"
          class="rounded-md border border-border"
          @click="handleImport"
        >
          <IconifyIcon
            icon="lucide:file-up"
            class="size-4"
            aria-hidden="true"
          />
        </VbenIconButton>
      </template>
    </BasicTable>
  </Page>
</template>
