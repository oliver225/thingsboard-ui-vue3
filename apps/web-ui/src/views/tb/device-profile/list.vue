<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DeviceProfile } from '#/api/tb/device-profile';

import { h, nextTick, reactive, ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Tooltip } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDeviceProfile,
  getDeviceProfileById,
  getDeviceProfiles,
  saveDeviceProfile,
  setDefaultDeviceProfile,
} from '#/api/tb/device-profile';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
  prepareEntityImport,
} from '#/utils/import-export';

import DeviceProfileForm from './form.vue';

defineOptions({ name: 'DeviceProfileList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceProfileForm,
  destroyOnClose: true,
});

const queryParams = reactive({
  textSearch: '',
});
const selectedItems = ref<DeviceProfile[]>([]);

async function fetch({ page, sort }: any) {
  return getDeviceProfiles({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<DeviceProfile>({
  gridEvents: {
    checkboxAll: onSelectedChange,
    checkboxChange: onSelectedChange,
  },
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'name',
        align: 'left',
        minWidth: 180,
        sortable: true,
        title: $t('tb.deviceProfile.fields.name'),
      },
      {
        field: 'transportType',
        title: $t('tb.deviceProfile.fields.transportType'),
        width: 130,
      },
      {
        field: 'description',
        minWidth: 200,
        title: $t('tb.deviceProfile.fields.description'),
      },
      {
        field: 'default',
        formatter: ({ cellValue }) =>
          cellValue ? $t('tb.common.yes') : $t('tb.common.no'),
        title: $t('tb.deviceProfile.fields.default'),
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
        fixed: 'right',
        cellRender: { name: 'CellAction', props: { actions: getActionItems } },
        title: $t('tb.common.actions'),
        width: 150,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<DeviceProfile>,
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

function getActionItems(row: DeviceProfile): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onExport(row),
      tooltip: $t('tb.deviceProfile.actions.export'),
    },
    {
      icon: 'lucide:flag',
      ifShow: !row.default,
      onClick: () => confirmSetDefault(row),
      tooltip: $t('tb.deviceProfile.actions.setDefault'),
    },
    {
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      ifShow: !row.default,
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onEdit(row: DeviceProfile) {
  formModalApi.setData({ deviceProfileId: row.id?.id }).open();
}

/** 导出设备配置为 JSON 文件 */
async function onExport(row: DeviceProfile) {
  if (!row.id?.id) {
    return;
  }
  const deviceProfile = await getDeviceProfileById(row.id.id);
  const exportData = prepareEntityExport(deviceProfile);
  // 导出的配置不再标记为默认
  exportData.default = false;
  exportJsonFile(exportData, deviceProfile.name);
}

/** 校验导入文件是否为合法的设备配置 */
function validateImported(data: any): data is DeviceProfile {
  return (
    data !== null &&
    typeof data === 'object' &&
    data.name !== undefined &&
    data.profileData !== undefined
  );
}

/** 从 JSON 文件导入设备配置 */
async function onImport() {
  let data: unknown;
  try {
    data = await importJsonFile<DeviceProfile>();
  } catch {
    message.error($t('tb.deviceProfile.import.parseError'));
    return;
  }
  if (!validateImported(data)) {
    message.error($t('tb.deviceProfile.import.invalidFile'));
    return;
  }
  await saveDeviceProfile(prepareEntityImport(data));
  message.success($t('tb.deviceProfile.import.success'));
  gridApi.query();
}

async function deleteByRow(row: DeviceProfile) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await deleteDeviceProfile(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    clearSelectedItems();
    gridApi.query();
  } catch {
    return false;
  }
}

async function deleteSelectedItems() {
  const rows = selectedItems.value.filter(
    (item) => item.id?.id && !item.default,
  );
  if (rows.length === 0) {
    return false;
  }

  try {
    await Promise.all(
      rows.map((item) => deleteDeviceProfile(item.id?.id ?? '')),
    );
    message.success($t('tb.common.deleteSuccess'));
    clearSelectedItems();
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: DeviceProfile) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: renderDeleteContent(row.name),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.deviceProfile.delete.title'),
  }).catch(() => {});
}

function confirmBatchDelete() {
  const rows = selectedItems.value.filter((item) => !item.default);
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteSelectedItems();
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.deviceProfile.delete.batchContent', {
      count: rows.length,
    }),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.deviceProfile.delete.batchTitle'),
  }).catch(() => {});
}

async function setDefaultByRow(row: DeviceProfile) {
  if (!row.id?.id) {
    return false;
  }

  try {
    await setDefaultDeviceProfile(row.id.id);
    message.success($t('tb.deviceProfile.setDefault.success'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmSetDefault(row: DeviceProfile) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return setDefaultByRow(row);
    },
    content: renderSetDefaultContent(row.name),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.deviceProfile.setDefault.title'),
  }).catch(() => {});
}

function renderDeleteContent(name: string) {
  return () =>
    h('div', { class: 'space-y-2 text-sm leading-6' }, [
      h('div', { class: 'flex gap-1.5' }, [
        h(
          'span',
          { class: 'shrink-0 text-muted-foreground' },
          `${$t('tb.deviceProfile.delete.profileName')}:`,
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
        $t('tb.deviceProfile.delete.content'),
      ),
    ]);
}

function renderSetDefaultContent(name: string) {
  return () =>
    h('div', { class: 'space-y-2 text-sm leading-6' }, [
      h('div', { class: 'flex gap-1.5' }, [
        h(
          'span',
          { class: 'shrink-0 text-muted-foreground' },
          `${$t('tb.deviceProfile.delete.profileName')}:`,
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
        $t('tb.deviceProfile.setDefault.content'),
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
    <Grid :table-title="$t('tb.menu.deviceProfile')">
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
        <div class="flex items-center gap-2">
          <Button
            v-if="selectedItems.some((item) => !item.default)"
            danger
            @click="confirmBatchDelete"
          >
            <template #icon>
              <IconifyIcon icon="lucide:trash-2" />
            </template>
            {{ $t('tb.deviceProfile.actions.batchDelete') }}
          </Button>
          <Button type="primary" @click="onCreate">
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
            {{ $t('tb.deviceProfile.actions.create') }}
          </Button>
          <Tooltip :title="$t('tb.deviceProfile.actions.import')">
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
