<script setup lang="ts">
import type { DeviceProfile } from '#/api/tb/device-profile';
import type {
  DetailAction,
  DetailPrimaryAction,
  DetailTab,
  DetailTag,
} from '#/components/detail-page';
import type { EntityId } from '#/types/tb';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal, VbenIconButton } from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

import {
  getImageResource,
  removeImagePrefix,
} from '#/adapter/component/image-input/utils';
import ImagePreview from '#/adapter/component/image-preview.vue';
import {
  deleteDeviceProfile,
  exportDeviceProfile,
  getDeviceProfileById,
  setDefaultDeviceProfile,
} from '#/api/tb/device-profile';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { Card } from '#/components/card';
import { DetailPage } from '#/components/detail-page';
import {
  Authority,
  CoapTransportDeviceType,
  DeviceProvisionType,
  deviceProvisionTypeOptions,
  DeviceTransportType,
  deviceTransportTypeOptions,
  PowerMode,
  TransportPayloadType,
} from '#/enums';
import { $t } from '#/locales';
import { copyToClipboard } from '#/utils/common';
import { exportJsonFile, prepareEntityExport } from '#/utils/import-export';

import ProfileForm from './form.vue';

defineOptions({ name: 'DeviceProfileDetail' });

interface DetailField {
  copyable?: boolean;
  key: string;
  value: unknown;
}

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const profileId = computed(() => String(route.params.deviceProfileId ?? ''));
const profile = ref<DeviceProfile>();
const relatedNames = ref<Record<string, string>>({});
const activeTab = ref('details');
const loading = ref(false);
const imageResource = computed(() => getImageResource(profile.value?.image));

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ProfileForm,
  destroyOnClose: true,
});
const tabs: DetailTab[] = [
  { key: 'details', auth: [Authority.TENANT_ADMIN] },
  { key: 'calculatedFields', auth: [Authority.TENANT_ADMIN] },
  { key: 'alarmRules', auth: [Authority.TENANT_ADMIN] },
  { key: 'auditLogs', auth: [Authority.TENANT_ADMIN] },
];

