<script setup lang="ts">
import type { TableBatch } from '@vben/table';

import type { ActionColumn, BasicColumn } from '#/adapter/table';
import type { AttributeData } from '#/api/tb/telemetry';
import type { EntityId } from '#/types/tb';

import {
  computed,
  onActivated,
  onDeactivated,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue';

import {
  confirm,
  useVbenModal,
  VbenButton,
  VbenIconButton,
  VbenSelect,
} from '@vben/common-ui';
import { IconifyIcon, RotateCw } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Badge } from '@vben-core/shadcn-ui';

import { Input, message } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import {
  deleteEntityAttributes,
  getAttributesByScope,
} from '#/api/tb/telemetry';
import { CopyText } from '#/components/widget';
import { AttributeScope, attributeScopeOptions } from '#/enums';
import { useWs } from '#/hooks/use-ws';
import { $t } from '#/locales';

import {
  formatTelemetryValue,
  getAttributeValueType,
  mergeTelemetry,
} from './utils';
import ValueForm from './value-form.vue';

defineOptions({ name: 'EntityAttributes' });

const props = withDefaults(
  defineProps<{
    entityId: EntityId;
    scopes?: AttributeScope[];
    defaultScope?: AttributeScope;
  }>(),
  {
    scopes: () => [
      AttributeScope.SERVER_SCOPE,
      AttributeScope.SHARED_SCOPE,
      AttributeScope.CLIENT_SCOPE,
    ],
    defaultScope: AttributeScope.SERVER_SCOPE,
  },
);

const scopeOptions = computed(() => {
  return attributeScopeOptions().filter((option) =>
    props.scopes.includes(option.value),
  );
});
const searchInfo = reactive({
  searchText: '',
  scope: props.defaultScope,
});
const httpLoading = ref(false);
const revision = ref(0);
const active = ref(true);
const dataSource = shallowRef<AttributeData[]>([]);

const canEdit = computed(
  () => searchInfo.scope !== AttributeScope.CLIENT_SCOPE,
);
const stream = useWs(() =>
  canEdit.value
    ? undefined
    : {
        type: 'ATTRIBUTES',
        entityType: props.entityId.entityType,
        entityId: props.entityId.id,
        scope: AttributeScope.CLIENT_SCOPE,
      },
);
const loading = computed(() =>
  canEdit.value ? httpLoading.value : stream.loading.value,
);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ValueForm,
  destroyOnClose: true,
});

const visualDatasource = computed(() => {
  const search = searchInfo.searchText.trim().toLocaleLowerCase();
  return dataSource.value.filter(
    (row) =>
      row.key.toLocaleLowerCase().includes(search) ||
      formatTelemetryValue(row.value).toLocaleLowerCase().includes(search),
  );
});

const columns = computed<BasicColumn<AttributeData>[]>(() => [
  {
    title: $t('attribute.fields.key'),
    dataIndex: 'key',
    key: 'key',
    width: 240,
    slot: 'key',
    align: 'center',
    sorter: (a, b) => a.key.localeCompare(b.key),
    defaultSortOrder: 'ascend',
  },
  {
    title: $t('attribute.fields.valueType'),
    key: 'valueType',
    width: 120,
    slot: 'valueType',
  },
  {
    title: $t('attribute.fields.value'),
    dataIndex: 'value',
    key: 'value',
    minWidth: 240,
    slot: 'value',
    align: 'left',
  },
  {
    title: $t('attribute.fields.lastUpdateTs'),
    dataIndex: 'lastUpdateTs',
    key: 'lastUpdateTs',
    width: 190,
    sorter: (a, b) => a.lastUpdateTs - b.lastUpdateTs,
    customRender: ({ value }) => formatDateTime(value),
  },
]);
const actionColumn: ActionColumn<AttributeData> = {
  width: 110,
  actionProps: (record) => ({
    class: '[&_button>span]:sr-only',
    align: 'center',
    actions: [
      {
        key: 'edit',
        text: $t('attribute.actions.edit'),
        tooltip: $t('attribute.actions.edit'),
        icon: 'lucide:square-pen',
        disabled: !canEdit.value,
        onClick: () => handleEdit(record),
      },
      {
        key: 'delete',
        text: $t('tb.common.delete'),
        tooltip: $t('tb.common.delete'),
        icon: 'lucide:trash-2',
        danger: true,
        disabled: !canEdit.value,
        onClick: () => handleDelete(record),
      },
    ],
  }),
};

const batchAction: TableBatch<AttributeData> = {
  entityName: () => $t('attribute.menu'),
  enabled: () => canEdit.value,
  canSelect: () => canEdit.value,
  async deleteApi(keys) {
    if (!canEdit.value) {
      throw new Error($t('attribute.messages.readonly'));
    }
    await deleteEntityAttributes(props.entityId, searchInfo.scope, {
      key: keys,
    });
    reload();
    return { deletedIds: keys, failedIds: [] };
  },
};

