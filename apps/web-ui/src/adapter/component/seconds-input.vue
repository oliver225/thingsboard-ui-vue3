<script setup lang="ts">
import type { InputNumberRef } from 'antdv-next';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import InputNumber from 'antdv-next/dist/input-number/index';
import Select from 'antdv-next/dist/select/index';

export interface SecondsInputProps {
  disabled?: boolean;
  /** 最小值、最大值和绑定值均以秒为单位。 */
  max?: number;
  min?: number;
  modelValue?: null | number;
  placeholder?: string;
  readonly?: boolean;
  size?: 'large' | 'middle' | 'small';
  status?: 'error' | 'warning';
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SecondsInputProps>(), {
  max: Number.MAX_SAFE_INTEGER,
  min: 0,
  modelValue: undefined,
  placeholder: undefined,
  size: undefined,
  status: undefined,
});
const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [value: null | number];
  focus: [event: FocusEvent];
  'update:modelValue': [value: null | number];
}>();

const units = [
  { name: 'seconds', seconds: 1 },
  { name: 'minutes', seconds: 60 },
  { name: 'hours', seconds: 3600 },
  { name: 'days', seconds: 86_400 },
];
const initialSeconds = props.modelValue ?? 0;
const unit = ref(
  initialSeconds > 0
    ? (units.findLast(({ seconds }) => initialSeconds % seconds === 0)
        ?.seconds ?? 1)
    : 1,
);
const inputRef = ref<InputNumberRef>();
const amount = computed(() =>
  props.modelValue === null || props.modelValue === undefined
    ? null
    : props.modelValue / unit.value,
);
const maxSeconds = computed(() => Math.min(props.max, Number.MAX_SAFE_INTEGER));
const minSeconds = computed(() => Math.max(props.min, 0));
const options = computed(() =>
  units.map(({ name, seconds }) => ({
    label: $t(`tb.components.secondsInput.options.${name}`),
    value: seconds,
    disabled: amount.value !== null && !isValidSeconds(amount.value * seconds),
  })),
);

// 首次回显选择可整除的最大单位；后续回填保留单位，无法整除时回退到秒。
watch(
  () => props.modelValue,
  (value) => {
    if (value === null || value === undefined) return;
    if (value % unit.value !== 0) {
      unit.value = 1;
    }
  },
  { immediate: true },
);

function isValidSeconds(value: number) {
  return (
    Number.isSafeInteger(value) &&
    value >= minSeconds.value &&
    value <= maxSeconds.value
  );
}

function updateValue(value: null | number) {
  emit('update:modelValue', value);
  emit('change', value);
}

function onAmountChange(value: null | number | string) {
  if (props.disabled || props.readonly) return;
  if (value === null || value === '') {
    updateValue(null);
    return;
  }
  const count = Number(value);
  const seconds = count * unit.value;
  if (Number.isInteger(count) && isValidSeconds(seconds)) updateValue(seconds);
}

function onUnitChange(value: unknown) {
  if (props.disabled || props.readonly) return;
  if (!units.some(({ seconds }) => seconds === value)) return;
  const seconds = amount.value === null ? null : amount.value * Number(value);
  if (seconds !== null && !isValidSeconds(seconds)) return;
  unit.value = Number(value);
  if (seconds !== null) updateValue(seconds);
}

defineExpose({
  blur: () => inputRef.value?.blur(),
  focus: () => inputRef.value?.focus(),
});
</script>

<template>
  <div
    class="flex w-full min-w-0 items-center gap-2"
    :class="$attrs.class"
    :style="$attrs.style"
  >
    <InputNumber
      ref="inputRef"
      v-bind="{ ...$attrs, class: undefined, style: undefined }"
      :value="amount"
      :disabled="disabled"
      :readonly="readonly"
      :min="Math.ceil(minSeconds / unit)"
      :max="Math.floor(maxSeconds / unit)"
      :precision="0"
      :step="1"
      :placeholder="placeholder ?? $t('ui.placeholder.input')"
      :size="size"
      :status="status"
      :aria-label="
        $attrs['aria-label'] ?? $t('tb.components.secondsInput.fields.amount')
      "
      class="min-w-0 flex-1"
      @update:value="onAmountChange"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
    <Select
      :value="unit"
      :disabled="disabled || readonly"
      :options="options"
      :size="size"
      :status="status"
      :aria-label="$t('tb.components.secondsInput.fields.unit')"
      :aria-invalid="$attrs['aria-invalid']"
      :aria-describedby="$attrs['aria-describedby']"
      class="w-28 shrink-0"
      @update:value="onUnitChange"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />
  </div>
</template>
