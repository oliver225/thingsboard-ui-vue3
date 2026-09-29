<script lang="ts" setup>
import type {
  ConnectivityCommand,
  PublishTelemetryCommand,
} from '#/api/tb/device-connectivity';
import type { SubscriptionData } from '#/types/ws';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import {
  useVbenModal,
  VbenButton,
  VbenSegmented,
  VbenTooltip,
} from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { TabPane, Tabs } from 'antdv-next';

import { getDevicePublishTelemetryCommands } from '#/api/tb/device-connectivity';
import { AttributeScope, EntityType } from '#/enums';
import { useWs } from '#/hooks/use-ws';
import { $t } from '#/locales';
import { useSystemStore } from '#/store/system';
import { copyToClipboard } from '#/utils/common';

type Protocol = 'coap' | 'http' | 'lwm2m' | 'mqtt' | 'snmp';
type OperatingSystem = 'docker' | 'linux' | 'macos' | 'windows';
interface TelemetryRow {
  key: string;
  lastUpdateTs: number;
  value: string;
}

const commands = ref<null | PublishTelemetryCommand>(null);
const protocol = ref<Protocol>('http');
const operatingSystem = ref<OperatingSystem>('windows');
const security = ref('plain');
const loadFailed = ref(false);
const deviceId = ref<string>();
const system = useSystemStore();
const telemetry = useWs(() =>
  deviceId.value && system.loaded
    ? {
        type: 'TIMESERIES',
        entityType: EntityType.DEVICE,
        entityId: deviceId.value,
        scope: 'LATEST_TELEMETRY',
      }
    : undefined,
);
const activeAttributes = useWs(() =>
  deviceId.value &&
  system.loaded &&
  !system.systemParams?.persistDeviceStateToTelemetry
    ? {
        type: 'ATTRIBUTES',
        entityType: EntityType.DEVICE,
        entityId: deviceId.value,
        scope: AttributeScope.SERVER_SCOPE,
        keys: 'active',
      }
    : undefined,
);
const telemetryFailed = computed(
  () => !!telemetry.error.value || !!activeAttributes.error.value,
);
const status = ref<boolean>();
const latestTelemetry = ref<TelemetryRow[]>([]);
let openedAt = 0;
let statusUpdatedAt = 0;
let loadController: AbortController | undefined;

