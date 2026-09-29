<script lang="ts" setup>
import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type {
  AlarmRuleDefinition,
  AlarmRuleDefinitionInfo,
} from '#/api/tb/alarm-rule';
import type { EntityId } from '#/types/tb';

import { computed, onMounted, reactive, ref, watch } from 'vue';
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

import { VbenTableAction } from '@vben-core/shadcn-ui';

import { Button, Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteAlarmRule,
  deleteAlarmRules,
  getAlarmRuleById,
  getAlarmRuleNames,
  getAlarmRules,
  getAlarmRulesByEntityId,
} from '#/api/tb/alarm-rule';
import DebugSettingsButton from '#/components/widget/debug-settings-button.vue';
import { Authority, entityTypeLabel } from '#/enums';
import { $t } from '#/locales';
import { saveDebugSettings } from '#/utils/debug-settings';
import {
  exportJsonFile,
  importJsonFile,
  prepareEntityExport,
} from '#/utils/import-export';
import { loadAllPages } from '#/utils/page-data';

import { entityTypeOptions } from './form-data';
import AlarmRuleForm from './form.vue';

defineOptions({ name: 'AlarmRuleList' });
const props = defineProps<{ entityId?: EntityId }>();

const { hasAccessByRoles } = useAccess();

const router = useRouter();

const alarmTypes = ref<string[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AlarmRuleForm,
  destroyOnClose: true,
});

const searchInfo = reactive({
  searchText: '',
});

