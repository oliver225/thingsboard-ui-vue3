<script lang="ts" setup>
import type { DeviceInfo } from '#/api/tb/device';
import type { AttributeData } from '#/api/tb/telemetry';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
} from '#/components/detail-page';

import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { Badge } from '@vben-core/shadcn-ui';

import { message } from 'antdv-next';

import {
  deleteDevice,
  getDeviceCredentials,
  getDeviceInfoById,
  makeDevicePublic,
  unassignDeviceFromCustomer,
} from '#/api/tb/device';
import { getAttributesByScope } from '#/api/tb/telemetry';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import { NULL_UUID } from '#/constants';
import {
  AttributeScope,
  Authority,
  DeviceCredentialsType,
  EntityType,
} from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';

import AssignCustomer from './assign-customer.vue';
import CheckConnectivity from './check-connectivity.vue';
import DeviceForm from './form.vue';

defineOptions({ name: 'DeviceDetail' });

const router = useRouter();
const route = useRoute();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const { hasAccessByRoles } = useAccess();
const deviceId = computed(() => String(route.params.deviceId ?? ''));
const device = ref<DeviceInfo>();
const activeTab = ref('details');
const loading = ref(false);
const activity = shallowRef<AttributeData[]>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});
const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: AssignCustomer,
  destroyOnClose: true,
});
const [ConnectivityModal, connectivityModalApi] = useVbenModal({
  connectedComponent: CheckConnectivity,
  destroyOnClose: true,
});

const assigned = computed(
  () =>
    !!device.value?.customerId?.id && device.value.customerId.id !== NULL_UUID,
);
const customerName = computed(() =>
  assigned.value
    ? device.value?.customerTitle || '—'
    : $t('device.features.detail.messages.unassigned'),
);
const headerFields = computed(() =>
  [
    {
      key: 'label',
      icon: 'lucide:tag',
      value: device.value?.label,
    },
    {
      key: 'deviceProfile',
      icon: 'lucide:layers',
      value: device.value?.deviceProfileName,
    },
    {
      key: 'customer',
      icon: 'lucide:building-2',
      value: assigned.value ? device.value?.customerTitle : undefined,
    },
  ].map((field) => ({ ...field, label: $t(`device.fields.${field.key}`) })),
);
const visibilityAction = computed(() => {
  if (!assigned.value) return 'makePublic';
  return device.value?.customerIsPublic ? 'makePrivate' : 'unassign';
});
const statusText = computed(() => {
  if (typeof device.value?.active !== 'boolean') {
    return $t('device.features.detail.messages.unknown');
  }
  return device.value.active
    ? $t('device.fields.activeTrue')
    : $t('device.fields.activeFalse');
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
  { label: $t('device.fields.name'), value: device.value?.name },
  { label: $t('device.fields.label'), value: device.value?.label },
  {
    label: $t('device.fields.deviceProfile'),
    value: device.value?.deviceProfileName,
  },
  { label: $t('device.fields.customer'), value: customerName.value },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(device.value?.createdTime),
  },
  {
    label: $t('device.features.detail.fields.visibility'),
    value: device.value?.customerIsPublic
      ? $t('device.features.detail.messages.public')
      : $t('device.features.detail.messages.private'),
  },
]);
const activityFields = computed(() =>
  ['lastActivityTime', 'lastConnectTime', 'lastDisconnectTime'].map((key) => {
    const raw = activity.value?.find((item) => item.key === key)?.value;
    const timestamp =
      typeof raw === 'number' || typeof raw === 'string'
        ? Number(raw)
        : Number.NaN;
    return {
      key,
      value:
        Number.isFinite(timestamp) && timestamp > 0
          ? formatDateTime(timestamp)
          : $t('device.features.detail.messages.notReported'),
    };
  }),
);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('device.features.detail.copy.deviceId'),
    icon: 'lucide:copy',
  },
  {
    key: 'copyCredentials',
    label: $t('device.features.detail.copy.credentials'),
    icon: 'lucide:key-round',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('device.actions.edit'),
      icon: 'lucide:square-pen',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'credentials',
      label: hasAccessByRoles([Authority.TENANT_ADMIN])
        ? $t('device.features.credentials.manage')
        : $t('device.features.credentials.view'),
      icon: 'lucide:key-round',
    },
    {
      key: 'connectivity',
      label: $t('device.features.connectivity.checkConnectivity'),
      icon: 'lucide:plug-zap',
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'assign',
      label: $t('device.actions.assign'),
      icon: 'lucide:user-plus',
      auth: [Authority.TENANT_ADMIN],
      visible: !assigned.value,
      group: 'assignment',
    },
    {
      key: 'visibility',
      label: $t(`device.actions.${visibilityAction.value}`),
      icon: assigned.value ? 'lucide:user-minus' : 'lucide:globe',
      auth: [Authority.TENANT_ADMIN],
      group: 'assignment',
    },
    {
      key: 'delete',
      label: $t('device.actions.delete'),
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
    connectivity: handleConnectivity,
    copyCredentials: handleCopyCredentials,
    copyId: handleCopyId,
    credentials: handleCredentials,
    delete: handleDelete,
    edit: handleEdit,
    refresh: loadDevice,
    visibility: handleVisibility,
  };
  return handlers[key]?.();
}

