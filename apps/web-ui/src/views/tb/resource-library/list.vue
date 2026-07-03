<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TbResourceDeleteResult, TbResourceInfo } from '#/api/tb/resource';
import type { ResourceType } from '#/enums';

import { reactive } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Input, message, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteResource,
  downloadResource,
  getResources,
} from '#/api/tb/resource';
import { DEFAULT_SORT_FIELD, SYS_TENANT_ID } from '#/constants';
import { Authority, resourceTypeLabel, resourceTypeOptions } from '#/enums';
import { $t } from '#/locales';
import { renderResourceReferences } from '#/utils/resource-references';

import ResourceForm from './form.vue';

defineOptions({ name: 'ResourceLibraryList' });

const { hasAccessByRoles } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ResourceForm,
  destroyOnClose: true,
});

const queryParams = reactive<{
  resourceType: ResourceType | undefined;
  textSearch: string;
}>({
  resourceType: undefined,
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getResources({
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    resourceType: queryParams.resourceType,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

/** 系统级资源(NULL_UUID 租户)对租户管理员只读 */
function isSystem(row: TbResourceInfo) {
  return !row.tenantId?.id || row.tenantId.id === SYS_TENANT_ID;
}

const [Grid, gridApi] = useVbenVxeGrid<TbResourceInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 220,
        sortable: true,
        title: $t('tb.resourceLibrary.fields.title'),
      },
      {
        field: 'resourceKey',
        minWidth: 160,
        title: $t('tb.resourceLibrary.fields.resourceKey'),
      },
      {
        field: 'resourceType',
        formatter: ({ cellValue }) => resourceTypeLabel(cellValue) || '-',
        sortable: true,
        title: $t('tb.resourceLibrary.fields.resourceType'),
        width: 160,
      },
      {
        field: 'scope',
        formatter: ({ row }) =>
          isSystem(row)
            ? $t('tb.resourceLibrary.scope.system')
            : $t('tb.resourceLibrary.scope.tenant'),
        title: $t('tb.resourceLibrary.fields.scope'),
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
        width: 100,
      },
    ],
    proxyConfig: {
      ajax: {
        query: fetch,
      },
    },
  } as VxeTableGridOptions<TbResourceInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

function getActionItems(row: TbResourceInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:download',
      onClick: () => onDownload(row),
      tooltip: $t('tb.resourceLibrary.actions.download'),
    },
    {
      danger: true,
      ifShow: hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(row),
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function onCreate() {
  formModalApi.setData({}).open();
}

/** 下载原始资源文件 */
async function onDownload(row: TbResourceInfo) {
  if (!row.id?.id) {
    return;
  }
  const blob = await downloadResource(row.id.id);
  downloadFileFromBlob({
    fileName: row.fileName ?? row.title ?? 'resource',
    source: blob,
  });
}

/**
 * 执行删除。返回 true 表示允许关闭确认框(成功 / 已转入强制删除),
 * 返回 false 表示保持确认框打开(意外错误)。
 */
async function deleteByRow(
  row: TbResourceInfo,
  force = false,
): Promise<boolean> {
  if (!row.id?.id) {
    return true;
  }
  try {
    await deleteResource(row.id.id, force);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
    return true;
  } catch (error: any) {
    // RequestClient 出错时抛出的是响应体本身(见 request-client 的 throw error.response.data),
    // 故优先取 error.response.data,回退到 error 本身。
    const result = (error?.response?.data ?? error) as
      | TbResourceDeleteResult
      | undefined;
    // 非强制删除且存在引用:转入强制删除确认
    if (!force && result && result.success === false) {
      showForceDelete(row, result);
      return true;
    }
    return false;
  }
}

function confirmDelete(row: TbResourceInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row, false);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.resourceLibrary.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.resourceLibrary.delete.title', { title: row.title }),
  }).catch(() => {});
}

function showForceDelete(row: TbResourceInfo, result: TbResourceDeleteResult) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row, true);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    confirmText: $t('tb.resourceLibrary.forceDelete.button'),
    content: renderResourceReferences(result, {
      intro: $t('tb.resourceLibrary.forceDelete.content', { title: row.title }),
      outro: $t('tb.resourceLibrary.forceDelete.footer'),
    }),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.resourceLibrary.forceDelete.title'),
  }).catch(() => {});
}

function onFormSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onFormSuccess" />
    <Grid :table-title="$t('tb.menu.resourceLibrary')">
      <template #toolbar-actions>
        <div class="flex items-center gap-3">
          <Select
            v-model:value="queryParams.resourceType"
            class="w-44"
            allow-clear
            :placeholder="$t('tb.resourceLibrary.filter.allTypes')"
            :options="resourceTypeOptions()"
            @change="onSearch"
          />
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
        </div>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Button type="primary" @click="onCreate">
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
            {{ $t('tb.resourceLibrary.actions.add') }}
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