const protocolLabels: Record<Protocol, string> = {
  http: 'HTTP',
  mqtt: 'MQTT',
  coap: 'CoAP',
  lwm2m: 'LwM2M',
  snmp: 'SNMP',
};
const protocolTabs = computed(() =>
  (['http', 'mqtt', 'coap', 'snmp', 'lwm2m'] as const)
    .filter((value) => commands.value?.[value] !== undefined)
    .map((value) => ({ value, label: protocolLabels[value] })),
);
const operatingSystemTabs = computed(() => {
  const tabs: { icon: string; label: string; value: OperatingSystem }[] = [];
  if (protocol.value === 'http' || protocol.value === 'mqtt') {
    tabs.push(
      { value: 'windows', label: 'Windows', icon: 'ant-design:windows-filled' },
      { value: 'macos', label: 'macOS', icon: 'ant-design:apple-filled' },
    );
  }
  tabs.push({
    value: 'linux',
    label: 'Linux',
    icon: 'ant-design:linux-outlined',
  });
  if (
    (protocol.value === 'mqtt' && commands.value?.mqtt?.docker) ||
    (protocol.value === 'coap' && commands.value?.coap?.docker)
  ) {
    tabs.push({
      value: 'docker',
      label: 'Docker',
      icon: 'simple-icons:docker',
    });
  }
  return tabs;
});
const commandPair = computed<{
  plain?: ConnectivityCommand;
  secure?: ConnectivityCommand;
}>(() => {
  const value = commands.value;
  switch (protocol.value) {
    case 'http': {
      return { plain: value?.http?.http, secure: value?.http?.https };
    }
    case 'mqtt': {
      const mqtt =
        operatingSystem.value === 'docker' ? value?.mqtt?.docker : value?.mqtt;
      return { plain: mqtt?.mqtt, secure: mqtt?.mqtts };
    }
    case 'coap': {
      const coap =
        operatingSystem.value === 'docker' ? value?.coap?.docker : value?.coap;
      return { plain: coap?.coap, secure: coap?.coaps };
    }
    default: {
      return {};
    }
  }
});
const securityTabs = computed(() => [
  ...(commandPair.value.plain
    ? [{ value: 'plain', label: protocolLabels[protocol.value] }]
    : []),
  ...(commandPair.value.secure
    ? [{ value: 'secure', label: `${protocolLabels[protocol.value]}S` }]
    : []),
]);
const selectedCommand = computed(() =>
  security.value === 'plain'
    ? commandPair.value.plain
    : commandPair.value.secure,
);
const commandBlocks = computed(() => {
  const value = selectedCommand.value;
  if (!value || value === 'Check documentation') return [];
  return Array.isArray(value) ? value : [value];
});
const documentationOnly = computed(
  () =>
    protocol.value === 'snmp' ||
    protocol.value === 'lwm2m' ||
    (protocol.value === 'mqtt' && !!commands.value?.mqtt?.sparkplug),
);
const documentationUrl = computed(() => {
  switch (protocol.value) {
    case 'mqtt': {
      return commands.value?.mqtt?.sparkplug
        ? 'https://thingsboard.io/docs/reference/mqtt-sparkplug-api/'
        : 'https://thingsboard.io/docs/user-guide/mqtt-over-ssl/';
    }
    case 'coap': {
      return 'https://thingsboard.io/docs/user-guide/ssl/coap-x509-certificates/';
    }
    case 'snmp': {
      return 'https://thingsboard.io/docs/reference/snmp-api/';
    }
    case 'lwm2m': {
      return 'https://thingsboard.io/docs/reference/lwm2m-api/';
    }
    default: {
      return 'https://thingsboard.io/docs/reference/http-api/';
    }
  }
});
const installation = computed(() => {
  if (protocol.value === 'http') {
    if (operatingSystem.value === 'linux')
      return { command: 'sudo apt-get install curl' };
    return {
      text: $t(
        `device.features.connectionApi.commands.${operatingSystem.value === 'windows' ? 'installCurlWindows' : 'installCurlMacos'}`,
      ),
    };
  }
  if (protocol.value === 'mqtt') {
    if (operatingSystem.value === 'windows')
      return {
        text: $t('device.features.connectionApi.commands.installMqttWindows'),
        url: 'https://thingsboard.io/docs/reference/mqtt-api/?connectdevice=mqtt-windows#mqtt-connect',
      };
    return {
      command:
        operatingSystem.value === 'macos'
          ? 'brew install mosquitto'
          : 'sudo apt-get install curl mosquitto-clients',
    };
  }
  return {
    text: $t('device.features.connectionApi.commands.installCoapLinux'),
    url: 'https://thingsboard.io/docs/user-guide/ssl/coap-access-token/',
  };
});

watch([protocol, operatingSystem], () => {
  security.value = commandPair.value.plain ? 'plain' : 'secure';
});
watch(protocol, selectOperatingSystem);

function selectOperatingSystem() {
  const platform = navigator.userAgent.toLowerCase();
  let preferred: OperatingSystem = 'linux';
  if (/windows/.test(platform)) {
    preferred = 'windows';
  } else if (/mac|iphone|ipad/.test(platform)) {
    preferred = 'macos';
  }
  const tabs = operatingSystemTabs.value;
  if (
    protocol.value === 'coap' &&
    preferred !== 'linux' &&
    tabs.some((tab) => tab.value === 'docker')
  )
    preferred = 'docker';
  operatingSystem.value = tabs.some((tab) => tab.value === preferred)
    ? preferred
    : 'linux';
}

function updateActive(data: SubscriptionData) {
  for (const [timestamp, value] of data.active ?? []) {
    if (timestamp >= statusUpdatedAt) {
      status.value = value === true || value === 'true';
      statusUpdatedAt = timestamp;
    }
  }
}
function updateTelemetry(data: SubscriptionData) {
  if (system.systemParams?.persistDeviceStateToTelemetry) updateActive(data);
  const rows = new Map(latestTelemetry.value.map((row) => [row.key, row]));
  for (const [key, values] of Object.entries(data)) {
    if (key === 'active') continue;
    for (const [timestamp, value] of values) {
      if (
        timestamp > openedAt &&
        timestamp >= (rows.get(key)?.lastUpdateTs ?? 0)
      ) {
        rows.set(key, {
          key,
          lastUpdateTs: timestamp,
          value:
            typeof value === 'string' ? value : (JSON.stringify(value) ?? ''),
        });
      }
    }
  }
  latestTelemetry.value = [...rows.values()].toSorted(
    (a, b) => b.lastUpdateTs - a.lastUpdateTs,
  );
}

