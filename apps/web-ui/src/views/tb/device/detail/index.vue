<script lang="ts" setup>
import type { DeviceCredentials, DeviceInfo } from '#/api/tb/device';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import {
  alert,
  confirm,
  Page,
  useVbenModal,
  VbenButton,
} from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  Descriptions,
  DescriptionsItem,
  message,
  TabPane,
  Tabs,
  Tag,
} from 'antdv-next';

import {
  deleteDevice,
  getDeviceCredentials,
  getDeviceInfoById,
  makeDevicePublic,
  unassignDeviceFromCustomer,
} from '#/api/tb/device';
import { NULL_UUID } from '#/constants';
import { Authority, DeviceCredentialsType } from '#/enums';
import { $t } from '#/locales';
import { setCurrentRouteTitle } from '#/router/dynamic-title';
import { copyToClipboard } from '#/utils/common';

import DeviceAssignModal from '../assign-modal.vue';
import DeviceCredentialsModal from '../credentials-modal.vue';
import DeviceForm from '../form.vue';

defineOptions({ name: 'DeviceDetail' });

const route = useRoute();
const router = useRouter();
const { hasAccessByRoles } = useAccess();
const { setTabTitle, resetTabTitle } = useTabs();

const deviceId = route.params.deviceId as string;

const activeTab = ref('details');
const credentials = ref<DeviceCredentials | null>(null);
const device = ref<DeviceInfo | null>(null);
const loading = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});
const [CredentialsModal, credentialsModalApi] = useVbenModal({
  connectedComponent: DeviceCredentialsModal,
  destroyOnClose: true,
});
const [AssignModal, assignModalApi] = useVbenModal({
  connectedComponent: DeviceAssignModal,
  destroyOnClose: true,
});

const pageTitle = computed(
  () => device.value?.name || $t('tb.device.detail.title'),
);

const deviceDetailTabs = [
  { key: 'details', label: $t('tb.device.detail.tabs.details') },
  { key: 'attributes', label: $t('tb.device.detail.tabs.attributes') },
  { key: 'telemetry', label: $t('tb.device.detail.tabs.telemetry') },
  { key: 'connectionApi', label: $t('tb.device.detail.tabs.connectionApi') },
  { key: 'rpc', label: $t('tb.device.detail.tabs.rpc') },
  {
    key: 'calculatedFields',
    label: $t('tb.device.detail.tabs.calculatedFields'),
  },
  { key: 'alarmRules', label: $t('tb.device.detail.tabs.alarmRules') },
  { key: 'alarms', label: $t('tb.device.detail.tabs.alarms') },
  { key: 'events', label: $t('tb.device.detail.tabs.events') },
  { key: 'relations', label: $t('tb.device.detail.tabs.relations') },
  { key: 'auditLogs', label: $t('tb.device.detail.tabs.auditLogs') },
];
onMounted(async () => {
  await load();
});

async function load() {
  loading.value = true;
  try {
    device.value = await getDeviceInfoById(deviceId);
    credentials.value = await getDeviceCredentials(deviceId);
  } catch {
    device.value = null;
    credentials.value = null;
    alert({
      content: $t('tb.device.detail.notFound'),
      icon: 'error',
      title: $t('tb.common.systemTip'),
    });
  } finally {
    loading.value = false;
    await setTabsTitle();
  }
}

async function setTabsTitle() {
  await setTabTitle(pageTitle.value);
  await setCurrentRouteTitle(router, route.fullPath, pageTitle.value);
}

function onCredentials() {
  credentialsModalApi
    .setData({
      deviceId,
      readonly: hasAccessByRoles([Authority.CUSTOMER_USER]),
    })
    .open();
}

function onEdit() {
  formModalApi.setData({ deviceId }).open();
}

function onAssign() {
  if (!device.value) return;
  assignModalApi.setData({ devices: [device.value] }).open();
}

async function copyDeviceId() {
  await copyToClipboard(deviceId, $t('tb.device.detail.copy.deviceIdCopied'));
}

async function copyAccessToken() {
  const accessToken =
    credentials.value?.credentialsType === DeviceCredentialsType.ACCESS_TOKEN
      ? credentials.value.credentialsId
      : credentials.value?.credentialsValue;

  await copyToClipboard(
    accessToken || '',
    $t('tb.device.detail.copy.accessTokenCopied'),
  );
}