const [registerTable, tableMethod] = useTable<AttributeData>({
  rowKey: 'key',
  columns,
  actionColumn,
  batch: batchAction,
  dataSource: visualDatasource,
  loading,
  searchInfo,
  pagination: false,
  rowSelection: null,
  tableSetting: { redo: false, setting: true, size: true },
});

watch(
  [
    () => props.entityId.entityType,
    () => props.entityId.id,
    () => searchInfo.scope,
    revision,
    active,
  ],
  async ([entityType, id, scope, , isActive], _, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    dataSource.value = [];
    searchInfo.searchText = '';
    if (tableMethod.selection.value.count) tableMethod.setSelectedRowKeys([]);
    httpLoading.value = false;
    if (scope === AttributeScope.CLIENT_SCOPE || !isActive) return;
    httpLoading.value = true;
    try {
      const rows = await getAttributesByScope({ entityType, id }, scope);
      if (!cancelled) dataSource.value = rows;
    } catch {
      /* HTTP 错误由统一请求层提示。 */
    } finally {
      if (!cancelled) httpLoading.value = false;
    }
  },
  { immediate: true, flush: 'sync' },
);
watch(
  stream.data,
  (message) => {
    if (canEdit.value) return;
    if (!message) {
      dataSource.value = [];
      if (tableMethod.selection.value.count) tableMethod.setSelectedRowKeys([]);
    } else if ('subscriptionId' in message) {
      dataSource.value = mergeTelemetry(dataSource.value, message.data);
    }
  },
  { flush: 'sync' },
);
onActivated(() => {
  active.value = true;
});
onDeactivated(() => {
  active.value = false;
});

function handleCreate() {
  if (!canEdit.value) {
    return;
  }
  formModalApi.setData({}).open();
}

function handleEdit(record: AttributeData) {
  if (!canEdit.value) {
    return;
  }
  formModalApi.setData({ record }).open();
}
async function handleDelete(record: AttributeData) {
  if (!canEdit.value) {
    return;
  }
  await confirm({
    title: $t('tb.common.delete'),
    content: $t('tb.common.messages.delete.title', {
      entity: $t('attribute.menu'),
      name: record.key,
    }),
    icon: 'error',
    confirmButtonProps: { variant: 'destructive' },
    confirmText: $t('tb.common.delete'),
    async beforeClose({ isConfirm }) {
      if (!isConfirm || !canEdit.value) {
        return true;
      }
      try {
        await deleteEntityAttributes(props.entityId, searchInfo.scope, {
          key: [record.key],
        });
        message.success($t('tb.common.messages.delete.success'));
        reload();
        return true;
      } catch {
        return false;
      }
    },
  });
}

function reload() {
  searchInfo.searchText = '';
  tableMethod?.setSelectedRowKeys([]);
  if (canEdit.value) revision.value++;
  else stream.refresh();
}
</script>

<template>
  <section
    class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground"
  >
    <FormModal
      :entity-id="entityId"
      :scope="searchInfo.scope"
      @success="reload"
    />

    <BasicTable class="h-full min-h-96 flex-1" @register="registerTable">
      <template #query>
        <VbenSelect
          v-model="searchInfo.scope"
          :options="scopeOptions"
          :allow-clear="false"
          :aria-label="$t('attribute.fields.scope')"
          class="w-full sm:w-40"
        />
        <Input
          v-model:value="searchInfo.searchText"
          class="w-full sm:w-72"
          allow-clear
          :aria-label="$t('tb.common.search')"
          :placeholder="$t('attribute.messages.searchPlaceholder')"
        >
          <template #prefix>
            <IconifyIcon
              icon="lucide:search"
              class="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </template>
        </Input>
      </template>
      <template #toolbar>
        <VbenButton v-if="canEdit" @click="handleCreate">
          <IconifyIcon
            icon="lucide:plus"
            class="mr-1 size-4"
            aria-hidden="true"
          />
          {{ $t('attribute.actions.add') }}
        </VbenButton>
        <VbenIconButton
          class="my-0 mr-1 rounded-md"
          :tooltip="$t('tb.common.refresh')"
          tooltip-side="top"
          :aria-label="$t('tb.common.refresh')"
          :disabled="loading"
          @click="reload"
        >
          <RotateCw class="size-4" />
        </VbenIconButton>
      </template>
      <template #key="{ record }">
        <CopyText :text="record.key" />
      </template>
      <template #valueType="{ record }">
        <Badge variant="info" class="font-normal">
          {{
            $t(
              `attribute.options.valueType.${getAttributeValueType(record.value)}`,
            )
          }}
        </Badge>
      </template>
      <template #value="{ record }">
        <CopyText :text="formatTelemetryValue(record.value)" />
      </template>
    </BasicTable>
  </section>
</template>