function handleSubscribeTelemetry() {
  telemetry.refresh();
  activeAttributes.refresh();
}
watch(
  telemetry.data,
  (message) => {
    if (!message) latestTelemetry.value = [];
    else if ('subscriptionId' in message) updateTelemetry(message.data);
  },
  { flush: 'sync' },
);
watch(
  activeAttributes.data,
  (message) => {
    if (message && 'subscriptionId' in message) updateActive(message.data);
  },
  { flush: 'sync' },
);

async function handleLoadCommands() {
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  loadFailed.value = false;
  modalApi.setState({ loading: true });
  try {
    const { deviceId } = modalApi.getData() ?? {};
    if (!deviceId) return;
    const result = await getDevicePublishTelemetryCommands(
      deviceId,
      controller.signal,
    );
    if (controller.signal.aborted) return;
    commands.value = result;
    protocol.value = protocolTabs.value[0]?.value ?? 'http';
    selectOperatingSystem();
    security.value = commandPair.value.plain ? 'plain' : 'secure';
  } catch {
    if (!controller.signal.aborted) loadFailed.value = true;
  } finally {
    if (!controller.signal.aborted) modalApi.setState({ loading: false });
  }
}

function stopSubscriptions() {
  loadController?.abort();
  deviceId.value = undefined;
}