watch(
  deviceId,
  () => {
    device.value = undefined;
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadDevice();
  },
  { immediate: true },
);

async function loadDevice() {
  const id = deviceId.value;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  activity.value = undefined;
  // Activity failures should not hide the device's basic information.
  const results = await Promise.allSettled([
    getDeviceInfoById(id),
    getAttributesByScope(
      { id, entityType: EntityType.DEVICE },
      AttributeScope.SERVER_SCOPE,
      {
        keys: 'lastActivityTime,lastConnectTime,lastDisconnectTime',
      },
    ),
  ]);
  if (deviceId.value !== id) return;
  const [info, attributes] = results;
  device.value = info.status === 'fulfilled' ? info.value : undefined;
  if (device.value) setBreadcrumbTitle(device.value.name);
  activity.value =
    attributes.status === 'fulfilled' ? attributes.value : undefined;
  loading.value = false;
}

function handleBack() {
  return router.push({ name: 'DeviceList' });
}

function handleEdit() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({ deviceId: deviceId.value }).open();
}

function handleCredentials() {
  formModalApi
    .setData({ deviceId: deviceId.value, mode: 'credentials' })
    .open();
}

function handleAssign() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  assignModalApi.setData({ deviceIds: [deviceId.value] }).open();
}

function handleConnectivity() {
  connectivityModalApi.setData({ deviceId: deviceId.value }).open();
}

function handleCopyId() {
  return copyToClipboard(
    deviceId.value,
    $t('device.features.detail.copy.deviceIdCopied'),
  );
}

async function handleCopyCredentials() {
  const id = deviceId.value;
  if (!id || loading.value) return;
  loading.value = true;
  try {
    const credentials = await getDeviceCredentials(id);
    if (deviceId.value !== id) return;
    const value =
      credentials.credentialsType === DeviceCredentialsType.ACCESS_TOKEN
        ? credentials.credentialsId
        : credentials.credentialsValue;
    if (!value?.trim()) {
      message.warning($t('device.features.detail.copy.credentialsEmpty'));
      return;
    }
    await copyToClipboard(
      value,
      $t('device.features.detail.copy.credentialsCopied'),
    );
  } catch {
    message.error($t('device.features.detail.copy.credentialsFailed'));
  } finally {
    if (deviceId.value === id) loading.value = false;
  }
}

async function handleVisibility() {
  const current = device.value;
  if (
    !current?.id ||
    !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
    loading.value
  )
    return;
  const action = visibilityAction.value;
  try {
    await confirm({
      title: $t(`device.features.${action}.title`),
      content: $t(`device.features.${action}.content`, {
        name: current.name,
        customer: current.customerTitle,
      }),
    });
  } catch {
    return;
  }
  loading.value = true;
  try {
    await (action === 'makePublic'
      ? makeDevicePublic(current.id.id)
      : unassignDeviceFromCustomer(current.id.id));
    message.success($t(`device.actions.${action}Success`));
    if (deviceId.value === current.id.id) await loadDevice();
  } finally {
    if (deviceId.value === current.id.id) loading.value = false;
  }
}

