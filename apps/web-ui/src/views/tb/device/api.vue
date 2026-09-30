<script setup lang="ts">
import type { BasicColumn } from '#/adapter/table';
import type { EntityId } from '#/types/tb';

import { computed, reactive, ref, watch } from 'vue';

import { JsonViewer, useVbenModal, VbenButton } from '@vben/common-ui';

import { Input, Segmented } from 'antdv-next';

import { BasicTable, useTable } from '#/adapter/table';
import { getDeviceCredentials } from '#/api/tb/device';
import { CopyText } from '#/components/widget';
import { DeviceCredentialsType } from '#/enums';
import { $t } from '#/locales';

type Protocol = 'coap' | 'http' | 'mqttDevice' | 'mqttGateway';
type ApiOperation = 'GET' | 'observe' | 'POST' | 'publish' | 'subscribe';

interface ApiEntry {
  group: string;
  path: string;
  operation: ApiOperation;
  description: string;
  example: Record<string, unknown>;
}

const props = defineProps<{ entityId: EntityId }>();
const protocol = ref<Protocol>('mqttDevice');
const accessToken = ref('$ACCESS_TOKEN');
const credentialsState = ref<'error' | 'loading' | 'ready'>('loading');
const serviceUrls = reactive({
  http: window.location.origin,
  coap: `coap://${window.location.hostname}:5683`,
});
const selectedEntry = ref<ApiEntry>();
const [ExampleModal, exampleModalApi] = useVbenModal();
const protocolOptions = computed(() =>
  (['mqttDevice', 'mqttGateway', 'http', 'coap'] as const).map((value) => ({
    value,
    label: $t(`device.features.connectionApi.protocol.${value}`),
  })),
);

const examples = {
  telemetry: { temperature: 25, humidity: 60 },
  attributes: { model: 'Sensor A', firmwareVersion: '1.0.0' },
  rpc: { method: 'setGpio', params: { pin: 23, value: 1 } },
  attributesResponse: {
    client: { model: 'Sensor A' },
    shared: { firmwareVersion: '1.0.0' },
  },
};

const mqttDeviceEntries: ApiEntry[] = [
  {
    group: 'telemetry',
    path: 'v1/devices/me/telemetry',
    operation: 'publish',
    description: 'telemetryPublish',
    example: examples.telemetry,
  },
  {
    group: 'attributes',
    path: 'v1/devices/me/attributes',
    operation: 'publish',
    description: 'attributesPublish',
    example: examples.attributes,
  },
  {
    group: 'attributes',
    path: 'v1/devices/me/attributes',
    operation: 'subscribe',
    description: 'attributesSubscribe',
    example: { firmwareVersion: '1.0.1' },
  },
  {
    group: 'attributes',
    path: 'v1/devices/me/attributes/request/$request_id',
    operation: 'publish',
    description: 'attributesRequest',
    example: { clientKeys: 'model', sharedKeys: 'firmwareVersion' },
  },
  {
    group: 'attributes',
    path: 'v1/devices/me/attributes/response/+',
    operation: 'subscribe',
    description: 'attributesResponse',
    example: examples.attributesResponse,
  },
  {
    group: 'rpc',
    path: 'v1/devices/me/rpc/request/+',
    operation: 'subscribe',
    description: 'serverRpcSubscribe',
    example: examples.rpc,
  },
  {
    group: 'rpc',
    path: 'v1/devices/me/rpc/response/$request_id',
    operation: 'publish',
    description: 'serverRpcReply',
    example: { success: true },
  },
  {
    group: 'rpc',
    path: 'v1/devices/me/rpc/request/$request_id',
    operation: 'publish',
    description: 'clientRpcRequest',
    example: { method: 'getTime', params: {} },
  },
  {
    group: 'rpc',
    path: 'v1/devices/me/rpc/response/+',
    operation: 'subscribe',
    description: 'clientRpcResponse',
    example: { time: 1_700_000_000_000 },
  },
];
const mqttGatewayEntries: ApiEntry[] = [
  {
    group: 'subDeviceState',
    path: 'v1/gateway/connect',
    operation: 'publish',
    description: 'gatewayConnect',
    example: { device: 'Device A' },
  },
  {
    group: 'subDeviceState',
    path: 'v1/gateway/disconnect',
    operation: 'publish',
    description: 'gatewayDisconnect',
    example: { device: 'Device A' },
  },
  {
    group: 'subDeviceTelemetry',
    path: 'v1/gateway/telemetry',
    operation: 'publish',
    description: 'gatewayTelemetry',
    example: {
      'Device A': [{ ts: 1_700_000_000_000, values: examples.telemetry }],
    },
  },
  {
    group: 'subDeviceAttributes',
    path: 'v1/gateway/attributes',
    operation: 'publish',
    description: 'gatewayAttributesPublish',
    example: { 'Device A': examples.attributes },
  },
  {
    group: 'subDeviceAttributes',
    path: 'v1/gateway/attributes',
    operation: 'subscribe',
    description: 'gatewayAttributesSubscribe',
    example: { device: 'Device A', data: { firmwareVersion: '1.0.1' } },
  },
  {
    group: 'subDeviceAttributes',
    path: 'v1/gateway/attributes/request',
    operation: 'publish',
    description: 'gatewayAttributesRequest',
    example: { id: 1, device: 'Device A', client: true, key: 'model' },
  },
  {
    group: 'subDeviceAttributes',
    path: 'v1/gateway/attributes/response',
    operation: 'subscribe',
    description: 'gatewayAttributesResponse',
    example: { id: 1, device: 'Device A', value: 'Sensor A' },
  },
  {
    group: 'subDeviceRpc',
    path: 'v1/gateway/rpc',
    operation: 'subscribe',
    description: 'gatewayRpcSubscribe',
    example: { device: 'Device A', data: { id: 1, ...examples.rpc } },
  },
  {
    group: 'subDeviceRpc',
    path: 'v1/gateway/rpc',
    operation: 'publish',
    description: 'gatewayRpcReply',
    example: { device: 'Device A', id: 1, data: { success: true } },
  },
];

