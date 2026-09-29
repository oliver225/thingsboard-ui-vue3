<script setup lang="ts">
import type { Edge } from '#/api/tb/edge';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';
import type { EntityId } from '#/types/tb';

import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import {
  confirm,
  useVbenModal,
  VbenIconButton,
  VbenInputPassword,
} from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import { deleteEdge, getEdgeById, syncEdge } from '#/api/tb/edge';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { NULL_UUID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import Form from './form.vue';

defineOptions({ name: 'EdgeDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const recordId = computed(() => String(route.params.edgeId ?? ''));
const record = ref<
  Edge & { customerName?: string; rootRuleChainName?: string }
>();
const activeTab = ref('details');
const loading = ref(false);
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN] },
  { key: 'attributes', auth: [Authority.TENANT_ADMIN] },
  { key: 'telemetry', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarms', auth: [Authority.TENANT_ADMIN] },
  { key: 'events', auth: [Authority.TENANT_ADMIN] },
  { key: 'relations', auth: [Authority.TENANT_ADMIN] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
];

const basicFields = computed(() => [
  {
    label: $t('edge-management.features.instances.fields.name'),
    value: record.value?.name,
  },
  {
    label: $t('edge-management.features.instances.fields.type'),
    value: record.value?.type,
  },
  {
    label: $t('edge-management.features.instances.fields.label'),
    value: record.value?.label,
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(record.value?.createdTime),
  },
  {
    label: $t('edge-management.features.instances.detail.rootRuleChain'),
    value: record.value?.rootRuleChainName,
  },
]);
const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'type',
    icon: 'lucide:layers',
    label: $t('edge-management.features.instances.fields.type'),
    value: record.value?.type,
  },
  {
    key: 'label',
    icon: 'lucide:tag',
    label: $t('edge-management.features.instances.fields.label'),
    value: record.value?.label,
  },
  {
    key: 'customer',
    icon: 'lucide:building-2',
    label: $t('edge-management.features.instances.fields.customer'),
    value: record.value?.customerName,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('edge-management.features.instances.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('edge-management.features.instances.actions.edit'),
      icon: 'lucide:square-pen',
    },

    {
      key: 'sync',
      label: $t('edge-management.features.instances.actions.sync'),
      icon: 'lucide:cloud-download',
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('edge-management.features.instances.actions.delete'),
      icon: 'lucide:trash-2',
      danger: true,
      group: 'delete',
    },
  ],
}));

watch(
  recordId,
  () => {
    record.value = undefined;
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadRecord();
  },
  { immediate: true },
);

async function loadRecord() {
  const id = recordId.value;
  if (!id) return;
  loading.value = true;
  try {
    const info = await getEdgeById(id);
    const [customerName, rootRuleChainName] = await Promise.all([
      getEntityName(info.customerId),
      getEntityName(info.rootRuleChainId),
    ]);
    if (recordId.value !== id) return;
    record.value = { ...info, customerName, rootRuleChainName };
    setBreadcrumbTitle(info.name);
  } catch {
    if (recordId.value === id) record.value = undefined;
  } finally {
    if (recordId.value === id) loading.value = false;
  }
}

async function getEntityName(entityId?: EntityId) {
  if (!entityId?.id || entityId.id === NULL_UUID) return undefined;
  return findEntityDataByQuery({
    entityFilter: { type: 'singleEntity', singleEntity: entityId },
    entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
    pageLink: { page: 0, pageSize: 1 },
  })
    .then(({ data }) => data[0]?.latest.ENTITY_FIELD?.name?.value)
    .catch(() => undefined);
}

function handleBack() {
  return router.push({ name: 'EdgeInstances' });
}

