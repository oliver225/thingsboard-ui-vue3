<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbUserInfo } from '#/api/core/user';
import type { DeviceInfo } from '#/api/tb/device';

import { h, nextTick, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDevice,
  getCustomerDeviceInfos,
  getTenantDeviceInfos,
  makeDevicePublic,
  unassignDeviceFromCustomer,
} from '#/api/tb/device';
import { getDeviceProfileInfos } from '#/api/tb/device-profile';
import { DEFAULT_SORT_FIELD, NULL_UUID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import DeviceAssignModal from './assign-modal.vue';
import DeviceCredentialsModal from './credentials-modal.vue';
import DeviceForm from './form.vue';
import DeviceImportModal from './import-modal.vue';

defineOptions({ name: 'DeviceList' });

const { hasAccessByRoles } = useAccess();
const userStore = useUserStore();

const customerId =
  (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '';

/** 设备配置筛选项 */
const deviceProfileFilters = ref<Array<{ label: string; value: string }>>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});
const [CredentialsModal, credentialsModalApi] = useVbenModal({
  connectedComponent: DeviceCredentialsModal,
  destroyOnClose: true,
});
const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: DeviceAssignModal,
  destroyOnClose: true,
});
const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: DeviceImportModal,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});

const selectedItems = ref<DeviceInfo[]>([]);

async function fetch({ filters, page, sort }: any) {
  const pageLink = {
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: (sort?.order === 'asc' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    active: filters?.find((item: any) => item.field === 'active')?.values?.[0],
    deviceProfileId: filters?.find(
      (item: any) => item.field === 'deviceProfileName',
    )?.values?.[0],
    ...queryParams,
  };

  return hasAccessByRoles([Authority.TENANT_ADMIN])
    ? getTenantDeviceInfos(pageLink)
    : getCustomerDeviceInfos(customerId, pageLink);
}

function buildColumns(): VxeTableGridOptions<DeviceInfo>['columns'] {
  return [
    { title: $t('tb.common.seq'), type: 'seq', width: 60 },
    {
      field: 'name',
      minWidth: 160,
      sortable: true,
      align: 'left',
      title: $t('tb.device.fields.name'),
    },
    {
      field: 'deviceProfileName',
      filterMultiple: false,
      filters: deviceProfileFilters.value,
      minWidth: 130,
      title: $t('tb.device.fields.deviceProfile'),
    },
    { field: 'label', minWidth: 120, title: $t('tb.device.fields.label') },
    {
      field: 'customerTitle',
      minWidth: 130,
      title: $t('tb.device.fields.customer'),
      visible: hasAccessByRoles([Authority.TENANT_ADMIN]),
    },
    {
      field: 'active',
      filterMultiple: false,
      filters: [
        { label: $t('tb.device.fields.activeTrue'), value: true },
        { label: $t('tb.device.fields.activeFalse'), value: false },
      ],
      formatter: ({ cellValue }) =>
        cellValue
          ? $t('tb.device.fields.activeTrue')
          : $t('tb.device.fields.activeFalse'),
      title: $t('tb.device.fields.active'),
      width: 100,
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
      align: 'center',
      cellRender: { name: 'CellAction', props: { actions: getActionItems } },
      fixed: 'right',
      title: $t('tb.common.actions'),
      width: 200,
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid<DeviceInfo>({
  gridEvents: {
    checkboxAll: onSelectedChange,
    checkboxChange: onSelectedChange,
  },
  gridOptions: {
    columns: buildColumns(),
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<DeviceInfo>,
});

/** 加载设备配置作为列头筛选项 */
onMounted(async () => {
  const pageData = await getDeviceProfileInfos({
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC',
    sortProperty: 'name',
  });
  deviceProfileFilters.value = pageData.data.map((item) => ({
    label: item.name,
    value: item.id.id,
  }));
  gridApi.setGridOptions({ columns: buildColumns() });
});

function onSearch() {
  clearSelectedItems();
  gridApi.query({ page: { currentPage: 1 } });
}

async function onSelectedChange() {
  await nextTick();
  selectedItems.value = gridApi.grid.getCheckboxRecords?.() ?? [];
}

function clearSelectedItems() {
  selectedItems.value = [];
  gridApi.grid.clearCheckboxRow?.();
}

function getActionItems(row: DeviceInfo): ActionItem[] {
  /** 是否已分配给(非公共)客户 */
  const assigned = !!row.customerId?.id && row.customerId.id !== NULL_UUID;
  /** 是否公开 */
  const isPublic = !!row.customerIsPublic;
  return [
    {
      icon: 'lucide:key-round',
      onClick: () => onCredentials(row),
      tooltip: $t('tb.device.credentials.action'),
    },
    {
      icon: 'lucide:square-pen',
      ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]),
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      icon: 'lucide:share-2',
      ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]) && !assigned,
      onClick: () => confirmMakePublic(row),
      tooltip: $t('tb.device.actions.makePublic'),
    },
    {
      icon: 'lucide:user-plus',
      ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]) && !assigned,
      onClick: () => onAssign(row),
      tooltip: $t('tb.device.actions.assign'),
    },
    {
      icon: 'lucide:user-minus',
      ifShow:
        hasAccessByRoles([Authority.TENANT_ADMIN]) && assigned && !isPublic,
      onClick: () => confirmUnassign(row),
      tooltip: $t('tb.device.actions.unassign'),
    },
    {
      icon: 'lucide:lock',
      ifShow:
        hasAccessByRoles([Authority.TENANT_ADMIN]) && assigned && isPublic,
      onClick: () => confirmMakePrivate(row),
      tooltip: $t('tb.device.actions.makePrivate'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      ifShow: hasAccessByRoles([Authority.TENANT_ADMIN]),
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCredentials(row: DeviceInfo) {
  credentialsModalApi
    .setData({
      deviceId: row.id?.id,
      readonly: !hasAccessByRoles([Authority.TENANT_ADMIN]),
    })
    .open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: DeviceInfo) {
  formModalApi.setData({ deviceId: row.id?.id }).open();
}

function onAssign(row?: DeviceInfo) {
  assignModalApi
    .setData(row ? { devices: [row] } : { devices: selectedItems.value })
    .open();
}

function onImport() {
  importModalApi.setData({}).open();
}

async function makePublicByRow(row: DeviceInfo) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await makeDevicePublic(row.id.id);
    message.success($t('tb.device.actions.makePublicSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmMakePublic(row: DeviceInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return makePublicByRow(row);
    },
    content: $t('tb.device.makePublic.content', { name: row.name }),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.device.makePublic.title'),
  }).catch(() => {});
}

async function unassignByRow(row: DeviceInfo) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await unassignDeviceFromCustomer(row.id.id);
    message.success($t('tb.device.actions.unassignSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmUnassign(row: DeviceInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return unassignByRow(row);
    },
    content: $t('tb.device.unassign.content', {
      customer: row.customerTitle,
      name: row.name,
    }),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.device.unassign.title'),
  }).catch(() => {});
}