const tableColumns = computed<BasicColumn<AlarmRuleDefinitionInfo>[]>(() => [
  {
    title: $t('alarm-rule.fields.alarmType'),
    dataIndex: 'name',
    key: 'name',
    width: 180,
    sorter: true,
    filters: alarmTypes.value.map((value) => ({ value, text: value })),
    filterMultiple: false,
    filterSearch: true,
    slot: 'name',
  },
  {
    key: 'entityType',
    ifShow: !props.entityId,
    filters: entityTypeOptions().map(({ value, label }) => ({
      value,
      text: label,
    })),
    filterMultiple: false,
    customRender: ({ record }) => entityTypeLabel(record.entityId?.entityType),
    title: $t('alarm-rule.fields.entityType'),
    width: 130,
  },
  {
    title: $t('alarm-rule.fields.entityName'),
    dataIndex: 'entityName',
    key: 'entityName',
    ifShow: !props.entityId,
    width: 180,
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

const actionColumn: ActionColumn<AlarmRuleDefinitionInfo> = {
  align: 'center',
  width: 260,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    actions: [
      {
        key: 'copy',
        icon: 'lucide:copy-plus',
        text: $t('alarm-rule.actions.copy'),
        tooltip: $t('alarm-rule.actions.copy'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleCopy(record),
      },
      {
        key: 'export',
        icon: 'lucide:download',
        text: $t('alarm-rule.actions.export'),
        tooltip: $t('alarm-rule.actions.export'),
        auth: Authority.TENANT_ADMIN,
        onClick: () => handleExport(record),
      },
      {
        key: 'events',
        icon: 'lucide:scroll-text',
        text: $t('detail-page.tabs.events'),
        tooltip: $t('detail-page.tabs.events'),
        auth: Authority.TENANT_ADMIN,
        onClick: () =>
          router.push({
            name: 'AlarmRuleDetail',
            params: { alarmRuleId: record.id?.id },
            query: { tab: 'events' },
          }),
      },
      {
        key: 'edit',
        icon: 'lucide:square-pen',
        text: $t('alarm-rule.actions.edit'),
        tooltip: $t('alarm-rule.actions.edit'),
        auth: Authority.TENANT_ADMIN,
        class: 'text-primary hover:text-primary',
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        icon: 'lucide:trash-2',
        text: $t('alarm-rule.actions.delete'),
        tooltip: $t('alarm-rule.actions.delete'),
        auth: Authority.TENANT_ADMIN,
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const [registerTable, { reload }] = useTable<AlarmRuleDefinitionInfo>({
  api: (params) =>
    props.entityId
      ? getAlarmRulesByEntityId(props.entityId, params)
      : getAlarmRules(params),
  searchInfo,
  columns: tableColumns,
  actionColumn,
  rowKey: (record) => record.id?.id ?? '',
  rowSelection: null,
  batch: {
    entityName: () => $t('alarm-rule.menu'),
    enabled: () => hasAccessByRoles([Authority.TENANT_ADMIN]),
    canSelect: (record) => !!record.id?.id,
    deleteApi: deleteAlarmRules,
  },
  tableSetting: { redo: true, setting: true, size: true },
  filterFn: (filters) => ({
    searchText: filters.name?.[0],
    entityType: filters.entityType?.[0],
  }),
});

onMounted(loadAlarmTypes);

watch(() => searchInfo.searchText, handleSearch);
watch(
  [() => props.entityId?.id, () => props.entityId?.entityType],
  handleSearch,
);

function handleSearch() {
  return reload({ page: 1 });
}

function handleCreate() {
  formModalApi.setData({}).open();
}

function handleEdit(record: AlarmRuleDefinitionInfo) {
  if (record.id?.id)
    formModalApi
      .setData({ alarmRuleId: record.id.id, entityName: record.entityName })
      .open();
}

function handleNavigateList(value: string | undefined) {
  if (!value) return;
  return router.push({ name: value });
}

async function handleImport() {
  try {
    const value = await importJsonFile<AlarmRuleDefinition>();
    if (
      !value?.name ||
      value.configuration?.type !== 'ALARM' ||
      !value.configuration.arguments ||
      !value.configuration.createRules
    )
      throw new Error($t('alarm-rule.validation.import'));
    formModalApi
      .setData({
        value: { ...prepareEntityExport(value), entityId: undefined },
      })
      .open();
  } catch {
    message.error($t('alarm-rule.validation.import'));
  }
}

async function handleExport(record: AlarmRuleDefinitionInfo) {
  if (!record.id?.id) return;
  const value = await getAlarmRuleById(record.id.id);
  exportJsonFile(
    { ...prepareEntityExport(value), entityId: undefined },
    value.name,
  );
}

async function handleCopy(record: AlarmRuleDefinitionInfo) {
  if (!record.id?.id) return;
  const value = prepareEntityExport(await getAlarmRuleById(record.id.id));
  formModalApi
    .setData({
      value: {
        ...value,
        entityId: undefined,
        name: $t('alarm-rule.messages.copyName', { name: value.name }),
      },
    })
    .open();
}

async function handleDelete(record: AlarmRuleDefinitionInfo) {
  const alarmRuleId = record.id?.id;
  if (!alarmRuleId) return;

  await confirm({
    title: $t('alarm-rule.actions.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('alarm-rule.menu'),
      name: record.name,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return true;
      try {
        await deleteAlarmRule(alarmRuleId);
        message.success($t('tb.common.messages.delete.success'));
        await handleSaved();
        return true;
      } catch {
        return false;
      }
    },
  });
}

async function handleSaved() {
  await Promise.all([reload(), loadAlarmTypes()]);
}

async function loadAlarmTypes() {
  if (props.entityId) return;
  alarmTypes.value = await loadAllPages(getAlarmRuleNames);
}
</script>

<template>
  <component
    :is="entityId ? 'section' : Page"
    :auto-content-height="!entityId"
    :class="
      entityId &&
      'flex min-h-96 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card'
    "
  >
    <FormModal :entity-id="entityId" @success="handleSaved" />
    <BasicTable class="h-full" @register="registerTable">
      <template v-if="!entityId" #tableTitle>
        <VbenSegmented
          variant="navigation"
          :tabs="[
            {
              icon: $router.resolve({ name: 'AlarmList' }).meta.icon,
              label: $t('tb.menu.alarmList'),
              value: 'AlarmList',
            },
            {
              icon: $router.resolve({ name: 'AlarmRule' }).meta.icon,
              label: $t('tb.menu.alarmRule'),
              value: 'AlarmRule',
            },
          ]"
          model-value="AlarmRule"
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
          {{ $t('alarm-rule.actions.create') }}
        </Button>
        <VbenIconButton
          v-access:role="[Authority.TENANT_ADMIN]"
          :tooltip="$t('alarm-rule.actions.import')"
          :aria-label="$t('alarm-rule.actions.import')"
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
      <template #name="{ record }">
        <RouterLink
          :to="{
            name: 'AlarmRuleDetail',
            params: { alarmRuleId: record.id.id },
          }"
          class="text-primary hover:underline"
        >
          {{ record.name }}
        </RouterLink>
      </template>
      <template #tableActions="{ record, actionProps }">
        <div class="flex items-center justify-center gap-1">
          <DebugSettingsButton
            icon-only
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            :model-value="record.debugSettings"
            :entity-label="$t('alarm-rule.menu')"
            @update:model-value="saveDebugSettings(record, $event, 'alarmRule')"
          />
          <VbenTableAction v-bind="actionProps" />
        </div>
      </template>
    </BasicTable>
  </component>
</template>
