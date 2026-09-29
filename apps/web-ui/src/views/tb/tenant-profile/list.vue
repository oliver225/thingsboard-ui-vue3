<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TenantProfile } from '#/api/tb/tenant-profile';

import { computed, reactive, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal, VbenIconButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteTenantProfile,
  deleteTenantProfiles,
  getTenantProfileById,
  getTenantProfiles,
  saveTenantProfile,
  setDefaultTenantProfile,
} from '#/api/tb/tenant-profile';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import TenantProfileForm from './form.vue';

defineOptions({ name: 'TenantProfileList' });

const { hasAccessByRoles } = useAccess();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: TenantProfileForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<TenantProfile>[]>(() => [
  {
    title: $t('tenant-profile.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 200,
    sorter: true,
    slot: 'name',
  },
  {
    title: $t('tenant-profile.fields.description'),
    dataIndex: 'description',
    key: 'description',
    width: 200,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('tenant-profile.fields.isolatedTbRuleEngine'),
    dataIndex: 'isolatedTbRuleEngine',
    key: 'isolatedTbRuleEngine',
    width: 140,
    slot: 'isolatedTbRuleEngine',
  },
  {
    title: $t('tenant-profile.fields.default'),
    dataIndex: 'default',
    key: 'default',
    width: 100,
    slot: 'tenantProfileDefault',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    customRender: ({ value }) =>
      value === null || value === undefined || value === ''
        ? '—'
        : formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<TenantProfile> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('tenant-profile.actions.export'),
        tooltip: $t('tenant-profile.actions.export'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleExport(record),
      },
      {
        key: 'setDefault',
        icon: 'lucide:flag',
        text: $t('tenant-profile.actions.setDefault'),
        tooltip: $t('tenant-profile.actions.setDefault'),
        auth: Authority.SYS_ADMIN,
        disabled: !!record.default,
        onClick: () => handleSetDefault(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('tenant-profile.actions.edit'),
        tooltip: $t('tenant-profile.actions.edit'),
        auth: Authority.SYS_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('tenant-profile.actions.delete'),
        tooltip: $t('tenant-profile.actions.delete'),
        auth: Authority.SYS_ADMIN,
        disabled: !!record.default,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<TenantProfile>({
  api: getTenantProfiles,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('tenant-profile.menu'),
    enabled: () => hasAccessByRoles([Authority.SYS_ADMIN]),
    canSelect: (record) => !!record.id?.id && !record.default,
    deleteApi: deleteTenantProfiles,
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

function handleEdit(record: TenantProfile) {
  if (!record.id?.id) return;
  formModalApi.setData({ tenantProfileId: record.id?.id }).open();
}

/** 从 JSON 文件导入租户配置 */
async function handleImport() {
  let data: unknown;
  try {
    data = await importJsonFile<TenantProfile>();
  } catch {
    message.error($t('tenant-profile.features.import.parseError'));
    return;
  }
  if (!isImportedTenantProfileValid(data)) {
    message.error($t('tenant-profile.features.import.invalidFile'));
    return;
  }
  await saveTenantProfile(prepareEntityImport(data));
  message.success($t('tenant-profile.features.import.success'));
  reload();
}

/** 导出租户配置为 JSON 文件 */
async function handleExport(record: TenantProfile) {
  if (!record.id?.id) {
    return;
  }
  const tenantProfile = await getTenantProfileById(record.id.id);
  const exportData = prepareEntityExport(tenantProfile);
  // 导出的配置不再标记为默认
  exportData.default = false;
  exportJsonFile(exportData, tenantProfile.name);
}

async function handleDelete(record: TenantProfile) {
  const tenantProfileId = record.id?.id;
  if (!tenantProfileId) return;

  await confirm({
    title: $t('tenant-profile.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('tenant-profile.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteTenantProfile(tenantProfileId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleSetDefault(record: TenantProfile) {
  if (!record.id?.id || record.default) return;
  await confirm({
    content: $t('tenant-profile.features.setDefault.content'),
    icon: 'warning',
    title: $t('tenant-profile.features.setDefault.title', {
      name: record.name,
    }),
  });
  await setDefaultTenantProfile(record.id.id);
  message.success($t('tenant-profile.features.setDefault.success'));
  await reload();
}

function handleSaved() {
  return reload();
}

/** 校验导入文件是否为合法的租户配置 */
function isImportedTenantProfileValid(data: any): data is TenantProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    data.name !== undefined &&
    data.profileData !== undefined &&
    data.isolatedTbRuleEngine !== undefined
  );
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.tenantProfile')"
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
          {{ $t('tenant-profile.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.SYS_ADMIN]"
          :tooltip="$t('tenant-profile.actions.import')"
          :aria-label="$t('tenant-profile.actions.import')"
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
      <template #isolatedTbRuleEngine="{ record }">
        <TbCheckbox
          :checked="!!record.isolatedTbRuleEngine"
          disabled
          :aria-label="$t('tenant-profile.fields.isolatedTbRuleEngine')"
        />
      </template>
      <template #name="{ record }">
        <RouterLink
          :to="{
            name: 'TenantProfileDetail',
            params: { tenantProfileId: record.id.id },
          }"
          class="text-primary hover:underline"
        >
          {{ record.name }}
        </RouterLink>
      </template>
      <template #tenantProfileDefault="{ record }">
        <TbCheckbox
          :checked="!!record.default"
          disabled
          :aria-label="$t('tenant-profile.fields.default')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
