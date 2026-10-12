<script setup lang="ts">
import type { PinInputProps } from './types';

import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

import { useMounted } from '@vueuse/core';

import { PinInput, PinInputGroup, PinInputSlot } from '../../ui';
import { VbenButton } from '../button';

defineOptions({
  inheritAttrs: false,
});

const {
  codeLength = 6,
  createText = async () => {},
  disabled = false,
  handleSendCode = async () => {},
  loading = false,
  maxTime = 60,
  showSendButton = true,
} = defineProps<PinInputProps>();

const emit = defineEmits<{
  complete: [];
  sendError: [error: any];
}>();

const timer = ref<ReturnType<typeof setTimeout>>();
const isMounted = useMounted();
const isSending = ref(false);

const modelValue = defineModel<string>();

const inputValue = ref<string[]>([]);
const countdown = ref(0);

const btnText = computed(() => {
  const countdownValue = countdown.value;
  return createText?.(countdownValue);
});

const btnLoading = computed(() => {
  return loading || isSending.value;
});

watch(
  () => modelValue.value,
  () => {
    inputValue.value = modelValue.value?.split('') ?? [];
  },
  { immediate: true },
);

watch(inputValue, (val) => {
  modelValue.value = val.join('');
});

function handleComplete(e: string[]) {
  modelValue.value = e.join('');
  emit('complete');
}

async function handleSend(e: Event) {
  e.preventDefault();
  if (disabled || btnLoading.value || countdown.value > 0) return;
  isSending.value = true;
  try {
    await handleSendCode();
    if (!isMounted.value) return;
    countdown.value = maxTime;
    startCountdown();
  } catch (error) {
    if (isMounted.value) emit('sendError', error);
  } finally {
    isSending.value = false;
  }
}

function startCountdown() {
  if (countdown.value > 0) {
    timer.value = setTimeout(() => {
      countdown.value--;
      startCountdown();
    }, 1000);
  }
}

onBeforeUnmount(() => {
  countdown.value = 0;
  clearTimeout(timer.value);
});

const id = useId();

const pinType = 'text' as const;
</script>

<template>
  <PinInput
    :id="id"
    v-bind="$attrs"
    v-model="inputValue"
    :disabled="disabled"
    class="flex w-full min-w-0 justify-between has-disabled:opacity-100"
    :class="$props.class"
    otp
    placeholder="○"
    :type="pinType"
    @complete="handleComplete"
  >
    <div class="relative flex w-full min-w-0 gap-2">
      <PinInputGroup class="min-w-0 flex-1">
        <PinInputSlot
          v-for="(item, index) in codeLength"
          :key="item"
          :index="index"
          class="h-10 min-w-0 flex-1"
          :aria-label="$attrs['aria-label']"
          :aria-invalid="$attrs['aria-invalid']"
        />
      </PinInputGroup>
      <VbenButton
        v-if="showSendButton"
        type="button"
        :disabled="disabled || countdown > 0"
        :loading="btnLoading"
        class="shrink-0"
        size="lg"
        variant="outline"
        @click="handleSend"
        @keydown.enter.stop
      >
        {{ btnText }}
      </VbenButton>
    </div>
  </PinInput>
</template>
