<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { ResourceInfo } from '#/api';
import type { ActionItem } from '#/components/Table';

import { reactive, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { downloadFileFromBlobPart } from '@vben/utils';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteResourceApi,
  downloadResourceApi,
  getResourceListApi,
} from '#/api';
import {
  Authority,
  EntityType,
  NULL_UUID,
  RESOURCE_TYPE_OPTIONS,
} from '#/constants';

import Detail from './detail.vue';
import Form from './form.vue';

defineOptions({
  name: 'ResourcesLibraryList',
});
const { hasAccessByCodes } = useAccess();

const searchParam = reactive({
  textSearch: '',
  resourceType: undefined,
});

const tableAction = {
  actions: (record: Recordable<any>): ActionItem[] => [
    {
      label: `${$t('page.detail.title')}`,
      tooltip: `${$t('page.detail.title')}`,
      icon: 'ant-design:appstore-outlined',
      onClick: handleDetail.bind(this, { ...record }),
    },
    {
      label: `${$t('下载资源')}`,
      tooltip: `${$t('下载资源')}`,
      icon: 'mdi:download',
      onClick: handleDownload.bind(this, { ...record }),
    },
    {
      label: `${$t('page.remove.title')}`,
      tooltip: `${$t('page.remove.title')}`,
      icon: 'ant-design:delete-outlined',
      color: 'destructive',
      disabled:
        record.tenantId.id === NULL_UUID &&
        hasAccessByCodes([Authority.TENANT_ADMIN]),
      onClick: handleDelete.bind(this, { ...record }),
    },
  ],
};

const tableColumns: VxeGridPropTypes.Columns<ResourceInfo> = [
  { title: '序号', type: 'seq', width: 60 },
  { field: 'title', sortable: true, title: $t('标题') },
  {
    field: 'resourceType',
    title: $t('资源类型'),
    width: 160,
    formatter: ({ cellValue }) =>
      RESOURCE_TYPE_OPTIONS.find((item) => item.value === cellValue)?.label ||
      cellValue,
  },
  {
    title: $t('资源Key'),
    field: 'resourceKey',
    width: 200,
  },
  {
    field: 'tenantId',
    title: $t('系统'),
    cellRender: {
      name: 'CellCheckbox',
      props: {
        convert: (value: EntityId<EntityType.TENANT>) => {
          return value.id === NULL_UUID;
        },
      },
    },
    align: 'center',
    width: 100,
  },
  {
    field: 'createdTime',
    sortable: true,
    width: 160,
    formatter: 'formatDateTime',
    title: $t('tenant.form.createdTime'),
  },
  {
    title: $t('page.action.title'),
    field: 'action',
    align: 'center',
    fixed: 'right',
    cellRender: {
      name: 'CellAction',
      props: tableAction,
    },
    width: 180,
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: tableColumns,
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  },
});

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: Detail,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
});

watch(
  () => [searchParam.textSearch, searchParam.resourceType],
  () => {
    if (gridApi) {
      gridApi.query();
    }
  },
);

async function reload() {
  searchParam.textSearch = '';
  if (gridApi) {
    await gridApi.query();
  }
}

async function fetch({ page, sort }: any) {
  return await getResourceListApi({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortProperty: sort.field,
    sortOrder: sort.order,
    ...searchParam,
  });
}

function handleDetail(record: any | ResourceInfo) {
  detailDrawerApi.setData({ id: record?.id?.id }).open();
}

async function handleSuccess() {
  await reload();
}
function handleForm(record: any | ResourceInfo) {
  formModalApi
    .setState({
      title: `${$t('添加资源')}`,
    })
    .open();
}

function handleDelete(record: any | ResourceInfo) {
  confirm({
    title: `${$t('删除资源')}[${record.title}]`,
    content: `${$t('确认后资源将不可恢复。')}`,
    icon: 'error',
    confirmText: `${$t('page.remove.title')}`,
    beforeClose: async ({ isConfirm }) => {
      if (isConfirm) {
        await deleteResourceApi(record.id.id);
        return true;
      }
      return true;
    },
  }).then(async () => {
    message.success(`${$t('删除资源')}[${record.title}]成功！`);
    await reload();
  });
}

async function handleDownload(record: any | ResourceInfo) {
  const result = await downloadResourceApi(record.id.id);
  downloadFileFromBlobPart({ fileName: record.fileName, source: result });
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-header-title="$t('资源库')">
      <template #toolbar-actions>
        <div class="flex items-center space-x-2">
          <Button
            type="primary"
            class="flex items-center"
            @click="handleForm({})"
          >
            <div class="flex items-center space-x-2">
              <VbenIcon class="size-4" icon="ant-design:plus-outline" />
              <span>
                {{ $t('添加资源') }}
              </span>
            </div>
          </Button>
          <Select v-model:value="searchParam.resourceType" class="w-36">
            <Select.Option :value="undefined">
              {{ $t('全部资源') }}
            </Select.Option>
            <Select.Option
              v-for="item in RESOURCE_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
          <Input
            class="w-80"
            v-model:value="searchParam.textSearch"
            :allow-clear="true"
            :placeholder="$t('page.search.placeholder')"
          >
            <template #suffix>
              <VbenIcon class="size-4" icon="ant-design:search-outlined" />
            </template>
          </Input>
        </div>
      </template>
    </Grid>
    <FormModal @success="handleSuccess" />
    <DetailDrawer @edit="handleForm" @delete="handleDelete" />
  </Page>
</template>