const apiEntries = computed<ApiEntry[]>(() => {
  if (protocol.value === 'mqttDevice') {
    return mqttDeviceEntries;
  }
  if (protocol.value === 'mqttGateway') {
    return mqttGatewayEntries;
  }
  const coap = protocol.value === 'coap';
  const baseUrl = serviceUrls[protocol.value].trim().replace(/\/+$/, '');
  const token =
    accessToken.value === '$ACCESS_TOKEN'
      ? accessToken.value
      : encodeURIComponent(accessToken.value);
  const basePath = `${baseUrl}/api/v1/${token}`;
  return [
    {
      group: 'telemetry',
      path: `${basePath}/telemetry`,
      operation: 'POST',
      description: 'telemetryPublish',
      example: examples.telemetry,
    },
    {
      group: 'attributes',
      path: `${basePath}/attributes`,
      operation: 'POST',
      description: 'attributesPublish',
      example: examples.attributes,
    },
    {
      group: 'attributes',
      path: `${basePath}/attributes?clientKeys=model&sharedKeys=firmwareVersion`,
      operation: 'GET',
      description: 'attributesGet',
      example: examples.attributesResponse,
    },
    {
      group: 'attributes',
      path: `${basePath}/attributes/updates${coap ? '' : '?timeout=20000'}`,
      operation: coap ? 'observe' : 'GET',
      description: coap ? 'attributesSubscribe' : 'attributesUpdates',
      example: { shared: { firmwareVersion: '1.0.1' } },
    },
    {
      group: 'rpc',
      path: `${basePath}/rpc${coap ? '' : '?timeout=20000'}`,
      operation: coap ? 'observe' : 'GET',
      description: 'serverRpcSubscribe',
      example: { id: 1, ...examples.rpc },
    },
    {
      group: 'rpc',
      path: `${basePath}/rpc/$request_id`,
      operation: 'POST',
      description: 'serverRpcReply',
      example: { success: true },
    },
    {
      group: 'rpc',
      path: `${basePath}/rpc`,
      operation: 'POST',
      description: 'clientRpcRequest',
      example: { method: 'getTime', params: {} },
    },
  ];
});

