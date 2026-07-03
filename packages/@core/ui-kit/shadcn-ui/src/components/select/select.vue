<script lang="ts" setup>
import { computed } from 'vue';

import { CircleX } from '@vben-core/icons';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui';

interface Props {
  allowClear?: boolean;
  class?: any;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: false,
  options: () => [],
});

const modelValue = defineModel<string | undefined>();

const emptyValue = computed(() => {
  let value = '__VBEN_SELECT_EMPTY_VALUE__';
  const values = new Set(props.options.map((item) => item.value));
  while (values.has(value)) {
    value = `_${value}`;
  }
  return value;
});

const selectValue = computed({
  get() {
    if (modelValue.value === undefined) {
      return '';
    }
    return modelValue.value === '' ? emptyValue.value : modelValue.value;
  },
  set(value) {
    if (value === '') {
      modelValue.value = undefined;
      return;
    }
    modelValue.value = value === emptyValue.value ? '' : value;
  },
});

const selectOptions = computed(() =>
  props.options.map((item) => ({
    ...item,
    value: item.value === '' ? emptyValue.value : item.value,
  })),
);

const showClear = computed(() => props.allowClear && selectValue.value !== '');

function handleClear() {
  modelValue.value = undefined;
}
</script>
<template>
  <Select v-model="selectValue">
    <div class="relative w-full">
      <SelectTrigger
        :class="[props.class, showClear ? 'pr-10' : '']"
        class="flex w-full items-center"
      >
        <SelectValue class="flex-auto text-left" :placeholder="placeholder" />
      </SelectTrigger>
      <button
        v-if="showClear"
        aria-label="Clear selection"
        data-clear-button
        type="button"
        class="absolute top-1/2 right-4 z-10 -translate-y-1/2 cursor-pointer opacity-50 hover:opacity-100"
        @click.prevent.stop="handleClear"
        @mousedown.prevent.stop
        @pointerdown.prevent.stop
      >
        <CircleX class="size-4" />
      </button>
    </div>
    <SelectContent>
      <template v-for="item in selectOptions" :key="item.value">
        <SelectItem :value="item.value"> {{ item.label }} </SelectItem>
      </template>
    </SelectContent>
  </Select>
</template>

<style lang="scss" scoped>
button[role='combobox'][data-placeholder] {
  color: hsl(var(--muted-foreground));
}

button {
  --ring: var(--primary);
}
</style>
