<script setup lang="ts">
import type { TbUserInfo } from '#/api/core/user';
import type { DashboardInfo } from '#/api/tb/dashboard';
import type { PageData } from '#/types/tb';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { useStorage } from '@vueuse/core';
import { Button, Pagination, Spin } from 'antdv-next';

import { getCustomerDashboards, getTenantDashboards } from '#/api/tb/dashboard';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import DashboardForm from '#/views/tb/dashboard/form.vue';

import HomeCard from './home-card.vue';

const userStore = useUserStore();
const current = ref(1);
const pageSize = 2;
const canManage = computed(() =>
  userStore.userRoles.includes(Authority.TENANT_ADMIN),
);
const favorites = useStorage<string[]>(
  `tb-home-favorites-${userStore.userInfo?.userId}`,
  [],
);
const page = ref<PageData<DashboardInfo>>();
const status = ref<'error' | 'loading' | 'ready'>('loading');
const [FormModal, formApi] = useVbenModal({
  connectedComponent: DashboardForm,
  destroyOnClose: true,
});
let requestId = 0;
async function loadDashboards() {
  const version = ++requestId;
  status.value = 'loading';
  try {
    const params = {
      page: current.value - 1,
      pageSize,
      sortProperty: 'createdTime',
      sortOrder: 'DESC' as const,
    };
    const customerId = (userStore.userInfo as TbUserInfo).tbUser.customerId?.id;
    let result: PageData<DashboardInfo>;
    if (canManage.value) result = await getTenantDashboards(params);
    else if (customerId)
      result = await getCustomerDashboards(customerId, params);
    else throw new Error('Missing customer');
    if (version === requestId) {
      page.value = result;
      status.value = 'ready';
    }
  } catch {
    if (version === requestId) status.value = 'error';
  }
}
function toggleFavorite(id: string) {
  favorites.value = favorites.value.includes(id)
    ? favorites.value.filter((item) => item !== id)
    : [...favorites.value, id];
}
watch(current, loadDashboards, { immediate: true });
onBeforeUnmount(() => requestId++);
</script>

<template>
  <HomeCard :title="$t('home.dashboards')" to="/dashboards" fill dense>
    <template #extra>
      <Button v-if="canManage" size="small" @click="formApi.setData({}).open()">
        <IconifyIcon icon="lucide:plus" class="mr-1 size-3.5" />
        {{ $t('home.addDashboard') }}
      </Button>
    </template>
    <Spin :spinning="status === 'loading'">
      <div
        v-if="status === 'error'"
        class="text-muted-foreground flex flex-col items-center justify-center gap-3 py-2 text-xs"
      >
        <span>{{ $t('home.loadFailed') }}</span>
        <Button @click="loadDashboards">{{ $t('home.retry') }}</Button>
      </div>
      <template v-else-if="page?.data.length">
        <div
          v-for="row in page.data"
          :key="row.id.id"
          class="group bg-muted/35 hover:bg-primary/5 mb-2 flex items-center gap-2 rounded-lg px-3 py-3 transition-colors"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="formApi.setData({ dashboardId: row.id.id }).open()"
          >
            <span
              class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
              <IconifyIcon icon="lucide:layout-dashboard" class="size-4" />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">
                {{ row.title }}
              </span>
              <span class="text-muted-foreground mt-1 block text-xs">
                {{
                  row.createdTime
                    ? formatDateTime(row.createdTime).split(' ')[0]
                    : '—'
                }}
              </span>
            </span>
          </button>
          <button
            type="button"
            class="shrink-0 p-1"
            :aria-label="
              $t(
                favorites.includes(row.id.id)
                  ? 'home.unfavorite'
                  : 'home.favorite',
              )
            "
            :aria-pressed="favorites.includes(row.id.id)"
            @click="toggleFavorite(row.id.id)"
          >
            <IconifyIcon
              :icon="
                favorites.includes(row.id.id)
                  ? 'ant-design:star-filled'
                  : 'lucide:star'
              "
              class="size-4"
              :class="
                favorites.includes(row.id.id)
                  ? 'text-amber-500'
                  : 'text-muted-foreground'
              "
            />
          </button>
        </div>
      </template>
      <p
        v-else-if="status === 'ready'"
        class="text-muted-foreground py-2 text-center text-sm"
      >
        {{ $t('home.noDashboards') }}
      </p>
    </Spin>
    <Pagination
      v-if="page && page.totalElements > pageSize && status !== 'error'"
      v-model:current="current"
      :page-size="pageSize"
      :total="page.totalElements"
      :show-size-changer="false"
      simple
      size="small"
      class="mt-auto self-end pt-1"
    />
    <FormModal @success="loadDashboards" />
  </HomeCard>
</template>