// 详情字段：基本信息、传输配置、设备预配置。
const basicFields = computed(() => [
  { label: $t('device-profile.fields.name'), value: profile.value?.name },
  {
    label: $t('device-profile.fields.default'),
    value: $t(profile.value?.default ? 'tb.common.yes' : 'tb.common.no'),
  },
  {
    label: $t('tb.common.createdTime'),
    value: formatDateTime(profile.value?.createdTime),
  },
  {
    label: $t('device-profile.fields.defaultQueue'),
    value:
      profile.value?.defaultQueueName ||
      $t('device-profile.features.form.queuePlaceholder'),
  },
  {
    label: $t('device-profile.fields.defaultRuleChain'),
    value: entityName(
      profile.value?.defaultRuleChainId,
      $t('device-profile.features.form.ruleChainPlaceholder'),
    ),
  },
  {
    label: $t('device-profile.fields.defaultEdgeRuleChain'),
    value: entityName(profile.value?.defaultEdgeRuleChainId),
  },
  {
    label: $t('device-profile.fields.defaultDashboard'),
    value: entityName(profile.value?.defaultDashboardId),
  },
]);
const transportType = computed(
  () => profile.value?.transportType ?? DeviceTransportType.DEFAULT,
);
const provisionType = computed(
  () => profile.value?.provisionType ?? DeviceProvisionType.DISABLED,
);
const transport = computed(
  () => profile.value?.profileData?.transportConfiguration ?? {},
);
const payload = computed(() =>
  transportType.value === DeviceTransportType.COAP
    ? (transport.value.coapDeviceTypeConfiguration
        ?.transportPayloadTypeConfiguration ?? {})
    : (transport.value.transportPayloadTypeConfiguration ?? {}),
);
const transportFields = computed(() => {
  const config = transport.value;
  const fields: DetailField[] = [];
  if (transportType.value === DeviceTransportType.MQTT) {
    fields.push({ key: 'sparkplug', value: config.sparkplug ?? false });
    if (config.sparkplug) {
      fields.push({
        key: 'sparkplugMetricNames',
        value: config.sparkplugAttributesMetricNames ?? [],
      });
      return fields;
    }
    fields.push(
      {
        key: 'telemetryTopic',
        value: config.deviceTelemetryTopic,
        copyable: true,
      },
      {
        key: 'attributesTopic',
        value: config.deviceAttributesTopic,
        copyable: true,
      },
      {
        key: 'attributesSubscribeTopic',
        value: config.deviceAttributesSubscribeTopic,
        copyable: true,
      },
      {
        key: 'payloadType',
        value: payload.value.transportPayloadType ?? TransportPayloadType.JSON,
      },
      {
        key: 'sendAckOnValidationException',
        value: config.sendAckOnValidationException ?? false,
      },
    );
    if (payload.value.transportPayloadType !== TransportPayloadType.PROTOBUF)
      return fields;
    fields.push({
      key: 'enableJsonCompat',
      value: payload.value.enableCompatibilityWithJsonPayloadFormat ?? false,
    });
    if (payload.value.enableCompatibilityWithJsonPayloadFormat) {
      fields.push({
        key: 'useJsonForDownlink',
        value:
          payload.value.useJsonPayloadFormatForDefaultDownlinkTopics ?? false,
      });
    }
    return fields;
  }
  if (transportType.value === DeviceTransportType.COAP) {
    const deviceType =
      config.coapDeviceTypeConfiguration?.coapDeviceType ??
      CoapTransportDeviceType.DEFAULT;
    const client = config.clientSettings ?? {};
    fields.push({
      key: 'coapDeviceType',
      value: $t(`device-profile.options.coapDeviceType.${deviceType}`),
    });
    if (deviceType === CoapTransportDeviceType.DEFAULT) {
      fields.push({
        key: 'payloadType',
        value: payload.value.transportPayloadType ?? TransportPayloadType.JSON,
      });
    }
    fields.push({ key: 'powerMode', value: client.powerMode ?? PowerMode.DRX });
    if (client.powerMode === PowerMode.PSM)
      fields.push({ key: 'psmActivityTimer', value: client.psmActivityTimer });
    if (client.powerMode === PowerMode.E_DRX) {
      fields.push(
        { key: 'edrxCycle', value: client.edrxCycle },
        {
          key: 'pagingTransmissionWindow',
          value: client.pagingTransmissionWindow,
        },
      );
    }
  }
  return fields;
});
const protoFields = computed(() => {
  if (
    payload.value.transportPayloadType !== TransportPayloadType.PROTOBUF ||
    (transportType.value === DeviceTransportType.MQTT &&
      transport.value.sparkplug) ||
    (transportType.value === DeviceTransportType.COAP &&
      transport.value.coapDeviceTypeConfiguration?.coapDeviceType ===
        CoapTransportDeviceType.EFENTO)
  )
    return [];
  return [
    {
      key: 'telemetryProtoSchema',
      value: payload.value.deviceTelemetryProtoSchema,
    },
    {
      key: 'attributesProtoSchema',
      value: payload.value.deviceAttributesProtoSchema,
    },
    {
      key: 'rpcRequestProtoSchema',
      value: payload.value.deviceRpcRequestProtoSchema,
    },
    {
      key: 'rpcResponseProtoSchema',
      value: payload.value.deviceRpcResponseProtoSchema,
    },
  ];
});
const provisionFields = computed<DetailField[]>(() => {
  const config = profile.value?.profileData?.provisionConfiguration ?? {};
  if (provisionType.value === DeviceProvisionType.X509_CERTIFICATE_CHAIN) {
    return [
      {
        key: 'allowCreateNewDevices',
        value: config.allowCreateNewDevicesByX509Certificate ?? true,
      },
      { key: 'cnRegex', value: config.certificateRegExPattern, copyable: true },
      {
        key: 'certificateValue',
        value: config.provisionDeviceSecret,
        copyable: true,
      },
    ];
  }
  if (
    provisionType.value === DeviceProvisionType.ALLOW_CREATE_NEW_DEVICES ||
    provisionType.value === DeviceProvisionType.CHECK_PRE_PROVISIONED_DEVICES
  ) {
    return [
      {
        key: 'deviceKey',
        value: profile.value?.provisionDeviceKey ?? config.provisionDeviceKey,
        copyable: true,
      },
      {
        key: 'deviceSecret',
        value: config.provisionDeviceSecret,
        copyable: true,
      },
    ];
  }
  return [];
});