const [Modal, modalApi] = useVbenModal<{
  afterAdd?: boolean;
  deviceId: string;
}>({
  onOpenChange(isOpen) {
    if (!isOpen) {
      stopSubscriptions();
      return;
    }
    openedAt = Date.now();
    statusUpdatedAt = 0;
    status.value = undefined;
    latestTelemetry.value = [];
    commands.value = null;
    deviceId.value = modalApi.getData()?.deviceId;
    void system.loadSystemParams();
    modalApi.setState({
      title: modalApi.getData()?.afterAdd
        ? $t('device.features.connectivity.createdCheckConnectivity')
        : $t('device.features.connectivity.checkConnectivity'),
    });
    void handleLoadCommands();
  },
});
const modalState = modalApi.useStore();
onBeforeUnmount(stopSubscriptions);
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :show-confirm-button="false"
    :cancel-text="$t('tb.common.close')"
  >
    <div
      v-if="loadFailed"
      role="alert"
      class="flex items-center justify-between gap-3 rounded-lg border p-4"
    >
      <span>{{ $t('device.features.connectivity.loadFailed') }}</span>
      <VbenButton variant="outline" @click="handleLoadCommands">
        {{ $t('tb.common.retry') }}
      </VbenButton>
    </div>
    <div v-else-if="commands" class="space-y-5">
      <VbenSegmented
        v-if="protocolTabs.length > 1"
        v-model="protocol"
        :tabs="protocolTabs"
        :aria-label="$t('device.features.connectivity.protocol')"
        class="w-full"
      />
      <template v-if="protocolTabs.length">
        <div
          v-if="documentationOnly"
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-5"
        >
          <p class="text-muted-foreground text-sm">
            {{
              $t('device.features.connectionApi.commands.checkDocumentation')
            }}
          </p>
          <VbenButton
            as="a"
            variant="outline"
            :href="documentationUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('device.features.connectionApi.commands.documentation') }}
          </VbenButton>
        </div>
        <template v-else>
          <p class="text-muted-foreground text-sm">
            {{ $t('device.features.connectionApi.commands.useInstructions') }}
          </p>
          <Tabs
            v-model:active-key="operatingSystem"
            :animated="false"
            class="connectivity-os-tabs"
          >
            <TabPane v-for="tab in operatingSystemTabs" :key="tab.value">
              <template #tab>
                <span class="flex items-center gap-2">
                  <IconifyIcon
                    :icon="tab.icon"
                    class="size-5"
                    aria-hidden="true"
                  />
                  <span>{{ tab.label }}</span>
                </span>
              </template>
            </TabPane>
          </Tabs>
          <section
            v-if="
              operatingSystem !== 'docker' &&
              !(
                protocol === 'coap' && selectedCommand === 'Check documentation'
              )
            "
            class="space-y-4 rounded-lg border p-5"
          >
            <h3 class="font-semibold">
              {{ $t('device.features.connectionApi.commands.installTools') }}
            </h3>
            <pre
              v-if="installation.command"
              class="bg-muted/50 overflow-x-auto rounded-md border p-3 text-sm"
            ><code>{{ installation.command }}</code></pre>
            <p v-else class="text-muted-foreground text-sm leading-6">
              {{ installation.text }}
            </p>
            <VbenButton
              v-if="installation.url"
              as="a"
              :href="installation.url"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
            >
              {{ $t('device.features.connectionApi.commands.documentation') }}
            </VbenButton>
          </section>
          <section class="space-y-4 rounded-lg border p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="font-semibold">
                {{
                  $t('device.features.connectionApi.commands.executeCommand')
                }}
              </h3>
              <VbenSegmented
                v-if="securityTabs.length > 1"
                v-model="security"
                :tabs="securityTabs"
                class="w-44"
                :aria-label="$t('device.features.connectivity.security')"
              />
            </div>
            <div
              v-for="(command, index) in commandBlocks"
              :key="index"
              class="flex min-w-0 items-center gap-2"
            >
              <pre
                class="bg-muted/40 min-w-0 flex-1 overflow-x-auto rounded-md border pb-2 pt-1 px-4 text-sm leading-6 h-12 [scrollbar-width:thin]"
              ><code>{{ command }}</code></pre>
              <VbenTooltip side="top">
                <template #trigger>
                  <VbenButton
                    type="button"
                    class="h-12 w-12 shrink-0 rounded-md px-1 text-lg"
                    variant="outline"
                    :disabled="!command"
                    :aria-label="$t('device.features.connectivity.copyCommand')"
                    @click="
                      copyToClipboard(
                        command,
                        $t('device.features.credentials.copied'),
                      )
                    "
                  >
                    <IconifyIcon
                      icon="lucide:copy"
                      class="size-4"
                      aria-hidden="true"
                    />
                  </VbenButton>
                </template>
                {{ $t('device.features.connectivity.copyCommand') }}
              </VbenTooltip>
            </div>
            <div
              v-if="!commandBlocks.length"
              class="flex flex-wrap items-center justify-between gap-3"
            >
              <span class="text-muted-foreground text-sm">{{
                $t('device.features.connectionApi.commands.checkDocumentation')
              }}</span>
              <VbenButton
                as="a"
                :href="documentationUrl"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                {{ $t('device.features.connectionApi.commands.documentation') }}
              </VbenButton>
            </div>
          </section>
        </template>
      </template>
      <p v-else class="text-muted-foreground text-sm">
        {{ $t('device.features.connectionApi.commands.empty') }}
      </p>
    </div>
    <section
      v-if="!modalState.loading"
      class="mt-5 space-y-4 rounded-lg border p-5"
    >
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-semibold">
          {{ $t('device.features.connectivity.deviceState') }}
        </h3>
        <span
          class="rounded-full px-2.5 py-1 text-xs"
          :class="
            status && !telemetryFailed
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          "
        >
          {{
            telemetryFailed || status === undefined
              ? $t('device.features.connectivity.waiting')
              : status
                ? $t('device.fields.activeTrue')
                : $t('device.fields.activeFalse')
          }}
        </span>
      </div>
      <div
        v-if="telemetryFailed"
        role="alert"
        class="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <span class="text-muted-foreground">{{
          $t('device.features.connectivity.telemetryFailed')
        }}</span>
        <VbenButton
          variant="outline"
          size="sm"
          @click="handleSubscribeTelemetry"
        >
          {{ $t('tb.common.retry') }}
        </VbenButton>
      </div>
      <p class="text-muted-foreground text-sm">
        {{ $t('device.features.connectivity.latestTelemetry') }}
      </p>
      <div class="overflow-x-auto rounded-md border">
        <table class="w-full text-left text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-3 py-2 font-medium">
                {{ $t('device.features.connectivity.time') }}
              </th>
              <th class="px-3 py-2 font-medium">
                {{ $t('device.features.connectivity.key') }}
              </th>
              <th class="px-3 py-2 font-medium">
                {{ $t('device.features.connectivity.value') }}
              </th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            <tr v-for="row in latestTelemetry" :key="row.key" class="border-t">
              <td class="whitespace-nowrap px-3 py-2">
                {{ formatDateTime(row.lastUpdateTs) }}
              </td>
              <td class="break-all px-3 py-2">{{ row.key }}</td>
              <td class="max-w-sm break-all px-3 py-2">{{ row.value }}</td>
            </tr>
            <tr v-if="!latestTelemetry.length">
              <td
                colspan="3"
                class="text-muted-foreground px-3 py-7 text-center"
              >
                {{ $t('device.features.connectivity.noTelemetry') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </Modal>
</template>

<style scoped>
.connectivity-os-tabs :deep(.ant-tabs-nav-list) {
  width: 100%;
}

.connectivity-os-tabs :deep(.ant-tabs-tab) {
  flex: 1;
  justify-content: center;
  margin-left: 0;
}

.connectivity-os-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
</style>
