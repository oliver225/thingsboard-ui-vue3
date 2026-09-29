<script setup lang="ts">
import { computed, useId } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { Button, Input, Select } from 'antdv-next';

import { $t } from '#/locales';

import { scopeOptions } from './form-layout';

const emit = defineEmits<{ change: [value: string] }>();
const value = defineModel<string>();
const id = useId();
const options = computed(scopeOptions);
const { copy, copied } = useClipboard({ legacy: true });
</script>

<template>
  <div class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
    <div class="flex min-w-0 flex-col gap-2">
      <label :for="`${id}-scope`" class="text-sm font-medium">{{
        $t('rule-chain.actionUi.attributeScope')
      }}</label>
      <Select
        :id="`${id}-scope`"
        v-model:value="value"
        :options="options"
        @change="(next) => emit('change', String(next))"
      />
    </div>
    <div class="flex min-w-0 flex-col gap-2">
      <label :for="`${id}-value`" class="text-sm font-medium">{{
        $t('rule-chain.actionUi.scopeValue')
      }}</label>
      <Input :id="`${id}-value`" :value="value" readonly>
        <template #suffix>
          <Button
            type="text"
            size="small"
            :disabled="!value"
            :aria-label="$t('rule-chain.actionUi.copyScope')"
            @click="copy(value ?? '')"
          >
            <IconifyIcon :icon="copied ? 'lucide:check' : 'lucide:copy'" />
          </Button>
        </template>
      </Input>
    </div>
  </div>
</template>
