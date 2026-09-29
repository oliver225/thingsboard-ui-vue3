<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { TbUserInfo } from '#/api/core/user';
import type { Device, DeviceInfo } from '#/api/tb/device';
import type { PageLink } from '#/types/tb';

import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal, VbenIconButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Badge } from '@vben-core/shadcn-ui';

import { Button, Input, message } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteDevice,
  deleteDevices,
  getCustomerDeviceInfos,
  getTenantDeviceInfos,
  makeDevicePublic,
  unassignDeviceFromCustomer,
} from '#/api/tb/device';
import { getDeviceProfileInfos } from '#/api/tb/device-profile';
import { NULL_UUID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

import AssignCustomer from './assign-customer.vue';
import CheckConnectivity from './check-connectivity.vue';
import DeviceForm from './form.vue';
import DeviceImport from './import.vue';

defineOptions({ name: 'DeviceList' });

const { hasAccessByRoles } = useAccess();

const userStore = useUserStore();

const profileFilters = ref<{ text: string; value: string }[]>([]);

const customerId =
  (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '';

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});

const [ConnectivityModal, connectivityModalApi] = useVbenModal({
  connectedComponent: CheckConnectivity,
  destroyOnClose: true,
});

const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: AssignCustomer,
  destroyOnClose: true,
});