const configurationSections = computed(() => [
  {
    key: 'transport',
    icon: 'lucide:network',
    title: $t('device-profile.features.wizard.transport'),
    fields: [
      {
        key: 'transportType',
        label: $t('device-profile.fields.transportType'),
        value:
          deviceTransportTypeOptions().find(
            (option) => option.value === transportType.value,
          )?.label ?? transportType.value,
        copyable: false,
      },
      ...transportFields.value.map((field) => ({
        ...field,
        label: $t(`device-profile.options.transport.${field.key}`),
      })),
    ],
  },
  {
    key: 'provision',
    icon: 'lucide:key-round',
    title: $t('device-profile.features.wizard.provision'),
    fields: [
      {
        key: 'strategy',
        label: $t('device-profile.options.provision.strategy'),
        value:
          deviceProvisionTypeOptions().find(
            (option) => option.value === provisionType.value,
          )?.label ?? provisionType.value,
        copyable: false,
      },
      ...provisionFields.value.map((field) => ({
        ...field,
        label: $t(`device-profile.options.provision.${field.key}`),
      })),
    ],
  },
]);

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean')
    return $t(value ? 'tb.common.yes' : 'tb.common.no');
  if (Array.isArray(value)) return value.join(', ') || '—';
  return String(value);
}

// 页头操作。
const headerFields = computed<DetailTag[]>(() => [
  {
    key: 'transportType',
    icon: 'lucide:network',
    label: $t('device-profile.fields.transportType'),
    value: profile.value
      ? (deviceTransportTypeOptions().find(
          (option) => option.value === transportType.value,
        )?.label ?? transportType.value)
      : undefined,
  },
  {
    key: 'description',
    icon: 'lucide:text',
    label: $t('device-profile.fields.description'),
    value: profile.value?.description,
  },
]);

const secondaryActions = computed<DetailAction[]>(() => [
  {
    key: 'copyId',
    label: $t('device-profile.features.detail.copyId'),
    icon: 'lucide:copy',
  },
]);
const primaryAction = computed<DetailPrimaryAction>(() => ({
  label: $t('tb.common.actions'),
  icon: 'lucide:sliders-horizontal',
  items: [
    {
      key: 'edit',
      label: $t('device-profile.actions.edit'),
      icon: 'lucide:square-pen',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'export',
      label: $t('device-profile.actions.export'),
      icon: 'lucide:download',
      auth: [Authority.TENANT_ADMIN],
    },
    {
      key: 'setDefault',
      label: $t('device-profile.actions.setDefault'),
      icon: 'lucide:flag',
      auth: [Authority.TENANT_ADMIN],
      disabled: !!profile.value?.default,
    },
    {
      key: 'refresh',
      label: $t('tb.common.refresh'),
      icon: 'lucide:refresh-cw',
    },
    {
      key: 'delete',
      label: $t('device-profile.actions.delete'),
      icon: 'lucide:trash-2',
      auth: [Authority.TENANT_ADMIN],
      disabled: !!profile.value?.default,
      danger: true,
      group: 'delete',
    },
  ],
}));

function entityName(entity?: EntityId | null, empty = '—') {
  return entity?.id
    ? relatedNames.value[entity.id] ||
        $t('device-profile.features.detail.nameUnavailable')
    : empty;
}

function handleAction(key: string) {
  const handlers: Record<string, () => unknown> = {
    copyId: () =>
      copyToClipboard(
        profileId.value,
        $t('device-profile.features.detail.idCopied'),
      ),
    edit: handleEdit,
    export: handleExport,
    setDefault: handleSetDefault,
    refresh: loadProfile,
    delete: handleDelete,
  };
  return handlers[key]?.();
}

watch(
  profileId,
  () => {
    profile.value = undefined;
    relatedNames.value = {};
    activeTab.value = 'details';
    resetBreadcrumbTitle();
    void loadProfile();
  },
  { immediate: true },
);

