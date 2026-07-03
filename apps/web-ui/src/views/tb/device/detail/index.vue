<script lang="ts" setup>
import type { DeviceInfo } from '#/api/tb/device';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { alert, Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { getDeviceInfoById } from '#/api/tb/device';
import { $t } from '#/locales';
import { setCurrentRouteTitle } from '#/router/dynamic-title';

defineOptions({ name: 'DeviceDetail' });

const route = useRoute();
const router = useRouter();
const { setTabTitle, resetTabTitle } = useTabs();

const deviceId = route.params.deviceId as string;

/** 设备原始实体,后续各内容板块共用 */
const device = ref<DeviceInfo | null>(null);

const pageTitle = computed(
  () => device.value?.name || $t('tb.device.detail.title'),
);

onMounted(async () => {
  await load();
});

async function load() {
  try {
    device.value = await getDeviceInfoById(deviceId);
  } catch {
    alert({
      content: $t('tb.device.detail.notFound'),
      icon: 'error',
      title: $t('tb.common.systemTip'),
    });
  } finally {
    await setTabsTitle();
  }
}

async function setTabsTitle() {
  await setTabTitle(pageTitle.value);
  // 面包屑标题:经守卫写入 meta;直接输 URL 进入时会做一次同址导航刷新
  await setCurrentRouteTitle(router, route.fullPath, pageTitle.value);
}

onBeforeUnmount(() => {
  resetTabTitle();
});
</script>

<template>
  <Page auto-content-height>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon class="text-2xl mx-2" icon="lucide:server" />

        <span class="text-lg font-semibold">
          {{ pageTitle }}
        </span>
        <span
          v-if="device?.deviceProfileName"
          class="text-muted-foreground text-sm"
        >
          {{ device.deviceProfileName }}
        </span>
      </div>
    </template>
    <div
      class="bg-card border-border flex h-full items-center justify-center rounded-lg border border-dashed"
    >
      <div
        v-if="!device?.id?.id"
        class="text-muted-foreground flex flex-col items-center gap-2"
      >
        <IconifyIcon class="text-6xl" icon="lucide:server" />
        <span>
          {{ $t('tb.device.detail.notFound') }}
        </span>
      </div>
    </div>
  </Page>
</template>