async function handleDelete() {
  const current = device.value;
  if (
    !current?.id ||
    !hasAccessByRoles([Authority.TENANT_ADMIN]) ||
    loading.value
  ) {
    return;
  }
  const id = current.id.id;
  try {
    await confirm({
      title: $t('device.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('device.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteDevice(id);
          message.success($t('tb.common.messages.delete.success'));
          if (deviceId.value === id) {
            await router.replace({ name: 'DeviceList' });
          }
          return true;
        } catch {
          return false;
        } finally {
          loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('device.features.detail.title')"
    :key="deviceId"
    v-model:active-tab="activeTab"
    :title="device?.name"
    :status="
      device
        ? { text: statusText, variant: device.active ? 'success' : 'warning' }
        : undefined
    "
    :tags="headerFields"
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :tabs="tabs"
    :entity-id="device?.id"
    :state="loading ? 'loading' : device ? 'ready' : 'error'"
    :error-message="!device ? $t('device.features.detail.notFound') : undefined"
    @action="handleAction"
    @retry="loadDevice"
    @back="handleBack"
  >
    <template #modals>
      <FormModal @success="loadDevice" />
      <AssignModal @success="loadDevice" />
      <ConnectivityModal />
    </template>
    <template #tab-details>
      <div
        v-if="device"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:server"
          :title="$t('device.features.detail.sections.basic')"
        >
          <dl class="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <div
              v-for="field in basicFields"
              :key="field.label"
              class="space-y-2"
            >
              <dt class="text-sm text-muted-foreground">
                {{ field.label }}
              </dt>
              <dd class="break-all text-sm font-medium">
                {{ field.value || '—' }}
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('device.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="
                  !device.additionalInfo?.description && 'text-muted-foreground'
                "
              >
                {{
                  device.additionalInfo?.description ||
                  $t('device.features.detail.messages.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <div
          class="grid min-h-0 min-w-0 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-5 overflow-hidden"
        >
          <Card
            icon="lucide:activity"
            :title="$t('device.features.detail.sections.activity')"
            content-class="space-y-5"
          >
            <div
              class="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3"
            >
              <span class="text-sm text-muted-foreground">
                {{ $t('device.fields.active') }}
              </span>
              <Badge :variant="device.active ? 'success' : 'warning'">
                {{ statusText }}
              </Badge>
            </div>
            <p
              v-if="!loading && !activity"
              role="alert"
              class="text-sm text-destructive"
            >
              {{ $t('device.features.detail.messages.activityFailed') }}
            </p>
            <p
              v-else-if="loading"
              role="status"
              class="text-sm text-muted-foreground"
            >
              {{ $t('device.features.detail.messages.loading') }}
            </p>
            <dl v-else class="space-y-5">
              <div
                v-for="field in activityFields"
                :key="field.key"
                class="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm"
              >
                <dt class="text-muted-foreground">
                  {{ $t(`device.features.detail.fields.${field.key}`) }}
                </dt>
                <dd class="tabular-nums">
                  {{ field.value }}
                </dd>
              </div>
            </dl>
          </Card>
          <Card
            icon="lucide:network"
            :title="$t('device.features.detail.sections.gateway')"
            content-class="space-y-5"
          >
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="text-muted-foreground">
                {{ $t('device.fields.isGateway') }}
              </span>
              <Badge variant="secondary">
                {{
                  device.additionalInfo?.gateway
                    ? $t('tb.common.yes')
                    : $t('tb.common.no')
                }}
              </Badge>
            </div>
            <template v-if="device.additionalInfo?.gateway">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-muted-foreground">
                  {{ $t('device.fields.overwriteActivityTime') }}
                </span>
                <Badge variant="secondary">
                  {{
                    device.additionalInfo?.overwriteActivityTime
                      ? $t('tb.common.yes')
                      : $t('tb.common.no')
                  }}
                </Badge>
              </div>
              <p class="text-xs leading-6 text-muted-foreground">
                {{
                  $t('device.features.form.overwriteActivityTimeDescription')
                }}
              </p>
            </template>
            <p v-else class="text-xs leading-6 text-muted-foreground">
              {{ $t('device.features.detail.messages.directDevice') }}
            </p>
          </Card>
        </div>
      </div>
    </template>
  </DetailPage>
</template>