const columns = computed<BasicColumn<ApiEntry>[]>(() => [
  {
    title: $t('device.features.connectionApi.fields.function'),
    dataIndex: 'group',
    width: 140,
    onCell: (_, index = 0) => ({
      rowSpan: getGroupRowSpan(index),
      style: { verticalAlign: 'middle' },
    }),
    customRender: ({ value }) =>
      $t(`device.features.connectionApi.groups.${value}`),
  },
  {
    title: $t(
      `device.features.connectionApi.fields.${protocol.value.startsWith('mqtt') ? 'topic' : 'url'}`,
    ),
    dataIndex: 'path',
    minWidth: 320,
    align: 'left',
    slot: 'path',
  },
  {
    title: $t('device.features.connectionApi.fields.operate'),
    dataIndex: 'operation',
    width: 125,
    customRender: ({ record }) => formatOperation(record.operation),
  },
  {
    title: $t('device.features.connectionApi.fields.description'),
    dataIndex: 'description',
    minWidth: 240,
    align: 'left',
    customRender: ({ value }) =>
      $t(`device.features.connectionApi.desc.${value}`),
  },
  {
    title: $t('device.features.connectionApi.example.title'),
    key: 'example',
    width: 100,
    slot: 'example',
  },
]);
const [registerTable] = useTable<ApiEntry>({
  rowKey: 'description',
  columns,
  dataSource: apiEntries,
  loading: computed(() => credentialsState.value === 'loading'),
  pagination: false,
  rowSelection: null,
  showIndexColumn: false,
  showTableSetting: false,
});

function getGroupRowSpan(index: number) {
  const group = apiEntries.value[index]?.group;
  if (!group || apiEntries.value[index - 1]?.group === group) return 0;
  let rowSpan = 1;
  while (apiEntries.value[index + rowSpan]?.group === group) rowSpan++;
  return rowSpan;
}

function formatOperation(operation: ApiOperation) {
  if (operation === 'GET' || operation === 'POST') return operation;
  const label = $t(`device.features.connectionApi.operate.${operation}`);
  return operation === 'observe' ? `GET / ${label}` : label;
}

function showExample(entry: ApiEntry) {
  selectedEntry.value = entry;
  exampleModalApi.open();
}

watch(
  () => props.entityId.id,
  async (deviceId, _, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    accessToken.value = '$ACCESS_TOKEN';
    credentialsState.value = 'loading';
    exampleModalApi.close();
    selectedEntry.value = undefined;
    try {
      const credentials = await getDeviceCredentials(deviceId);
      if (cancelled) return;
      if (credentials.credentialsType === DeviceCredentialsType.ACCESS_TOKEN)
        accessToken.value = credentials.credentialsId || '$ACCESS_TOKEN';
      credentialsState.value = 'ready';
    } catch {
      if (!cancelled) {
        credentialsState.value = 'error';
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <section
    class="bg-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border"
  >
    <div class="space-y-2 px-5 py-3">
      <div class="flex flex-wrap items-center gap-3">
        <Segmented
          v-model:value="protocol"
          :options="protocolOptions"
          :aria-label="$t('device.features.connectivity.protocol')"
        />
        <Input
          v-if="protocol === 'http' || protocol === 'coap'"
          v-model:value="serviceUrls[protocol]"
          class="w-80 max-w-full font-mono"
          :aria-label="$t('device.features.connectionApi.serviceUrl')"
          :placeholder="$t('device.features.connectionApi.serviceUrl')"
          :title="$t('device.features.connectionApi.serviceUrlHint')"
        />
      </div>
      <p
        class="text-muted-foreground text-xs"
        :class="{ 'text-destructive': credentialsState === 'error' }"
        role="status"
      >
        {{
          credentialsState === 'error'
            ? $t('device.features.connectionApi.credentialsError')
            : $t('device.features.connectionApi.tokenTip')
        }}
      </p>
    </div>
    <BasicTable class="min-h-0 flex-1" @register="registerTable">
      <template #path="{ record }">
        <CopyText :text="record.path" class="font-mono text-xs" />
      </template>
      <template #example="{ record }">
        <VbenButton variant="link" size="sm" @click="showExample(record)">
          {{ $t('device.features.connectionApi.example.action') }}
        </VbenButton>
      </template>
    </BasicTable>
    <ExampleModal
      :title="$t('device.features.connectionApi.example.title')"
      class="w-[calc(100%_-_2rem)] max-w-3xl"
      :show-confirm-button="false"
      :cancel-text="$t('tb.common.close')"
    >
      <div v-if="selectedEntry" class="space-y-4">
        <p class="text-muted-foreground text-sm">
          {{
            $t(
              `device.features.connectionApi.desc.${selectedEntry.description}`,
            )
          }}
        </p>
        <CopyText :text="selectedEntry.path" class="font-mono text-xs" />
        <JsonViewer boxed copyable expanded :value="selectedEntry.example" />
      </div>
    </ExampleModal>
  </section>
</template>