function handleAction(key: string) {
  if (
    !record.value ||
    loading.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  switch (key) {
    case 'copyId': {
      return copyToClipboard(recordId.value, $t('tb.common.copySuccess'));
    }
    case 'edit': {
      return formModalApi.setData({ edgeId: recordId.value }).open();
    }
    case 'sync': {
      return handleSync();
    }
    case 'refresh': {
      return loadRecord();
    }
    case 'delete': {
      return handleDelete();
    }
  }
}

async function handleSync() {
  const current = record.value;
  if (!current?.id) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('edge-management.features.instances.actions.sync'),
      content: $t('edge-management.features.instances.sync.confirm', {
        name: current.name,
      }),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await syncEdge(id);
          message.success(
            $t('edge-management.features.instances.sync.success'),
          );
          return true;
        } catch {
          return false;
        } finally {
          if (recordId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}

async function handleDelete() {
  const current = record.value;
  if (!current?.id) return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('edge-management.features.instances.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('edge-management.features.instances.title'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteEdge(id);
          message.success($t('tb.common.messages.delete.success'));
          if (recordId.value === id)
            await router.replace({ name: 'EdgeInstances' });
          return true;
        } catch {
          return false;
        } finally {
          if (recordId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('edge-management.features.instances.detail.title')"
    :key="recordId"
    v-model:active-tab="activeTab"
    :title="record?.name"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="record?.id"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :state="loading ? 'loading' : record ? 'ready' : 'error'"
    :error-message="$t('edge-management.features.instances.detail.notFound')"
    @action="handleAction"
    @retry="loadRecord"
    @back="handleBack"
  >
    <template #modals><FormModal @success="loadRecord" /></template>
    <template #tab-details>
      <div
        v-if="record"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-2 gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:network"
          :title="$t('edge-management.features.instances.detail.basic')"
          content-class="space-y-5"
        >
          <dl class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div
              v-for="field in basicFields"
              :key="field.label"
              class="space-y-2"
            >
              <dt class="text-sm text-muted-foreground">{{ field.label }}</dt>
              <dd class="break-all text-sm font-medium">
                {{ field.value || '—' }}
              </dd>
            </div>
            <div class="space-y-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('edge-management.features.instances.fields.customer') }}
              </dt>
              <dd class="text-sm font-medium">
                <RouterLink
                  v-if="
                    record.customerId?.id && record.customerId.id !== NULL_UUID
                  "
                  :to="{
                    name: 'CustomerDetail',
                    params: { customerId: record.customerId.id },
                  }"
                  class="break-all text-primary hover:underline"
                >
                  {{
                    record.customerName ||
                    $t(
                      'edge-management.features.instances.detail.nameUnavailable',
                    )
                  }}
                </RouterLink>
                <span v-else>{{
                  $t('edge-management.features.instances.detail.unassigned')
                }}</span>
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{
                  $t('edge-management.features.instances.fields.description')
                }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !record.additionalInfo?.description && 'text-muted-foreground'
                "
              >
                {{
                  record.additionalInfo?.description ||
                  $t('edge-management.features.instances.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <Card
          icon="lucide:key-round"
          :title="$t('edge-management.features.instances.form.credentials')"
          content-class="space-y-4"
        >
          <dl class="space-y-5">
            <div
              v-for="field in ['routingKey', 'secret'] as const"
              :key="field"
              class="space-y-2"
            >
              <dt class="text-sm text-muted-foreground">
                {{ $t(`edge-management.features.instances.fields.${field}`) }}
              </dt>
              <dd class="flex min-w-0 items-center gap-2 text-sm font-medium">
                <VbenInputPassword
                  v-if="field === 'secret' && record.secret"
                  :model-value="record.secret"
                  readonly
                  autocomplete="off"
                  :aria-label="
                    $t('edge-management.features.instances.fields.secret')
                  "
                  class="min-w-0 flex-1"
                />
                <span v-else class="min-w-0 break-all">{{
                  record[field] || '—'
                }}</span>
                <VbenIconButton
                  v-if="record[field]"
                  class="relative size-7 shrink-0 rounded-md"
                  :tooltip="$t('tb.common.copy')"
                  tooltip-side="top"
                  @click="
                    copyToClipboard(record[field], $t('tb.common.copySuccess'))
                  "
                >
                  <IconifyIcon
                    icon="lucide:copy"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{
                    $t(
                      `edge-management.features.instances.actions.${field === 'secret' ? 'copySecret' : 'copyRoutingKey'}`,
                    )
                  }}</span>
                </VbenIconButton>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </template>
  </DetailPage>
</template>
