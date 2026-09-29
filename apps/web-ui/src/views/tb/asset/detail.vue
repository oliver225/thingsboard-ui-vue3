<script setup lang="ts">
import type { AssetInfo } from '#/api/tb/asset';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
} from '#/components/detail-page';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import {
  deleteAsset,
  getAssetInfoById,
  makeAssetPublic,
  unassignAssetFromCustomer,
} from '#/api/tb/asset';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { NULL_UUID } from '#/constants';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import AssignCustomer from './assign-customer.vue';
import AssetForm from './form.vue';

defineOptions({ name: 'AssetDetail' });

const route = useRoute();
const router = useRouter();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const { hasAccessByRoles } = useAccess();
const assetId = computed(() => String(route.params.assetId ?? ''));
const asset = ref<AssetInfo>();
const activeTab = ref('details');
const loading = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: AssetForm,
  destroyOnClose: true,
});
const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: AssignCustomer,
  destroyOnClose: true,
});

const assigned = computed(
  () =>
    !!asset.value?.customerId?.id && asset.value.customerId.id !== NULL_UUID,
);
const headerFields = computed(() => [
  {
    key: 'label',
    icon: 'lucide:tag',
    label: $t('asset.fields.label'),
    value: asset.value?.label,
  },
  {
    key: 'assetProfile',
    icon: 'lucide:layers',
    label: $t('asset.fields.assetProfile'),
    value: asset.value?.assetProfileName,
  },
  {
    key: 'customer',
    icon: 'lucide:building-2',
    label: $t('asset.fields.customer'),
    value: assigned.value ? asset.value?.customerTitle : undefined,
  },
]);
const visibilityAction = computed(() => {
  if (!assigned.value) return 'makePublic';
  return asset.value?.customerIsPublic ? 'makePrivate' : 'unassign';
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  {
    key: 'attributes',
    auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER],
  },
  { key: 'telemetry', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'calculatedFields', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarmRules', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarms', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'events', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'relations', auth: [Authority.TENANT_ADMIN, Authority.CUSTOMER_USER] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
];
const basicFields = computed(() => [
  { label: $t('asset.fields.name'), value: asset.value?.name },
  { label: $t('asset.fields.label'), value: asset.value?.label },
  {
    label: $t('asset.fields.assetProfile'),
    value: asset.value?.assetProfileName,
  },
  {
    label: $t('asset.fields.customer'),
    value: assigned.value
      ? asset.value?.customerTitle
      : $t('asset.features.detail.unassigned'),
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(asset.value?.createdTime),
  },
  {
    label: $t('asset.features.detail.visibility'),
    value: asset.value?.customerIsPublic
      ? $t('asset.features.detail.public')
      : $t('asset.features.detail.private'),
  },
]);
const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('asset.features.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('asset.actions.edit'),
      icon: 'lucide:square-pen',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'assign',
      label: $t('asset.actions.assign'),
      icon: 'lucide:user-plus',
      auth: [Authority.TENANT_ADMIN],
      visible: !assigned.value,
      group: 'assignment',
    },
    {
      key: 'visibility',
      label: $t(`asset.actions.${visibilityAction.value}`),
      icon: assigned.value ? 'lucide:user-minus' : 'lucide:globe',
      auth: [Authority.TENANT_ADMIN],
      group: 'assignment',
    },
    {
      key: 'delete',
      label: $t('asset.actions.delete'),
      icon: 'lucide:trash-2',
      auth: [Authority.TENANT_ADMIN],
      danger: true,
      group: 'delete',
    },
  ],
}));

function handleAction(key: string) {
  const handlers: Record<string, () => unknown> = {
    assign: handleAssign,
    copyId: () =>
      copyToClipboard(assetId.value, $t('asset.features.detail.idCopied')),
    delete: handleDelete,
    edit: handleEdit,
    refresh: loadAsset,
    visibility: handleVisibility,
  };
  return handlers[key]?.();
}

watch(
  assetId,
  () => {
    asset.value = undefined;
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadAsset();
  },
  { immediate: true },
);

async function loadAsset() {
  const id = assetId.value;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const info = await getAssetInfoById(id);
    if (assetId.value !== id) return;
    asset.value = info;
    setBreadcrumbTitle(info.name);
  } catch {
    if (assetId.value === id) asset.value = undefined;
  } finally {
    if (assetId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'AssetList' });
}

function handleEdit() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({ assetId: assetId.value }).open();
}

function handleAssign() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  assignModalApi.setData({ assetIds: [assetId.value] }).open();
}

async function handleVisibility() {
  const current = asset.value;
  if (
    !current?.id ||
    !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
    loading.value
  )
    return;
  const action = visibilityAction.value;
  try {
    await confirm({
      title: $t(`asset.features.${action}.title`),
      content: $t(`asset.features.${action}.content`, {
        name: current.name,
        customer: current.customerTitle,
      }),
    });
  } catch {
    return;
  }
  if (assetId.value !== current.id.id) return;
  loading.value = true;
  try {
    await (action === 'makePublic'
      ? makeAssetPublic(current.id.id)
      : unassignAssetFromCustomer(current.id.id));
    message.success($t(`asset.actions.${action}Success`));
    if (assetId.value === current.id.id) await loadAsset();
  } finally {
    if (assetId.value === current.id.id) loading.value = false;
  }
}

async function handleDelete() {
  const current = asset.value;
  if (
    !current?.id ||
    !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
    loading.value
  )
    return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('asset.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('asset.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteAsset(id);
          message.success($t('tb.common.messages.delete.success'));
          if (assetId.value === id) await router.replace({ name: 'AssetList' });
          return true;
        } catch {
          return false;
        } finally {
          if (assetId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('asset.features.detail.title')"
    :key="assetId"
    v-model:active-tab="activeTab"
    :title="asset?.name"
    :tags="headerFields"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :tabs="tabs"
    :entity-id="asset?.id"
    :state="loading ? 'loading' : asset ? 'ready' : 'error'"
    :error-message="$t('asset.features.detail.notFound')"
    @action="handleAction"
    @retry="loadAsset"
    @back="handleBack"
  >
    <template #modals>
      <FormModal @success="loadAsset" />
      <AssignModal @success="loadAsset" />
    </template>
    <template #tab-details>
      <Card
        v-if="asset"
        class="min-h-full flex-1"
        icon="lucide:box"
        :title="$t('asset.features.detail.basic')"
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
          <div class="space-y-2 border-t pt-5 sm:col-span-2">
            <dt class="text-sm text-muted-foreground">
              {{ $t('asset.fields.description') }}
            </dt>
            <dd
              class="whitespace-pre-wrap break-words text-sm leading-7"
              :class="
                !asset.additionalInfo?.description && 'text-muted-foreground'
              "
            >
              {{
                asset.additionalInfo?.description ||
                $t('asset.features.detail.noDescription')
              }}
            </dd>
          </div>
        </dl>
      </Card>
    </template>
  </DetailPage>
</template>