async function makePublicByDevice() {
  try {
    await makeDevicePublic(deviceId);
    message.success($t('tb.device.actions.makePublicSuccess'));
    await load();
  } catch {
    return false;
  }
}

function confirmMakePublic() {
  if (!device.value) return;
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return;
      return makePublicByDevice();
    },
    content: $t('tb.device.makePublic.content', { name: device.value.name }),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.device.makePublic.title'),
  }).catch(() => {});
}

async function unassignCurrentDevice() {
  try {
    await unassignDeviceFromCustomer(deviceId);
    message.success($t('tb.device.actions.unassignSuccess'));
    await load();
  } catch {
    return false;
  }
}

function confirmUnassign() {
  if (!device.value) return;
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return;
      return unassignCurrentDevice();
    },
    content: $t('tb.device.unassign.content', {
      customer: device.value.customerTitle,
      name: device.value.name,
    }),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.device.unassign.title'),
  }).catch(() => {});
}

function confirmMakePrivate() {
  if (!device.value) return;
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return;
      return unassignCurrentDevice();
    },
    content: $t('tb.device.makePrivate.content', { name: device.value.name }),
    contentMasking: true,
    icon: 'warning',
    title: $t('tb.device.makePrivate.title'),
  }).catch(() => {});
}

async function deleteCurrentDevice() {
  try {
    await deleteDevice(deviceId);
    message.success($t('tb.common.deleteSuccess'));
    await router.push({ name: 'DeviceList' });
  } catch {
    return false;
  }
}

function confirmDelete() {
  if (!device.value) return;
  confirm({
    async beforeClose({ isConfirm }) {
      if (!isConfirm) return;
      return deleteCurrentDevice();
    },
    confirmButtonProps: { danger: true, variant: 'destructive' },
    content: $t('tb.device.delete.content'),
    contentMasking: true,
    icon: 'error',
    title: $t('tb.device.delete.title'),
  }).catch(() => {});
}

async function onModalSuccess() {
  await load();
}

onBeforeUnmount(() => {
  resetTabTitle();
});
</script>