async function loadEntityName(entity: EntityId) {
  const name = await findEntityDataByQuery({
    entityFilter: { type: 'singleEntity', singleEntity: entity },
    entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
    pageLink: { page: 0, pageSize: 1 },
  })
    .then(({ data }) => data[0]?.latest.ENTITY_FIELD?.name?.value ?? '')
    .catch(() => '');
  return [entity.id, name] as const;
}

async function loadProfile() {
  const id = profileId.value;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const info = await getDeviceProfileById(id);
    if (profileId.value !== id) return;
    const names = await Promise.all(
      [
        info.defaultRuleChainId,
        info.defaultEdgeRuleChainId,
        info.defaultDashboardId,
      ]
        .filter((entity) => entity !== null && entity !== undefined)
        .map((entity) => loadEntityName(entity)),
    );
    if (profileId.value !== id) return;
    profile.value = info;
    relatedNames.value = Object.fromEntries(names);
    setBreadcrumbTitle(info.name);
  } catch {
    if (profileId.value === id) profile.value = undefined;
  } finally {
    if (profileId.value === id) loading.value = false;
  }
}

function handleBack() {
  return router.push({ name: 'DeviceProfileList' });
}

function handleEdit() {
  if (!hasAccessByRoles([Authority.TENANT_ADMIN])) return;
  formModalApi.setData({ deviceProfileId: profileId.value }).open();
}

async function handleExport() {
  const id = profileId.value;
  if (!id || loading.value || !hasAccessByRoles([Authority.TENANT_ADMIN]))
    return;
  loading.value = true;
  try {
    const info = await exportDeviceProfile(id);
    const data = prepareEntityExport(info);
    data.default = false;
    exportJsonFile(data, info.name);
  } finally {
    if (profileId.value === id) loading.value = false;
  }
}

