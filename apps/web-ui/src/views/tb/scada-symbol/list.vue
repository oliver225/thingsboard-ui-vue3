<script lang="ts" setup>
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  TbResourceDeleteResult,
  TbResourceInfo,
} from '#/api/tb/scada-symbol';
import type { ResourceScope } from '#/enums';

import { reactive } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlob, formatDateTime } from '@vben/utils';

import { Button, Checkbox, Input, message, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteScadaSymbol,
  downloadScadaSymbol,
  getScadaSymbols,
} from '#/api/tb/scada-symbol';
import { DEFAULT_SORT_FIELD, SYS_TENANT_ID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { formatBytes } from '#/utils/file';
import { renderResourceReferences } from '#/utils/resource-references';
// 嵌入弹窗与缩略图与图片库完全一致(均为对资源的公开访问 / 鉴权预览),直接复用
import ImageThumbnail from '#/views/tb/image/components/image-thumbnail.vue';
import EmbedModal from '#/views/tb/image/embed-modal.vue';

import ScadaSymbolForm from './form.vue';

defineOptions({ name: 'ScadaSymbolList' });

const { hasAccessByRoles } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ScadaSymbolForm,
  destroyOnClose: true,
});

const [EmbedModalCom, embedModalApi] = useVbenModal({
  connectedComponent: EmbedModal,
  destroyOnClose: true,
});

const queryParams = reactive({
  includeSystemImages: false,
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  return getScadaSymbols({
    includeSystemImages: queryParams.includeSystemImages,
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    textSearch: queryParams.textSearch,
  });
}

/** 由实体推断作用域(系统级 / 租户级);导出场景 tenantId 可能为空,按系统处理 */
function getScope(info: TbResourceInfo): ResourceScope {
  return !info.tenantId?.id || info.tenantId.id === SYS_TENANT_ID
    ? 'system'
    : 'tenant';
}

/** 系统级符号(NULL_UUID 租户)对租户管理员只读 */
function isSystem(row: TbResourceInfo) {
  return getScope(row) === 'system';
}

const [Grid, gridApi] = useVbenVxeGrid<TbResourceInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'title',
        minWidth: 240,
        slots: { default: 'name' },
        sortable: true,
        title: $t('tb.scadaSymbol.fields.name'),
      },
      {
        align: 'center',
        field: 'resolution',
        slots: { default: 'resolution' },
        title: $t('tb.scadaSymbol.fields.resolution'),
        width: 120,
      },
      {
        align: 'right',
        field: 'size',
        formatter: ({ row }) => formatBytes(row.descriptor?.size),
        title: $t('tb.scadaSymbol.fields.size'),
        width: 110,
      },
      {
        field: 'scope',
        formatter: ({ row }) =>
          isSystem(row)
            ? $t('tb.scadaSymbol.scope.system')
            : $t('tb.scadaSymbol.scope.tenant'),
        title: $t('tb.scadaSymbol.fields.scope'),
        width: 100,
      },
      {
        align: 'center',
        field: 'public',
        slots: { default: 'public' },
        title: $t('tb.scadaSymbol.fields.public'),
        width: 90,
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
        width: 180,
      },
    ],
    rowConfig: { height: 92 },
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
      tooltip: $t('tb.scadaSymbol.actions.download'),
    },
    {
      icon: 'lucide:code',
      onClick: () => onEmbed(row),
      tooltip: $t('tb.scadaSymbol.actions.embed'),
    },
    {
      ifShow: hasAccessByRoles([Authority.SYS_ADMIN]) && isSystem(row),
      icon: 'lucide:square-pen',
      onClick: () => onEdit(row),
      tooltip: $t('tb.scadaSymbol.actions.edit'),
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

function onUpload() {
  formModalApi.setData({}).open();
}

function onEdit(row: TbResourceInfo) {
  formModalApi
    .setData({ resourceKey: row.resourceKey, scope: getScope(row) })
    .open();
}

function onEmbed(row: TbResourceInfo) {
  embedModalApi
    .setData({ resourceKey: row.resourceKey, scope: getScope(row) })
    .open();
}

/** 下载原始 SVG 文件 */
async function onDownload(row: TbResourceInfo) {
  if (!row.resourceKey) {
    return;
  }
  const blob = await downloadScadaSymbol(getScope(row), row.resourceKey);
  downloadFileFromBlob({
    fileName: row.fileName ?? row.title ?? 'scada-symbol.svg',
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
  if (!row.resourceKey) {
    return true;
  }
  try {
    await deleteScadaSymbol(getScope(row), row.resourceKey, force);
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
    content: $t('tb.scadaSymbol.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.scadaSymbol.delete.title', { title: row.title }),
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
    confirmText: $t('tb.scadaSymbol.forceDelete.button'),
    content: renderResourceReferences(result, {
      intro: $t('tb.scadaSymbol.forceDelete.content', { title: row.title }),
      outro: $t('tb.scadaSymbol.forceDelete.footer'),
    }),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.scadaSymbol.forceDelete.title'),
  }).catch(() => {});
}

function onModalSuccess() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onModalSuccess" />
    <EmbedModalCom @success="onModalSuccess" />
    <Grid :table-title="$t('tb.menu.scadaSymbols')">
      <template #toolbar-actions>
        <div class="flex items-center gap-3">
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
          <Checkbox
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            v-model:checked="queryParams.includeSystemImages"
            @change="onSearch"
          >
            {{ $t('tb.scadaSymbol.filter.includeSystemSymbols') }}
          </Checkbox>
        </div>
      </template>
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Button type="primary" @click="onUpload">
            <template #icon>
              <IconifyIcon icon="lucide:upload" />
            </template>
            {{ $t('tb.scadaSymbol.actions.upload') }}
          </Button>
        </div>
      </template>
      <template #name="{ row }">
        <div class="flex items-center gap-3">
          <ImageThumbnail
            class="h-20 w-20 shrink-0 cursor-pointer rounded"
            :refresh-key="row.descriptor?.etag"
            :resource-key="row.resourceKey"
            :preview="false"
            :scope="getScope(row)"
            @click="onEmbed(row)"
          />
          <span class="truncate">{{ row.title }}</span>
        </div>
      </template>
      <template #resolution="{ row }">
        <span v-if="row.descriptor?.width">
          {{ row.descriptor?.width }}×{{ row.descriptor?.height }}
        </span>
        <span v-else>-</span>
      </template>
      <template #public="{ row }">
        <Tag variant="outlined" :color="row.public ? 'success' : 'default'">
          {{ row.public ? $t('tb.common.yes') : $t('tb.common.no') }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
