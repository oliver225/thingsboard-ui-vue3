<script setup lang="ts">
import { watch } from 'vue';

import { Segmented } from 'antdv-next';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  title: string;
  options: { disabled?: boolean; label: string; value: string }[];
  defaultValue?: string;
}>();
const value = defineModel<string>();

watch(
  [() => value.value, () => props.defaultValue, () => props.options],
  ([current]) => {
    // 默认值同步到表单，但不覆盖已有配置或用户选择。
    if (current !== undefined && current !== null && current !== '') return;
    const fallback =
      props.options.find((option) => option.value === props.defaultValue) ??
      props.options[0];
    if (fallback) value.value = fallback.value;
  },
  { immediate: true },
);
</script>

<template>
  <div
    class="segmented-setting-row flex w-full min-w-0 flex-col gap-4 rounded-md px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    :class="$attrs.class"
  >
    <span class="min-w-0 text-sm font-medium leading-5">{{ title }}</span>
    <Segmented
      v-bind="{ ...$attrs, class: undefined }"
      v-model:value="value"
      :options="options"
      :aria-label="title"
      shape="round"
      class="self-end sm:shrink-0"
    />
  </div>
</template>

<style scoped>
.segmented-setting-row {
  background-color: hsl(var(--muted) / 40%);
  border: 1px solid hsl(var(--border) / 80%);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.segmented-setting-row:hover {
  background-color: hsl(var(--muted) / 75%);
  border-color: hsl(var(--primary) / 35%);
}

.segmented-setting-row:active {
  background-color: hsl(var(--primary) / 16%);
  border-color: hsl(var(--primary) / 65%);
}

.segmented-setting-row:has(:focus-visible) {
  border-color: hsl(var(--primary) / 60%);
  box-shadow: 0 0 0 2px hsl(var(--primary) / 15%);
}

@media (prefers-reduced-motion: reduce) {
  .segmented-setting-row {
    transition: none;
  }
}
</style>
