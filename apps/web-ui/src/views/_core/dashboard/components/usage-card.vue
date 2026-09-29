<script setup lang="ts">
import type { Usage } from '#/api/tb/usage';

import { computed, onActivated, onMounted, ref } from 'vue';

import { VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Flex, Progress, Spin } from 'antdv-next';

import { getUsage } from '#/api/tb/usage';
import { $t } from '#/locales';

import HomeCard from './home-card.vue';

const selected = ref('entities');
const usage = ref<Usage>();
const status = ref<'error' | 'idle' | 'loading' | 'ready'>('idle');
const groups: Record<
  string,
  { label: string; count: keyof Usage; limit: keyof Usage }[]
> = {
  entities: [
    { label: 'home.device', count: 'devices', limit: 'maxDevices' },
    { label: 'home.assets', count: 'assets', limit: 'maxAssets' },
    { label: 'home.users', count: 'users', limit: 'maxUsers' },
    { label: 'home.dashboards', count: 'dashboards', limit: 'maxDashboards' },
    { label: 'home.customers', count: 'customers', limit: 'maxCustomers' },
  ],
  api: [
    {
      label: 'home.messages',
      count: 'transportMessages',
      limit: 'maxTransportMessages',
    },
    {
      label: 'home.usage.jsExecutions',
      count: 'jsExecutions',
      limit: 'maxJsExecutions',
    },
    { label: 'home.usage.emails', count: 'emails', limit: 'maxEmails' },
    { label: 'home.features.sms', count: 'sms', limit: 'maxSms' },
    { label: 'home.alarm', count: 'alarms', limit: 'maxAlarms' },
  ],
};
function getUsageValue(key: keyof Usage) {
  const value = usage.value?.[key];
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}
function formatAmount(value: number | undefined) {
  return value === undefined ? '—' : value.toLocaleString();
}
const rows = computed(() =>
  (groups[selected.value] ?? []).map((item) => {
    const count = getUsageValue(item.count);
    const limit = getUsageValue(item.limit);
    return {
      ...item,
      amount: `${formatAmount(count)} / ${limit === 0 ? '∞' : formatAmount(limit)}`,
      percent:
        count !== undefined && limit !== undefined && limit > 0
          ? Math.min(100, (count / limit) * 100)
          : undefined,
    };
  }),
);
async function loadUsage() {
  if (status.value === 'loading') return;
  status.value = 'loading';
  try {
    usage.value = await getUsage();
    status.value = 'ready';
  } catch {
    usage.value = undefined;
    status.value = 'error';
  }
}
onMounted(loadUsage);
onActivated(loadUsage);
</script>

<template>
  <HomeCard
    class="tenant-usage"
    :title="$t('home.usage.title')"
    to="/usage"
    fill
    dense
  >
    <template #title>
      <VbenSegmented
        v-model="selected"
        :aria-label="$t('home.usage.category')"
        :tabs="[
          { label: $t('home.usage.entities'), value: 'entities' },
          { label: $t('home.usage.api'), value: 'api' },
        ]"
      />
    </template>
    <template #extra>
      <Button
        type="text"
        size="small"
        :loading="status === 'loading'"
        :aria-label="$t('home.retry')"
        @click="loadUsage"
      >
        <IconifyIcon icon="lucide:refresh-cw" class="size-4" />
      </Button>
    </template>
    <div
      v-if="status === 'error'"
      class="text-muted-foreground flex flex-1 items-center justify-center text-sm"
    >
      {{ $t('home.loadFailed') }}
    </div>
    <Spin v-else :spinning="status === 'loading'">
      <Flex vertical :gap="10" class="pt-2">
        <div v-for="row in rows" :key="row.count" class="text-sm">
          <Flex align="center" justify="space-between" :gap="8" class="mb-1">
            <span
              class="text-muted-foreground min-w-0 flex-1 truncate"
              :title="$t(row.label)"
            >
              {{ $t(row.label) }}
            </span>
            <span class="shrink-0 text-xs font-medium tabular-nums">
              {{ row.amount }}
            </span>
          </Flex>
          <Progress
            v-if="row.percent !== undefined"
            :percent="row.percent"
            :show-info="false"
            size="small"
            class="!m-0 !flex !leading-none"
          />
          <div v-else class="bg-muted h-1.5 rounded-full"></div>
        </div>
      </Flex>
    </Spin>
  </HomeCard>
</template>
