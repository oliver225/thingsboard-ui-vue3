<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { RuleChain } from '#/api/tb/rule-chain';

import { computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

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
  getRuleChains,
  setRootRuleChain,
} from '#/api/tb/rule-chain';
import { Authority } from '#/enums';
import { $t } from '#/locales';

import RuleChainForm from './form.vue';

defineOptions({ name: 'RuleChainList' });

const { hasAccessByRoles } = useAccess();
const router = useRouter();

const searchInfo = reactive({
  searchText: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RuleChainForm,
  destroyOnClose: true,
});

const tableColumns = computed<BasicColumn<RuleChain>[]>(() => [
  {
    title: $t('rule-chain.fields.name'),
    dataIndex: 'name',
    key: 'name',
    slot: 'name',
    width: 200,
    sorter: true,
  },
  {
    title: $t('rule-chain.fields.description'),
    dataIndex: ['additionalInfo', 'description'],
    key: 'description',
    width: 260,
  },
  {
    title: $t('rule-chain.fields.root'),
    dataIndex: 'root',
    key: 'root',
    width: 100,
    sorter: true,
    slot: 'root',
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

const actionColumn: ActionColumn<RuleChain> = {
  align: 'center',
  width: 140,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'setRoot',
        icon: 'lucide:flag',
        text: $t('rule-chain.actions.setRoot'),
        tooltip: $t('rule-chain.actions.setRoot'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.root,
        onClick: () => handleSetRoot(record),
      },
      {
        key: 'edit',
        class: 'text-primary hover:text-primary',
        icon: 'lucide:square-pen',
        text: $t('rule-chain.actions.edit'),
        tooltip: $t('rule-chain.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('rule-chain.actions.delete'),
        tooltip: $t('rule-chain.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        disabled: !!record.root,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<RuleChain>({
  api: getRuleChains,
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('rule-chain.menu'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id && !record.root,
    deleteApi: deleteRuleChains,
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

function handleEdit(record: RuleChain) {
  if (!record.id?.id) return;
  formModalApi.setData({ ruleChainId: record.id?.id }).open();
}

async function handleDelete(record: RuleChain) {
  const ruleChainId = record.id?.id;
  if (!ruleChainId) return;

  await confirm({
    title: $t('rule-chain.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('rule-chain.menu'),
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

async function handleSetRoot(record: RuleChain) {
  if (!record.id?.id || record.root) return;
  await confirm({
    content: $t('rule-chain.features.setRoot.content'),
    icon: 'warning',
    title: $t('rule-chain.features.setRoot.title', { name: record.name }),
  });
  await setRootRuleChain(record.id.id);
  message.success($t('rule-chain.features.setRoot.success'));
  await reload();
}

function handleSaved(ruleChain: RuleChain, created: boolean) {
  if (created && ruleChain.id?.id) {
    return router.push({
      name: 'RuleChainEditor',
      params: { ruleChainId: ruleChain.id.id },
    });
  }
  return reload();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleSaved" />
    <BasicTable
      :title-icon="$route.meta.icon"
      class="h-full"
      @register="registerTable"
      :title="$t('tb.menu.ruleChain')"
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
          {{ $t('rule-chain.actions.create') }}
        </Button>
      </template>
      <template #root="{ record }">
        <TbCheckbox
          :checked="!!record.root"
          disabled
          :aria-label="$t('rule-chain.fields.root')"
        />
      </template>
      <template #name="{ record }">
        <Button
          type="link"
          class="!h-auto !p-0"
          @click="
            router.push({
              name: 'RuleChainEditor',
              params: { ruleChainId: record.id.id },
            })
          "
        >
          {{ record.name }}
        </Button>
      </template>
    </BasicTable>
  </Page>
</template>