async function handleSetDefault() {
  const current = profile.value;
  if (
    !current?.id ||
    current.default ||
    loading.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  try {
    await confirm({
      title: $t('device-profile.features.setDefault.title', {
        name: current.name,
      }),
      content: $t('device-profile.features.setDefault.content'),
      icon: 'warning',
    });
  } catch {
    return;
  }
  if (profileId.value !== current.id.id) return;
  loading.value = true;
  try {
    await setDefaultDeviceProfile(current.id.id);
    message.success($t('device-profile.features.setDefault.success'));
    if (profileId.value === current.id.id) await loadProfile();
  } finally {
    if (profileId.value === current.id.id) loading.value = false;
  }
}

async function handleDelete() {
  const current = profile.value;
  if (
    !current?.id ||
    current.default ||
    loading.value ||
    !hasAccessByRoles([Authority.TENANT_ADMIN])
  )
    return;
  const id = current.id.id;
  try {
    await confirm({
      title: $t('device-profile.actions.delete'),
      content: $t('tb.common.messages.delete.title', {
        entity: $t('device-profile.menu'),
        name: current.name,
      }),
      icon: 'error',
      confirmButtonProps: { variant: 'destructive' },
      confirmText: $t('tb.common.delete'),
      async beforeClose({ isConfirm }) {
        if (!isConfirm) return true;
        loading.value = true;
        try {
          await deleteDeviceProfile(id);
          message.success($t('tb.common.messages.delete.success'));
          if (profileId.value === id)
            await router.replace({ name: 'DeviceProfileList' });
          return true;
        } catch {
          return false;
        } finally {
          if (profileId.value === id) loading.value = false;
        }
      },
    });
  } catch {}
}
</script>

<template>
  <DetailPage
    :page-title="$t('device-profile.features.detail.title')"
    :key="profileId"
    v-model:active-tab="activeTab"
    :title="profile?.name"
    :status="
      profile?.default
        ? {
            text: $t('device-profile.features.detail.default'),
            variant: 'success',
          }
        : undefined
    "
    :secondary-actions="secondaryActions"
    :primary-action="primaryAction"
    :tabs="tabs"
    :tags="headerFields"
    :entity-id="profile?.id"
    :state="loading ? 'loading' : profile ? 'ready' : 'error'"
    :error-message="$t('device-profile.features.detail.notFound')"
    @action="handleAction"
    @retry="loadProfile"
    @back="handleBack"
  >
    <template #modals><FormModal @success="loadProfile" /></template>
    <template #tab-details>
      <div
        v-if="profile"
        class="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,2fr)] gap-5 overflow-hidden xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] xl:grid-rows-[minmax(0,1fr)]"
      >
        <Card
          icon="lucide:cpu"
          :title="$t('device-profile.features.detail.basic')"
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
            <div v-if="profile.image" class="space-y-2 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('device-profile.fields.image') }}
              </dt>
              <dd>
                <ImagePreview
                  v-if="imageResource"
                  v-bind="imageResource"
                  class="h-32 w-48 rounded-lg border"
                />
                <img
                  v-else
                  :src="removeImagePrefix(profile.image)"
                  :alt="profile.name"
                  class="h-32 max-w-full rounded-lg border object-contain"
                />
              </dd>
            </div>
            <div class="space-y-2 border-t pt-5 sm:col-span-2">
              <dt class="text-sm text-muted-foreground">
                {{ $t('device-profile.fields.description') }}
              </dt>
              <dd
                class="whitespace-pre-wrap break-words text-sm leading-7"
                :class="!profile.description && 'text-muted-foreground'"
              >
                {{
                  profile.description ||
                  $t('device-profile.features.detail.noDescription')
                }}
              </dd>
            </div>
          </dl>
        </Card>
        <div
          class="grid min-h-0 min-w-0 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-5 overflow-hidden"
        >
          <Card
            v-for="section in configurationSections"
            :key="section.key"
            :icon="section.icon"
            :title="section.title"
            content-class="space-y-5"
          >
            <dl class="space-y-5">
              <div
                v-for="field in section.fields"
                :key="field.key"
                class="space-y-2"
              >
                <dt class="text-sm text-muted-foreground">
                  {{ field.label }}
                </dt>
                <dd
                  class="flex min-w-0 items-center gap-2 text-sm font-medium"
                  :class="
                    field.key === 'certificateValue' &&
                    'font-mono text-xs leading-6'
                  "
                >
                  <span class="min-w-0 whitespace-pre-wrap break-all">
                    {{ formatValue(field.value) }}
                  </span>
                  <VbenIconButton
                    v-if="field.copyable && field.value"
                    class="relative size-7 shrink-0 rounded-md"
                    :tooltip="$t('tb.common.copy')"
                    tooltip-side="top"
                    :aria-label="$t('tb.common.copy')"
                    @click="
                      copyToClipboard(
                        formatValue(field.value),
                        $t('tb.common.copySuccess'),
                      )
                    "
                  >
                    <IconifyIcon
                      icon="lucide:copy"
                      class="size-3.5"
                      aria-hidden="true"
                    />
                    <span class="sr-only">{{ $t('tb.common.copy') }}</span>
                  </VbenIconButton>
                </dd>
              </div>
              <div
                v-for="field in section.key === 'transport' ? protoFields : []"
                :key="field.key"
                class="space-y-2"
              >
                <dt class="text-sm text-muted-foreground">
                  {{ $t(`device-profile.options.transport.${field.key}`) }}
                </dt>
                <dd class="overflow-x-auto rounded-lg bg-muted/50 p-3">
                  <pre class="text-xs leading-6">{{ field.value || '—' }}</pre>
                </dd>
              </div>
            </dl>
            <p
              v-if="
                section.key === 'transport' &&
                transportType === DeviceTransportType.DEFAULT
              "
              class="text-sm text-muted-foreground"
            >
              {{ $t('device-profile.messages.transportInfo.default') }}
            </p>
            <details
              v-if="
                section.key === 'transport' &&
                (transportType === DeviceTransportType.LWM2M ||
                  transportType === DeviceTransportType.SNMP)
              "
              class="rounded-lg border p-3"
            >
              <summary class="cursor-pointer text-sm font-medium">
                {{ $t('device-profile.features.detail.advancedTransport') }}
              </summary>
              <pre class="mt-3 overflow-x-auto text-xs leading-6">{{
                JSON.stringify(transport, null, 2)
              }}</pre>
            </details>
          </Card>
        </div>
      </div>
    </template>
  </DetailPage>
</template>
