<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { Button, Input, Select } from 'antdv-next';

import { $t } from '#/locales';

import { messageTypeLabels } from './message-type-options';

const value = defineModel<string>();
const custom = ref(false);
const id = useId();
const { copy, copied } = useClipboard({ legacy: true });
const options = computed(() => [
  ...Object.entries(messageTypeLabels).map(([value, label]) => ({
    value,
    label: $t(`rule-chain.nodeAction.${label}`),
  })),
  { value: '__custom', label: $t('rule-chain.nodeAction.custom') },
]);
watch(
  value,
  (current) => {
    if (current) custom.value = !Object.hasOwn(messageTypeLabels, current);
  },
  { immediate: true },
);
function selectType(type: string) {
  custom.value = type === '__custom';
  value.value = custom.value ? '' : type;
}
</script>

<template>
  <div class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
    <div class="flex min-w-0 flex-col gap-2">
      <label :for="`${id}-type`" class="text-sm font-medium">
        {{ $t('rule-chain.nodeAction.outputMessageType') }}
      </label>
      <Select
        :id="`${id}-type`"
        :value="custom ? '__custom' : value"
        :options="options"
        show-search
        option-filter-prop="label"
        @change="(type) => selectType(String(type))"
      />
    </div>
    <div class="flex min-w-0 flex-col gap-2">
      <label :for="`${id}-value`" class="text-sm font-medium">
        {{ $t('rule-chain.nodeAction.outputMessageTypeValue') }}
      </label>
      <Input :id="`${id}-value`" v-model:value="value" :readonly="!custom">
        <template #suffix>
          <Button
            type="text"
            size="small"
            :disabled="!value"
            :aria-label="$t('rule-chain.config.copyMessageType')"
            @click="copy(value ?? '')"
          >
            <IconifyIcon :icon="copied ? 'lucide:check' : 'lucide:copy'" />
          </Button>
        </template>
      </Input>
    </div>
  </div>
</template>
