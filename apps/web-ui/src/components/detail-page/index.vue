<script setup lang="ts">
import type { DetailAction, DetailPageProps } from './types';

import { computed, watchEffect } from 'vue';

import { useAccess } from '@vben/access';
import { Page, VbenButton, VbenIconButton, VbenLoading } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@vben-core/shadcn-ui';

import { tabPresets } from './tabs';

defineOptions({ name: 'DetailPage' });

const props = withDefaults(defineProps<DetailPageProps>(), {
  actionsDisabled: false,
  eventTypes: () => ['ERROR', 'LC_EVENT', 'STATS'],
  secondaryActions: () => [],
  showBack: true,
  state: 'ready',
  tabs: () => [],
  tags: () => [],
});
const emit = defineEmits<{
  action: [key: string];
  back: [];
  retry: [];
}>();
const activeTab = defineModel<string>('activeTab', { default: '' });
const { hasAccessByRoles } = useAccess();

const visibleTags = computed(() =>
  props.tags.filter(({ value }) =>
    typeof value === 'string'
      ? value.trim().length > 0
      : value !== null && value !== undefined,
  ),
);
const visibleSecondaryActions = computed(() =>
  props.secondaryActions.filter((action) => isVisible(action)),
);
const visiblePrimaryActions = computed(
  () => props.primaryAction?.items.filter((action) => isVisible(action)) ?? [],
);
const visibleTabs = computed(() =>
  props.tabs
    .map((tab) => {
      const option = typeof tab === 'string' ? { key: tab } : tab;
      return {
        ...option,
        ...tabPresets[option.key],
        label: $t(`detail-page.tabs.${option.key}`),
      };
    })
    .filter((tab) => isVisible(tab)),
);
const selectedTab = computed(() =>
  visibleTabs.value.find((tab) => tab.key === activeTab.value && !tab.disabled),
);
// 当前页签被隐藏或禁用时，选中第一个可用页签。
watchEffect(() => {
  if (!selectedTab.value) {
    activeTab.value = visibleTabs.value.find((tab) => !tab.disabled)?.key ?? '';
  }
});

function isVisible(item: { auth?: string[]; visible?: boolean }) {
  return (
    item.visible !== false &&
    (item.auth === undefined || hasAccessByRoles(item.auth))
  );
}

function isActionDisabled(action?: DetailAction) {
  return (
    props.state === 'loading' ||
    props.actionsDisabled ||
    !!action?.disabled ||
    !!action?.loading
  );
}

function handleAction(action: DetailAction) {
  if (!isVisible(action) || isActionDisabled(action)) return;
  emit('action', action.key);
}
</script>

