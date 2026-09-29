<script setup lang="ts">
import type { SegmentedItem } from './types';

import { computed } from 'vue';

import { TabsTrigger } from 'reka-ui';

import { Tabs, TabsContent, TabsList } from '../../ui';
import { VbenIcon } from '../icon';
import { VbenTooltip } from '../tooltip';
import TabsIndicator from './tabs-indicator.vue';

interface Props {
  defaultValue?: string;
  tabs?: SegmentedItem[];
  variant?: 'default' | 'navigation';
}

const props = withDefaults(defineProps<Props>(), {
  defaultValue: '',
  tabs: () => [],
  variant: 'default',
});

const activeTab = defineModel<string>();

const getDefaultValue = computed(() => {
  return props.defaultValue || props.tabs[0]?.value;
});

const tabsStyle = computed(() => {
  return {
    'grid-template-columns': `repeat(${props.tabs.length}, minmax(0, 1fr))`,
  };
});

function activeClass(tab: string): string[] {
  return tab === activeTab.value
    ? [
        props.variant === 'navigation' ? 'font-semibold' : 'font-bold!',
        'text-primary',
      ]
    : [];
}
</script>

<template>
  <Tabs
    v-model="activeTab"
    :default-value="getDefaultValue"
    :class="{ 'segmented-navigation': variant === 'navigation' }"
  >
    <TabsList
      :style="tabsStyle"
      class="relative grid w-full"
      :class="
        variant === 'default' ? 'bg-accent outline-heavy! outline-2!' : ''
      "
    >
      <TabsIndicator
        data-slot="segmented-indicator"
        :style="{ width: 'var(--reka-tabs-indicator-size)' }"
      />
      <template v-for="tab in tabs" :key="tab.value">
        <TabsTrigger
          :value="tab.value"
          :class="activeClass(tab.value)"
          class="hover:text-primary z-20 size-full inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50"
        >
          <VbenTooltip :delay-duration="300" side="bottom">
            <template #trigger>
              <div class="flex min-w-0 items-center justify-center gap-2 px-1">
                <VbenIcon
                  v-if="tab.icon"
                  :icon="tab.icon"
                  class="size-4 shrink-0"
                  aria-hidden="true"
                />
                <span class="truncate">{{ tab.label }}</span>
              </div>
            </template>
            {{ tab.label }}
          </VbenTooltip>
        </TabsTrigger>
      </template>
    </TabsList>
    <template v-for="tab in tabs" :key="tab.value">
      <TabsContent v-if="$slots[tab.value]" :value="tab.value">
        <slot :name="tab.value"></slot>
      </TabsContent>
    </template>
  </Tabs>
</template>

<style scoped>
.segmented-navigation {
  gap: 0;
  width: fit-content;
  max-width: 100%;
}

.segmented-navigation :deep([data-slot='tabs-list']) {
  height: 42px;
  padding: 3px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border) / 60%);
  border-radius: 10px;
}

.segmented-navigation :deep([role='tab']) {
  min-width: 88px;
  padding-inline: 18px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
  border-radius: 7px;
  transition: color 150ms ease;
}

.segmented-navigation :deep([role='tab'][data-state='active']) {
  font-weight: 600;
  color: hsl(var(--primary));
}

.segmented-navigation :deep([role='tab']:hover) {
  color: hsl(var(--primary));
}

.segmented-navigation :deep([role='tab']:focus-visible) {
  outline: 2px solid hsl(var(--primary) / 50%);
  outline-offset: 2px;
}

.segmented-navigation :deep([data-slot='segmented-indicator']) {
  top: 3px;
  bottom: 3px;
  height: auto;
  padding: 0;
}

.segmented-navigation :deep([data-slot='segmented-indicator'] > div) {
  background: hsl(var(--primary) / 10%);
  border-radius: 7px;
}
</style>
