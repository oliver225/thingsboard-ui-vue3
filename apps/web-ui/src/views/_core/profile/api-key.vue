<script lang="ts" setup>
/**
 * API 密钥(TB 4.x)管理 —— 按 tenant 标准重构:
 * useVbenVxeGrid(列表,VbenTableAction 操作列 + confirm 删除)
 * + useVbenModal(连接 api-key-form 创建/编辑);一次性 token 由表单创建成功后弹出。
 */
import type { ActionItem } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApiKeyInfo } from '#/api/tb/api-key';

import { computed, reactive } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Switch } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteApiKey, enableApiKey, getUserApiKeys } from '#/api/tb/api-key';
import { DEFAULT_SORT_FIELD } from '#/constants';
import { $t } from '#/locales';

import ApiKeyForm from './api-key-form.vue';

defineOptions({ name: 'AccountApiKey' });

const userStore = useUserStore();
const userId = computed(() => userStore.userInfo?.userId ?? '');

const queryParams = reactive({
  textSearch: '',
});

async function fetch({ page, sort }: any) {
  if (!userId.value) {
    return { data: [], totalElements: 0 };
  }
  return getUserApiKeys(userId.value, {
    page: page.currentPage - 1,
    pageSize: page.pageSize,
    sortOrder: sort?.order === 'asc' ? 'ASC' : 'DESC',
    sortProperty: sort?.field ?? DEFAULT_SORT_FIELD,
    ...queryParams,
  });
}

const [Grid, gridApi] = useVbenVxeGrid<ApiKeyInfo>({
  gridOptions: {
    columns: [
      { title: $t('tb.common.seq'), type: 'seq', width: 60 },
      {
        field: 'description',
        minWidth: 160,
        title: $t('tb.apiKey.description'),
      },
      {
        field: 'enabled',
        slots: { default: 'enabled' },
        title: $t('tb.apiKey.enabled'),
        width: 90,
      },
      {
        field: 'expirationTime',
        formatter: ({ cellValue }) =>
          cellValue ? formatDateTime(cellValue) : $t('tb.apiKey.never'),
        title: $t('tb.apiKey.expiration'),
        width: 180,
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
  } as VxeTableGridOptions<ApiKeyInfo>,
});

function onSearch() {
  gridApi.query({ page: { currentPage: 1 } });
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ApiKeyForm,
  destroyOnClose: true,
});

function getActionItems(row: ApiKeyInfo): ActionItem[] {
  return [
    {
      icon: 'lucide:square-pen',
      onClick: () => openEdit(row),
      tooltip: $t('tb.common.edit'),
    },
    {
      danger: true,
      icon: 'lucide:trash-2',
      onClick: () => confirmDelete(row),
      tooltip: $t('tb.common.delete'),
    },
  ];
}

function openCreate() {
  formModalApi.setData({}).open();
}

function openEdit(row: ApiKeyInfo) {
  formModalApi.setData({ apiKey: row }).open();
}

async function toggleEnabled(row: ApiKeyInfo, enabled: boolean) {
  try {
    await enableApiKey(row.id?.id as string, enabled);
    message.success(
      enabled ? $t('tb.apiKey.enableSuccess') : $t('tb.apiKey.disableSuccess'),
    );
  } catch {
    // 失败提示由请求拦截器统一弹出(展示 TB 返回的具体原因)
  } finally {
    gridApi.query();
  }
}

async function deleteByRow(row: ApiKeyInfo) {
  if (!row.id?.id) {
    return false;
  }
  try {
    await deleteApiKey(row.id.id);
    message.success($t('tb.common.deleteSuccess'));
    gridApi.query();
  } catch {
    return false;
  }
}

function confirmDelete(row: ApiKeyInfo) {
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) {
        return;
      }
      return deleteByRow(row);
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.apiKey.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.apiKey.delete.title'),
  }).catch(() => {});
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <FormModal @success="gridApi.query()" />
    <Grid :table-title="$t('tb.apiKey.title')">
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
        <Button type="primary" @click="openCreate">
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          {{ $t('tb.apiKey.create') }}
        </Button>
      </template>
      <template #enabled="{ row }">
        <Switch
          :checked="row.enabled"
          size="small"
          @change="(v: any) => toggleEnabled(row, !!v)"
        />
      </template>
    </Grid>
  </div>
</template>