function confirmMakePrivate(row: DeviceInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return unassignByRow(row);
    },
    content: $t('tb.device.makePrivate.content', { name: row.name }),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.device.makePrivate.title'),
  }).catch(() => {});
}

async function deleteDeviceByRow(row: DeviceInfo) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteDevice(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

async function deleteSelectedItems() {
  const rows = selectedItems.value.filter((item) => item.id?.id);
  if (rows.length === 0) {
    return false;
  }
  try {
    await Promise.all(rows.map((item) => deleteDevice(item.id?.id || '')));
    message.success($t('tb.common.deleteSuccess'));
    clearSelectedItems();
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: DeviceInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteDeviceByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: renderDeleteContent(row.name),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.device.delete.title'),
  }).catch(() => {});
}

function confirmBatchDelete() {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteSelectedItems();
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.device.delete.batchContent', {
      count: selectedItems.value.length,
    }),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.device.delete.batchTitle'),
  }).catch(() => {});
}

function renderDeleteContent(name: string) {
  return () =>
    h('div', { class: 'space-y-2 text-sm leading-6' }, [
      h('div', { class: 'flex gap-1.5' }, [
        h(
          'span',
          { class: 'shrink-0 text-muted-foreground' },
          `${$t('tb.device.delete.deviceName')}：`,
        ),
        h(
          'span',
          {
            class: 'min-w-0 flex-1 truncate font-medium text-foreground',
            title: name,
          },
          name || '-',
        ),
      ]),
      h(
        'div',
        { class: 'text-muted-foreground' },
        $t('tb.device.delete.content'),
      ),
    ]);
}

function onFormSuccess() {
  clearSelectedItems();
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <CredentialsModal @success="onFormSuccess" />
    <AssignModal @success="onFormSuccess" />
    <ImportModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.device')">
      <template #toolbar-actions>
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
      </template>
      <template #toolbar-tools>
        <div
          v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
          class="flex items-center gap-2"
        >
          <Button v-if="selectedItems.length > 0" @click="onAssign()">
            <template #icon>
              <IconifyIcon icon="lucide:user-plus" />
            </template>
            {{ $t('tb.device.actions.batchAssign') }}
          </Button>
          <Button
            v-if="selectedItems.length > 0"
            danger
            @click="confirmBatchDelete"
          >
            <template #icon>
              <IconifyIcon icon="lucide:trash-2" />
            </template>
            {{ $t('tb.device.actions.batchDelete') }}
          </Button>
          <Button type="primary" @click="onCreate">
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
            {{ $t('tb.device.actions.create') }}
          </Button>
          <Tooltip
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            :title="$t('tb.device.import.action')"
          >
            <Button shape="circle" @click="onImport">
              <template #icon>
                <IconifyIcon icon="lucide:upload" />
              </template>
            </Button>
          </Tooltip>
        </div>
      </template>
    </Grid>
  </Page>
</template>