<template>
  <Page auto-content-height content-class="box-border min-h-0 ">
    <FormModal @success="onModalSuccess" />
    <CredentialsModal @success="onModalSuccess" />
    <AssignModal @success="onModalSuccess" />

    <template #title>
      <div class="flex min-w-0 flex-col gap-4 py-1">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <IconifyIcon class="text-primary text-2xl" icon="lucide:server" />
          <span class="min-w-0 max-w-[48rem] truncate text-lg font-semibold">
            {{ pageTitle }}
          </span>
          <Tag
            :class="{ invisible: !device }"
            :color="device?.active ? 'success' : 'error'"
          >
            {{
              device?.active
                ? $t('tb.device.fields.activeTrue')
                : $t('tb.device.fields.activeFalse')
            }}
          </Tag>
        </div>

        <div class="flex min-h-8 flex-wrap items-center gap-2">
          <VbenButton
            variant="default"
            icon="lucide:key-round"
            :disabled="!device"
            @click="onCredentials"
          >
            {{ $t('tb.device.credentials.action') }}
          </VbenButton>

          <VbenButton
            v-show="
              hasAccessByRoles([Authority.TENANT_ADMIN]) &&
              (!device ||
                !device.customerId?.id ||
                device.customerId.id === NULL_UUID)
            "
            variant="default"
            icon="lucide:share-2"
            :class="{ invisible: !device }"
            :disabled="!device"
            @click="confirmMakePublic"
          >
            {{ $t('tb.device.actions.makePublic') }}
          </VbenButton>
          <VbenButton
            v-if="
              hasAccessByRoles([Authority.TENANT_ADMIN]) &&
              (!device ||
                !device.customerId?.id ||
                device.customerId.id === NULL_UUID)
            "
            variant="default"
            icon="lucide:user-plus"
            :disabled="!device"
            @click="onAssign"
          >
            {{ $t('tb.device.actions.assign') }}
          </VbenButton>
          <VbenButton
            v-if="
              hasAccessByRoles([Authority.TENANT_ADMIN]) &&
              device?.customerId?.id &&
              device.customerId.id !== NULL_UUID &&
              !device.customerIsPublic
            "
            variant="default"
            icon="lucide:user-minus"
            @click="confirmUnassign"
          >
            {{ $t('tb.device.actions.unassign') }}
          </VbenButton>
          <VbenButton
            v-if="
              hasAccessByRoles([Authority.TENANT_ADMIN]) &&
              device?.customerId?.id &&
              device.customerId.id !== NULL_UUID &&
              device.customerIsPublic
            "
            variant="default"
            icon="lucide:lock"
            @click="confirmMakePrivate"
          >
            {{ $t('tb.device.actions.makePrivate') }}
          </VbenButton>
          <VbenButton
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            variant="default"
            icon="lucide:square-pen"
            :disabled="!device"
            @click="onEdit"
          >
            {{ $t('tb.common.edit') }}
          </VbenButton>
          <VbenButton
            v-if="hasAccessByRoles([Authority.TENANT_ADMIN])"
            variant="destructive"
            icon="lucide:trash-2"
            :disabled="!device"
            @click="confirmDelete"
          >
            {{ $t('tb.common.delete') }}
          </VbenButton>
          <VbenButton
            variant="outline"
            icon="lucide:copy"
            :disabled="!device"
            @click="copyDeviceId"
          >
            {{ $t('tb.device.detail.copy.deviceId') }}
          </VbenButton>
          <VbenButton
            variant="outline"
            icon="lucide:copy"
            :disabled="!device"
            @click="copyAccessToken"
          >
            {{ $t('tb.device.detail.copy.accessToken') }}
          </VbenButton>
        </div>
      </div>
    </template>

    <div
      v-if="!device?.id?.id && !loading"
      class="bg-card border-border flex h-full items-center justify-center rounded-lg border border-dashed"
    >
      <div class="text-muted-foreground flex flex-col items-center gap-2">
        <IconifyIcon class="text-6xl" icon="lucide:server" />
        <span>
          {{ $t('tb.device.detail.notFound') }}
        </span>
      </div>
    </div>

    <div
      v-else
      v-loading="loading"
      class="bg-card h-full min-h-0 rounded-lg px-4"
    >
      <Tabs v-model:active-key="activeTab">
        <TabPane
          v-for="tab in deviceDetailTabs"
          :key="tab.key"
          :tab="tab.label"
        >
          <div v-if="tab.key === 'details'" class="h-full overflow-auto">
            <Descriptions
              bordered
              :column="{ lg: 2, md: 2, sm: 1, xl: 2, xs: 1, xxl: 2 }"
            >
              <DescriptionsItem :label="$t('tb.device.fields.name')" :col="2">
                <span class="break-words">
                  {{ device?.name || '-' }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('tb.device.fields.label')">
                <span class="break-words">
                  {{ device?.label || '-' }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('tb.device.fields.active')">
                <Tag
                  :class="{ invisible: !device }"
                  :color="device?.active ? 'success' : 'error'"
                >
                  {{
                    device?.active
                      ? $t('tb.device.fields.activeTrue')
                      : $t('tb.device.fields.activeFalse')
                  }}
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('tb.device.fields.deviceProfile')">
                <span class="break-words">
                  {{ device?.deviceProfileName || '-' }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('tb.device.fields.customer')">
                <span class="break-words">
                  {{ device?.customerTitle || '-' }}
                </span>
              </DescriptionsItem>

              <DescriptionsItem :label="$t('tb.common.createdTime')">
                <span class="break-words">
                  {{ formatDateTime(device?.createdTime) || '-' }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('tb.device.fields.isGateway')">
                <span class="break-words">
                  {{
                    device?.additionalInfo?.gateway
                      ? $t('tb.common.yes')
                      : $t('tb.common.no')
                  }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem
                :label="$t('tb.device.fields.overwriteActivityTime')"
              >
                <span class="break-words">
                  {{
                    device?.additionalInfo?.overwriteActivityTime
                      ? $t('tb.common.yes')
                      : $t('tb.common.no')
                  }}
                </span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('tb.device.fields.description')">
                <span class="break-words">
                  {{ device?.additionalInfo?.description || '-' }}
                </span>
              </DescriptionsItem>
            </Descriptions>
          </div>
          <div v-else class="h-full overflow-auto"></div>
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
