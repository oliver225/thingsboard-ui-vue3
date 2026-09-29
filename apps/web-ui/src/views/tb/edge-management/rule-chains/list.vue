<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { RuleChain } from '#/api/tb/rule-chain';
import type { PageLink } from '#/types/tb';

import { computed, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteRuleChain,
  deleteRuleChains,
  getAutoAssignToEdgeRuleChains,
  getRuleChains,
  setAutoAssignToEdgeRuleChain,
  setEdgeTemplateRootRuleChain,
  unsetAutoAssignToEdgeRuleChain,
} from '#/api/tb/rule-chain';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import EdgeNavigation from '../navigation.vue';
import RuleChainForm from './form.vue';

defineOptions({ name: 'EdgeRuleChainList' });

const { hasAccessByRoles } = useAccess();

const autoAssignToEdgeRuleChainIds = ref(new Set<string>());

const updatingIds = ref(new Set<string>());

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RuleChainForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<RuleChain>[]>(() => [
  {
    title: $t('edge-management.features.ruleChains.fields.name'),
    dataIndex: 'name',
    key: 'name',
    width: 200,
    sorter: true,
    customRender: ({ value }) => (value === '' ? '—' : (value ?? '—')),
  },
  {
    title: $t('edge-management.features.ruleChains.fields.description'),
    dataIndex: ['additionalInfo', 'description'],
    key: 'description',
    width: 260,
    customRender: ({ value }) => value || '—',
  },
  {
    title: $t('edge-management.features.ruleChains.fields.root'),
    dataIndex: 'root',
    key: 'root',
    width: 180,
    sorter: true,
    slot: 'root',
  },
  {
    key: 'autoAssignToEdge',
    title: $t('edge-management.features.ruleChains.fields.autoAssign'),
    width: 150,
    slot: 'autoAssignToEdge',
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

const actionColumn: ActionColumn<RuleChain> = {
  align: 'center',
  width: 180,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'setRoot',
        icon: 'lucide:flag',
        text: $t('edge-management.features.ruleChains.actions.setRoot'),
        tooltip: $t('edge-management.features.ruleChains.actions.setRoot'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.root || updatingIds.value.has(record.id?.id ?? ''),
        onClick: () => handleSetRoot(record),
      },
      {
        key: 'autoAssign',
        icon: isAutoAssignToEdge(record)
          ? 'lucide:circle-minus'
          : 'lucide:circle-plus',
        text: isAutoAssignToEdge(record)
          ? $t('edge-management.features.ruleChains.actions.unsetAutoAssign')
          : $t('edge-management.features.ruleChains.actions.setAutoAssign'),
        tooltip: isAutoAssignToEdge(record)
          ? $t('edge-management.features.ruleChains.actions.unsetAutoAssign')
          : $t('edge-management.features.ruleChains.actions.setAutoAssign'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.root || updatingIds.value.has(record.id?.id ?? ''),
        onClick: () => handleToggleAutoAssign(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('edge-management.features.ruleChains.actions.edit'),
        tooltip: $t('edge-management.features.ruleChains.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('edge-management.features.ruleChains.actions.delete'),
        tooltip: $t('edge-management.features.ruleChains.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.root,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload, clearSelectedRowKeys }] = useTable<RuleChain>({
  api: fetchEdgeRuleChains,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('edge-management.features.ruleChains.title'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id && !record.root,
    deleteApi: deleteRuleChains,
  },
  tableSetting: { redo: true, setting: true, size: true },
});

watch(() => searchInfo.searchText, handleSearch);

async function fetchEdgeRuleChains(pageLink: PageLink) {
  const [ruleChains, autoAssignRuleChains] = await Promise.all([
    getRuleChains(pageLink, 'EDGE'),
    getAutoAssignToEdgeRuleChains(),
  ]);
  autoAssignToEdgeRuleChainIds.value = new Set(
    autoAssignRuleChains.flatMap((ruleChain) =>
      ruleChain.id?.id ? [ruleChain.id.id] : [],
    ),
  );
  return ruleChains;
}

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: RuleChain) {
  if (!record.id?.id) return;
  formModalApi.setData({ ruleChainId: record.id?.id }).open();
}

async function handleDelete(record: RuleChain) {
  const ruleChainId = record.id?.id;
  if (!ruleChainId || record.root) return;

  await confirm({
    title: $t('edge-management.features.ruleChains.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('edge-management.features.ruleChains.title'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteRuleChain(ruleChainId);
        message.success($t('tb.common.messages.delete.success'));
        await reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleToggleAutoAssign(record: RuleChain) {
  const ruleChainId = record.id?.id;
  if (!ruleChainId || record.root || updatingIds.value.has(ruleChainId)) return;
  const isAssigned = isAutoAssignToEdge(record);
  await confirm({
    title: isAssigned
      ? $t('edge-management.features.ruleChains.actions.unsetAutoAssign')
      : $t('edge-management.features.ruleChains.actions.setAutoAssign'),
    content: isAssigned
      ? $t('edge-management.features.ruleChains.autoAssign.unsetConfirm', {
          name: record.name,
        })
      : $t('edge-management.features.ruleChains.autoAssign.setConfirm', {
          name: record.name,
        }),
  });
  updatingIds.value.add(ruleChainId);
  try {
    await (isAssigned
      ? unsetAutoAssignToEdgeRuleChain(ruleChainId)
      : setAutoAssignToEdgeRuleChain(ruleChainId));
    message.success($t('tb.common.saveSuccess'));
    await reload();
  } finally {
    updatingIds.value.delete(ruleChainId);
  }
}

async function handleSetRoot(record: RuleChain) {
  const ruleChainId = record.id?.id;
  if (!ruleChainId || record.root || updatingIds.value.has(ruleChainId)) return;
  await confirm({
    content: $t('edge-management.features.ruleChains.setRoot.content'),
    icon: 'warning',
    title: $t('edge-management.features.ruleChains.setRoot.title', {
      name: record.name,
    }),
  });
  updatingIds.value.add(ruleChainId);
  try {
    await setEdgeTemplateRootRuleChain(ruleChainId);
    clearSelectedRowKeys();
    message.success($t('edge-management.features.ruleChains.setRoot.success'));
    await reload();
  } finally {
    updatingIds.value.delete(ruleChainId);
  }
}

function handleSaved() {
  return reload();
}

function isAutoAssignToEdge(record: RuleChain) {
  return (
    !!record.root ||
    !!(record.id?.id && autoAssignToEdgeRuleChainIds.value.has(record.id.id))
  );
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable class="h-full" @register="registerTable">
      <template #tableTitle><EdgeNavigation /></template>
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
          {{ $t('edge-management.features.ruleChains.actions.create') }}
        </Button>
      </template>
      <template #root="{ record }">
        <TbCheckbox
          :checked="!!record.root"
          disabled
          :aria-label="$t('edge-management.features.ruleChains.fields.root')"
        />
      </template>
      <template #autoAssignToEdge="{ record }">
        <TbCheckbox
          :checked="!!isAutoAssignToEdge(record)"
          disabled
          :aria-label="
            $t('edge-management.features.ruleChains.fields.autoAssign')
          "
        />
      </template>
    </BasicTable>
  </Page>
</template>
