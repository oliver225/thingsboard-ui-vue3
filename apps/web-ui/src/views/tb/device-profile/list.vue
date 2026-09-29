<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { DeviceProfile } from '#/api/tb/device-profile';

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
  deleteDeviceProfile,
  deleteDeviceProfiles,
  exportDeviceProfile,
  getDeviceProfiles,
  saveDeviceProfile,
  setDefaultDeviceProfile,
} from '#/api/tb/device-profile';
import {
  Authority,
  DeviceProfileType,
  DeviceProvisionType,
  DeviceTransportType,
  deviceTransportTypeOptions,
} from '#/enums';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import DeviceProfileForm from './form.vue';

defineOptions({ name: 'DeviceProfileList' });

const { hasAccessByRoles } = useAccess();

// 页面状态与表单弹窗。
const router = useRouter();

const searchInfo = reactive({ searchText: '' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceProfileForm,
  destroyOnClose: true,
});

// 列定义使用 computed，确保切换语言后表头同步更新。
const tableColumns = computed<BasicColumn<DeviceProfile>[]>(() => [
  {
    title: $t('device-profile.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 220,
    sorter: true,
    slot: 'deviceProfileName',
  },
  {
    title: $t('device-profile.fields.transportType'),
    dataIndex: 'transportType',
    key: 'transportType',
    width: 130,
    customRender: ({ value }) =>
      deviceTransportTypeOptions().find((option) => option.value === value)
        ?.label ??
      value ??
      '—',
  },
  {
    title: $t('device-profile.fields.description'),
    dataIndex: 'description',
    key: 'description',
    width: 280,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('device-profile.fields.default'),
    dataIndex: 'default',
    key: 'default',
    width: 100,
    align: 'center',
    slot: 'deviceProfileDefault',
  },
  {
    title: $t('tb.common.createdTime'),
    dataIndex: 'createdTime',
    key: 'createdTime',
    width: 190,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender: ({ value }) =>
      value === null || value === undefined || value === ''
        ? '—'
        : formatDateTime(value),
  },
]);

const actionColumn: ActionColumn<DeviceProfile> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('device-profile.actions.export'),
        tooltip: $t('device-profile.actions.export'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleExport(record),
      },
      {
        key: 'setDefault',
        icon: 'lucide:flag',
        text: $t('device-profile.actions.setDefault'),
        tooltip: $t('device-profile.actions.setDefault'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.default,
        onClick: () => handleSetDefault(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('device-profile.actions.edit'),
        tooltip: $t('device-profile.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('device-profile.actions.delete'),
        tooltip: $t('device-profile.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.default,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload, clearSelectedRowKeys }] =
  useTable<DeviceProfile>({
    api: getDeviceProfiles,
    searchInfo,
    columns: tableColumns,
    actionColumn,
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('device-profile.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id && !record.default,
      deleteApi: deleteDeviceProfiles,
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

function handleEdit(record: DeviceProfile) {
  const deviceProfileId = record.id?.id;
  if (!deviceProfileId) return;

  formModalApi.setData({ deviceProfileId }).open();
}

function handleNavigateList(value: string | undefined) {
  if (!value) return;
  return router.push({ name: value });
}

/** 从 JSON 文件导入设备配置 */
async function handleImport() {
  let data: unknown;
  try {
    data = await importJsonFile<DeviceProfile>();
  } catch {
    message.error($t('device-profile.features.import.parseError'));
    return;
  }
  if (!isImportedDataValid(data)) {
    message.error($t('device-profile.features.import.invalidFile'));
    return;
  }
  await saveDeviceProfile(prepareEntityImport(data));
  message.success($t('device-profile.features.import.success'));
  await reload();
}

/** 导出设备配置为 JSON 文件 */
async function handleExport(record: DeviceProfile) {
  const deviceProfileId = record.id?.id;
  if (!deviceProfileId) return;

  const deviceProfile = await exportDeviceProfile(deviceProfileId);
  const exportData = prepareEntityExport(deviceProfile);
  // 导出的配置不再标记为默认
  exportData.default = false;
  exportJsonFile(exportData, deviceProfile.name);
}

async function handleDelete(record: DeviceProfile) {
  const deviceProfileId = record.id?.id;
  if (!deviceProfileId || record.default) return;

  await confirm({
    title: $t('device-profile.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('device-profile.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteDeviceProfile(deviceProfileId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleSetDefault(record: DeviceProfile) {
  const deviceProfileId = record.id?.id;
  if (!deviceProfileId || record.default) return;
  await confirm({
    content: $t('device-profile.features.setDefault.content'),
    icon: 'warning',
    title: $t('device-profile.features.setDefault.title', {
      name: record.name,
    }),
  });
  await setDefaultDeviceProfile(deviceProfileId);
  message.success($t('device-profile.features.setDefault.success'));
  clearSelectedRowKeys();
  await reload();
}

function handleSaved() {
  return reload();
}

/** 校验导入文件是否为合法的设备配置 */
function isImportedDataValid(data: unknown): data is DeviceProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'name' in data &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    data.name.trim().length <= 255 &&
    'type' in data &&
    Object.values(DeviceProfileType).includes(data.type as DeviceProfileType) &&
    'provisionType' in data &&
    Object.values(DeviceProvisionType).includes(
      data.provisionType as DeviceProvisionType,
    ) &&
    'transportType' in data &&
    Object.values(DeviceTransportType).includes(
      data.transportType as DeviceTransportType,
    ) &&
    'profileData' in data &&
    data.profileData !== null &&
    typeof data.profileData === 'object' &&
    !Array.isArray(data.profileData)
  );
}
</script>

<template>
  <Page auto-content-height class="device-profile-page">
    <FormModal @success="handleSaved" />
    <BasicTable
      class="h-full"
      :title="$t('tb.menu.deviceProfile')"
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
          model-value="DeviceProfile"
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
          {{ $t('device-profile.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.TENANT_ADMIN]"
          :tooltip="$t('device-profile.actions.import')"
          :aria-label="$t('device-profile.actions.import')"
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
      <template #deviceProfileName="{ record }">
        <RouterLink
          :to="{
            name: 'DeviceProfileDetail',
            params: { deviceProfileId: record.id?.id },
          }"
          class="text-primary hover:underline"
        >
          {{ record.name }}
        </RouterLink>
      </template>
      <template #deviceProfileDefault="{ record }">
        <TbCheckbox
          :checked="!!record.default"
          disabled
          :aria-label="$t('device-profile.fields.default')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
