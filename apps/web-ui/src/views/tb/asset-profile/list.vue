<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { AssetProfile } from '#/api/tb/asset-profile';

import { computed, reactive, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import {
  confirm,
  Page,
  useVbenModal,
  VbenIconButton,
  VbenSegmented,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteAssetProfile,
  deleteAssetProfiles,
  getAssetProfileById,
  getAssetProfiles,
  saveAssetProfile,
  setDefaultAssetProfile,
} from '#/api/tb/asset-profile';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import AssetProfileForm from './form.vue';

defineOptions({ name: 'AssetProfileList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。
const router = useRouter();

const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AssetProfileForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<AssetProfile>[]>(() => [
  {
    title: $t('asset-profile.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 220,
    sorter: true,
    slot: 'assetProfileName',
  },
  {
    title: $t('asset-profile.fields.description'),
    dataIndex: 'description',
    key: 'description',
    width: 280,
  },
  {
    title: $t('asset-profile.fields.default'),
    dataIndex: 'default',
    key: 'default',
    width: 100,
    align: 'center',
    slot: 'assetProfileDefault',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) => formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<AssetProfile> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('asset-profile.actions.export'),
        tooltip: $t('asset-profile.actions.export'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleExport(record),
      },
      {
        key: 'setDefault',
        icon: 'lucide:flag',
        text: $t('asset-profile.actions.setDefault'),
        tooltip: $t('asset-profile.actions.setDefault'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.default,
        onClick: () => handleSetDefault(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('asset-profile.actions.edit'),
        tooltip: $t('asset-profile.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('asset-profile.actions.delete'),
        tooltip: $t('asset-profile.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.default,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload, clearSelectedRowKeys }] =
  useTable<AssetProfile>({
    api: getAssetProfiles,
    searchInfo,
    columns: tableColumns,
    actionColumn,
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('asset-profile.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id && !record.default,
      deleteApi: deleteAssetProfiles,
    },
    tableSetting: { redo: true, setting: true, size: true },
  });

watch(() => searchInfo.searchText, handleSearch);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: AssetProfile) {
  const assetProfileId = record.id?.id;
  if (!assetProfileId) return;

  formModalApi.setData({ assetProfileId }).open();
}

function handleNavigateList(value: string | undefined) {
  if (!value) return;
  return router.push({ name: value });
}

/** 从 JSON 文件导入资产配置 */
async function handleImport() {
  let data: unknown;
  try {
    data = await importJsonFile<AssetProfile>();
  } catch {
    message.error($t('asset-profile.features.import.parseError'));
    return;
  }
  if (!isImportedDataValid(data)) {
    message.error($t('asset-profile.features.import.invalidFile'));
    return;
  }
  await saveAssetProfile(prepareEntityImport(data));
  message.success($t('asset-profile.features.import.success'));
  await reload();
}

/** 导出资产配置为 JSON 文件 */
async function handleExport(record: AssetProfile) {
  const assetProfileId = record.id?.id;
  if (!assetProfileId) return;

  const assetProfile = await getAssetProfileById(assetProfileId);
  const exportData = prepareEntityExport(assetProfile);
  // 导出的配置不再标记为默认
  exportData.default = false;
  exportJsonFile(exportData, assetProfile.name);
}

async function handleDelete(record: AssetProfile) {
  const assetProfileId = record.id?.id;
  if (!assetProfileId || record.default) return;

  await confirm({
    title: $t('asset-profile.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('asset-profile.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteAssetProfile(assetProfileId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleSetDefault(record: AssetProfile) {
  const assetProfileId = record.id?.id;
  if (!assetProfileId || record.default) return;
  await confirm({
    content: $t('asset-profile.features.setDefault.content'),
    icon: 'warning',
    title: $t('asset-profile.features.setDefault.title', { name: record.name }),
  });
  await setDefaultAssetProfile(assetProfileId);
  message.success($t('asset-profile.features.setDefault.success'));
  clearSelectedRowKeys();
  await reload();
}

function handleSaved() {
  return reload();
}

/** 校验导入文件是否为合法的资产配置 */
function isImportedDataValid(data: unknown): data is AssetProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'name' in data &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    data.name.trim().length <= 255
  );
}
</script>

<template>
  <Page auto-content-height class="asset-profile-page">
    <FormModal @success="handleSaved" />
    <BasicTable
      class="h-full"
      :title="$t('tb.menu.assetProfile')"
      @register="registerTable"
    >
      <template #tableTitle>
        <VbenSegmented
          variant="navigation"
          :tabs="[
            {
              icon: $router.resolve({ name: 'DeviceProfile' }).meta.icon,
              label: $t('tb.menu.deviceProfile'),
              value: 'DeviceProfile',
            },
            {
              icon: $router.resolve({ name: 'AssetProfile' }).meta.icon,
              label: $t('tb.menu.assetProfile'),
              value: 'AssetProfile',
            },
          ]"
          model-value="AssetProfile"
          @update:model-value="handleNavigateList"
        />
      </template>
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
          {{ $t('asset-profile.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.TENANT_ADMIN]"
          :tooltip="$t('asset-profile.actions.import')"
          :aria-label="$t('asset-profile.actions.import')"
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
      <template #assetProfileName="{ record }">
        <RouterLink
          :to="{
            name: 'AssetProfileDetail',
            params: { assetProfileId: record.id?.id },
          }"
          class="text-primary hover:underline"
        >
          {{ record.name }}
        </RouterLink>
      </template>
      <template #assetProfileDefault="{ record }">
        <TbCheckbox
          :checked="!!record.default"
          disabled
          :aria-label="$t('asset-profile.fields.default')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