const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: DeviceImport,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<DeviceInfo>[]>(() => [
  {
    title: $t('device.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 180,
    sorter: true,
    customRender: ({ record, value }) =>
      h(
        RouterLink,
        {
          to: { name: 'DeviceDetail', params: { deviceId: record?.id?.id } },
        },
        () => value || '—',
      ),
  },
  {
    title: $t('device.fields.label'),
    dataIndex: 'label',
    key: 'label',
    width: 120,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('device.fields.deviceProfile'),
    dataIndex: 'deviceProfileName',
    key: 'deviceProfileId',
    width: 140,
    filters: profileFilters.value,
    filterMultiple: false,
    filterSearch: true,
  },

  {
    title: $t('device.fields.customer'),
    dataIndex: 'customerTitle',
    key: 'customerTitle',
    width: 140,
    auth: Authority.TENANT_ADMIN,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('device.fields.active'),
    dataIndex: 'active',
    key: 'active',
    width: 80,
    filters: [
      { text: $t('device.fields.activeTrue'), value: 'true' },
      { text: $t('device.fields.activeFalse'), value: 'false' },
    ],
    filterMultiple: false,
    customRender: ({ value }) =>
      h(Badge, { variant: value ? 'success' : 'warning' }, () =>
        value
          ? $t('device.fields.activeTrue')
          : $t('device.fields.activeFalse'),
      ),
  },
  {
    title: $t('device.fields.isGateway'),
    dataIndex: ['additionalInfo', 'gateway'],
    key: 'gateway',
    width: 80,
    slot: 'gateway',
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

const actionColumn: ActionColumn<DeviceInfo> = {
  align: 'center',
  width: 220,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    align: 'center',
    actions: [
      {
        key: 'assign',
        icon: 'lucide:user-plus',
        text: $t('device.actions.assign'),
        tooltip: $t('device.actions.assign'),
        auth: Authority.TENANT_ADMIN,
        ifShow: !record.customerId?.id || record.customerId.id === NULL_UUID,
        onClick: () => handleAssign(record),
      },
      {
        key: 'unassign',
        icon: 'lucide:user-minus',
        text: $t('device.actions.unassign'),
        tooltip: $t('device.actions.unassign'),
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
        text: $t('device.actions.makePublic'),
        tooltip: $t('device.actions.makePublic'),
        auth: Authority.TENANT_ADMIN,
        ifShow: !record.customerId?.id || record.customerId.id === NULL_UUID,
        onClick: () => handleMakePublic(record),
      },
      {
        key: 'makePrivate',
        icon: 'lucide:lock-keyhole',
        text: $t('device.actions.makePrivate'),
        tooltip: $t('device.actions.makePrivate'),
        auth: Authority.TENANT_ADMIN,
        ifShow:
          !!record.customerId?.id &&
          record.customerId.id !== NULL_UUID &&
          !!record.customerIsPublic,
        onClick: () => handleMakePrivate(record),
      },
      {
        key: 'manageCredentials',
        icon: 'lucide:key-round',
        text: $t('device.features.credentials.manage'),
        tooltip: $t('device.features.credentials.manage'),
        auth: Authority.TENANT_ADMIN,
        onClick: () =>
          formModalApi
            .setData({ deviceId: record.id?.id, mode: 'credentials' })
            .open(),
      },
      {
        key: 'viewCredentials',
        icon: 'lucide:key-round',
        text: $t('device.features.credentials.view'),
        tooltip: $t('device.features.credentials.view'),
        auth: Authority.CUSTOMER_USER,
        onClick: () =>
          formModalApi
            .setData({ deviceId: record.id?.id, mode: 'credentials' })
            .open(),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('device.actions.edit'),
        tooltip: $t('device.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('device.actions.delete'),
        tooltip: $t('device.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { selection, reload, setSelectedRowKeys }] =
  useTable<DeviceInfo>({
    api: fetchList,
    searchInfo,
    columns: tableColumns,
    actionColumn,
    rowKey: (record) => record.id?.id ?? '',
    rowSelection: null,
    batch: {
      entityName: () => $t('device.menu'),
      enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
      canSelect: (record) => !!record.id?.id,
      deleteApi: deleteDevices,
      actions: [
        {
          key: 'assign',
          label: () => $t('device.actions.batchAssign'),
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
  const profiles = await loadAllPages(getDeviceProfileInfos);
  profileFilters.value = profiles.map((profile) => ({
    text: profile.name,
    value: profile.id.id,
  }));
});

async function fetchList({
  deviceProfileId,
  active,
  ...pageLink
}: PageLink & { deviceProfileId?: string[]; active?: string[] }) {
  const params = {
    ...pageLink,
    deviceProfileId: deviceProfileId?.[0],
    active: active?.length ? active[0] === 'true' : undefined,
  };
  return hasAccessByRoles([Authority.TENANT_ADMIN])
    ? getTenantDeviceInfos(params)
    : getCustomerDeviceInfos(customerId, params);
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: DeviceInfo) {
  if (!record.id?.id) return;
  formModalApi.setData({ deviceId: record.id?.id }).open();
}

function handleImport() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  importModalApi.open();
}

async function handleDelete(record: DeviceInfo) {
  const deviceId = record.id?.id;
  if (!deviceId) return;

  await confirm({
    title: $t('device.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('device.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteDevice(deviceId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function handleAssign(record: DeviceInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  assignModalApi.setData({ deviceIds: [record.id.id] }).open();
}

function handleBatchAssign(keys: string[]) {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN]) || keys.length === 0) return;
  assignModalApi.setData({ deviceIds: keys }).open();
}

async function handleMakePublic(record: DeviceInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  await confirm({
    title: $t('device.features.makePublic.title'),
    content: $t('device.features.makePublic.content', { name: record.name }),
  });
  await makeDevicePublic(record.id.id);
  message.success($t('device.actions.makePublicSuccess'));
  await reload();
}

async function handleMakePrivate(record: DeviceInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  await confirm({
    title: $t('device.features.makePrivate.title'),
    content: $t('device.features.makePrivate.content', { name: record.name }),
  });
  await unassignDeviceFromCustomer(record.id.id);
  message.success($t('device.actions.makePrivateSuccess'));
  await reload();
}

async function handleUnassign(record: DeviceInfo) {
  if (!record.id?.id || !hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  await confirm({
    title: $t('device.features.unassign.title'),
    content: $t('device.features.unassign.content', {
      name: record.name,
      customer: record.customerTitle,
    }),
  });
  await unassignDeviceFromCustomer(record.id.id);
  message.success($t('device.actions.unassignSuccess'));
  await reload();
}

function handleCreated(device: Device) {
  if (!device.id) return;
  connectivityModalApi
    .setData({ deviceId: device.id.id, afterAdd: true })
    .open();
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
    <FormModal @success="handleSaved" @created="handleCreated" />
    <ConnectivityModal />
    <AssignModal @success="handleAssigned" />
    <ImportModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.device')"
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
          {{ $t('device.actions.create') }}
        </Button>
        <VbenIconButton
          v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
          :tooltip="$t('device.features.import.title')"
          :aria-label="$t('device.features.import.title')"
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
      <template #gateway="{ record }">
        <TbCheckbox
          :checked="!!record.additionalInfo?.gateway"
          disabled
          :aria-label="$t('device.fields.isGateway')"
        />
      </template>
    </BasicTable>
  </Page>
</template>