<template>
  <Page
    auto-content-height
    content-class="relative"
    :aria-busy="state === 'loading'"
  >
    <slot name="modals"></slot>
    <VbenLoading
      v-if="state === 'loading'"
      spinning
      role="status"
      :text="$t('detail-page.loading')"
    />
    <div
      v-if="state === 'error'"
      role="alert"
      class="flex min-h-96 flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8 text-center"
    >
      <IconifyIcon
        icon="lucide:server-off"
        class="size-10 text-muted-foreground"
        aria-hidden="true"
      />
      <h1 class="text-lg font-semibold">
        {{ $t('detail-page.loadFailed') }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ errorMessage || $t('detail-page.retryHint') }}
      </p>
      <div class="flex gap-3">
        <VbenButton v-if="showBack" variant="outline" @click="emit('back')">
          {{ $t('common.back') }}
        </VbenButton>
        <VbenButton @click="emit('retry')">
          {{ $t('detail-page.retry') }}
        </VbenButton>
      </div>
    </div>
    <Tabs
      v-else-if="state === 'ready' || entityId"
      v-model="activeTab"
      class="relative flex h-full min-h-0 w-full min-w-0 flex-col gap-5"
    >
      <!-- 标题、状态、标签和操作 -->
      <section
        class="min-w-0 shrink-0 overflow-hidden rounded-xl border bg-card text-card-foreground"
      >
        <header
          class="flex flex-wrap items-start justify-between gap-5 p-4 md:p-6"
        >
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <VbenIconButton
              v-if="showBack"
              :tooltip="$t('common.back')"
              :aria-label="$t('common.back')"
              class="mt-1 shrink-0 border bg-card"
              @click="emit('back')"
            >
              <IconifyIcon
                icon="lucide:arrow-left"
                class="size-4"
                aria-hidden="true"
              />
              <span class="sr-only">{{ $t('common.back') }}</span>
            </VbenIconButton>
            <div class="min-w-0 space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="break-all text-2xl font-semibold tracking-tight">
                  {{ title }}
                </h1>
                <Badge
                  v-if="status?.text"
                  :variant="status.variant ?? 'secondary'"
                  class="gap-1.5 rounded-full px-2.5 py-1"
                >
                  <span
                    class="size-1.5 rounded-full bg-current"
                    aria-hidden="true"
                  ></span>
                  {{ status.text }}
                </Badge>
                <span
                  v-if="pageTitle"
                  class="shrink-0 text-sm text-muted-foreground"
                >
                  {{ pageTitle }}
                </span>
              </div>
              <div
                v-if="visibleTags.length"
                class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
              >
                <span
                  v-for="tag in visibleTags"
                  :key="tag.key"
                  class="inline-flex min-w-0 items-center gap-2"
                >
                  <IconifyIcon
                    v-if="tag.icon"
                    :icon="tag.icon"
                    class="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span class="break-all">
                    <template v-if="tag.label">{{ tag.label }}：</template>
                    <span class="text-foreground">{{ tag.value }}</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div
            v-if="
              visibleSecondaryActions.length || visiblePrimaryActions.length
            "
            class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0"
          >
            <slot
              v-for="action in visibleSecondaryActions"
              :key="action.key"
              :name="`action-${action.key}`"
              :action="action"
              :disabled="isActionDisabled(action)"
            >
              <VbenButton
                :variant="action.danger ? 'destructive' : 'outline'"
                class="gap-2"
                :disabled="isActionDisabled(action)"
                :loading="action.loading"
                @click="handleAction(action)"
              >
                <IconifyIcon
                  v-if="action.icon && !action.loading"
                  :icon="action.icon"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ action.label }}
              </VbenButton>
            </slot>
            <DropdownMenu v-if="primaryAction && visiblePrimaryActions.length">
              <DropdownMenuTrigger as-child>
                <VbenButton :disabled="isActionDisabled()" class="gap-2">
                  <IconifyIcon
                    v-if="primaryAction.icon"
                    :icon="primaryAction.icon"
                    class="size-4"
                    aria-hidden="true"
                  />
                  {{ primaryAction.label }}
                  <IconifyIcon
                    icon="lucide:chevron-down"
                    class="size-4"
                    aria-hidden="true"
                  />
                </VbenButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-52">
                <template
                  v-for="(action, index) in visiblePrimaryActions"
                  :key="action.key"
                >
                  <DropdownMenuSeparator
                    v-if="
                      index > 0 &&
                      action.group !== visiblePrimaryActions[index - 1]?.group
                    "
                  />
                  <DropdownMenuItem
                    :variant="action.danger ? 'destructive' : 'default'"
                    :disabled="isActionDisabled(action)"
                    @select="handleAction(action)"
                  >
                    <IconifyIcon
                      v-if="action.loading"
                      icon="lucide:loader-circle"
                      class="animate-spin"
                      aria-hidden="true"
                    />
                    <IconifyIcon
                      v-else-if="action.icon"
                      :icon="action.icon"
                      aria-hidden="true"
                    />
                    {{ action.label }}
                  </DropdownMenuItem>
                </template>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div
          v-if="visibleTabs.length"
          class="overflow-x-auto border-t px-4 md:px-6"
        >
          <TabsList
            class="h-12 w-max justify-start gap-1 rounded-none bg-transparent p-0 text-muted-foreground"
            :aria-label="title || $t('detail-page.details')"
          >
            <TabsTrigger
              v-for="tab in visibleTabs"
              :key="tab.key"
              :value="tab.key"
              :disabled="tab.disabled"
              class="h-full flex-none gap-2 rounded-none border-0 border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
            >
              <IconifyIcon :icon="tab.icon" class="size-4" aria-hidden="true" />
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </div>
      </section>
      <!-- 当前页签内容；异步组件由 Suspense 显示加载占位 -->
      <TabsContent
        v-if="selectedTab"
        :key="selectedTab.key"
        :value="selectedTab.key"
        class="relative m-0 flex min-h-0 min-w-0 flex-1 flex-col gap-5"
        :class="selectedTab.key === 'details' && 'overflow-y-auto'"
      >
        <slot :name="`tab-${selectedTab.key}`">
          <Suspense
            v-if="entityId && selectedTab.component"
            :key="`${entityId.entityType}:${entityId.id}:${selectedTab.key}`"
          >
            <component
              :is="selectedTab.component"
              v-bind="
                selectedTab.key === 'apiKeys'
                  ? { userId: entityId.id }
                  : {
                      entityId,
                      ...(selectedTab.key === 'events' ? { eventTypes } : {}),
                    }
              "
            />
            <template #fallback>
              <VbenLoading
                spinning
                role="status"
                :text="$t('detail-page.loading')"
              />
            </template>
          </Suspense>
        </slot>
      </TabsContent>
      <slot v-else-if="tabs.length === 0"></slot>
    </Tabs>
  </Page>
</template>
