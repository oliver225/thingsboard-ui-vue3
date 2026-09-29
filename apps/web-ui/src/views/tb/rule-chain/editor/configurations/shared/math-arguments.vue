<script setup lang="ts">
import type { MathArgument } from './math-arguments';

import { computed, useId, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Input, InputNumber, Select } from 'antdv-next';

import { $t } from '#/locales';

import { scopeOptions } from './form-layout';
import {
  argumentCounts,
  argumentNames,
  normalizeArguments,
} from './math-arguments';

const props = defineProps<{ operation?: string }>();
const value = defineModel<MathArgument[]>({ default: () => [] });
const id = useId();
const limits = computed(
  () => argumentCounts[props.operation ?? 'CUSTOM'] ?? [1, 16],
);
const sources = computed(() =>
  [
    'MESSAGE_BODY',
    'MESSAGE_METADATA',
    'ATTRIBUTE',
    'TIME_SERIES',
    'CONSTANT',
  ].map((value) => ({
    value,
    label: $t(`rule-chain.config.options.${value}`),
  })),
);
const scopes = computed(scopeOptions);
watch(
  () => props.operation,
  (operation) => {
    value.value = normalizeArguments(value.value, operation);
  },
  { immediate: true },
);
function update(index: number, patch: Partial<MathArgument>) {
  value.value = value.value.map((arg, i) =>
    i === index ? { ...arg, ...patch } : arg,
  );
}
function reorder(index: number, offset: number) {
  const next = [...value.value];
  const argument = next.splice(index, 1)[0];
  if (!argument) return;
  next.splice(index + offset, 0, argument);
  value.value = next.map((arg, i) => ({
    ...arg,
    name: argumentNames[i] ?? arg.name,
  }));
}
function remove(index: number) {
  value.value = value.value
    .filter((_, i) => i !== index)
    .map((arg, i) => ({ ...arg, name: argumentNames[i] ?? arg.name }));
}
function add() {
  const name = argumentNames[value.value.length];
  if (!name) return;
  value.value = [
    ...value.value,
    {
      name,
      type: 'MESSAGE_BODY',
      key: '',
      attributeScope: 'SERVER_SCOPE',
    },
  ];
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-4">
    <div
      v-for="(argument, index) in value"
      :key="index"
      class="border-border grid min-w-0 grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2"
    >
      <div class="flex items-center justify-between sm:col-span-2">
        <span class="font-medium">{{
          props.operation === 'CUSTOM' ? argument.name : index + 1
        }}</span>
        <div class="flex gap-1">
          <Button
            type="text"
            size="small"
            :disabled="index === 0"
            :aria-label="$t('rule-chain.actionUi.moveUp')"
            @click="reorder(index, -1)"
          >
            <IconifyIcon icon="lucide:arrow-up" />
          </Button>
          <Button
            type="text"
            size="small"
            :disabled="index === value.length - 1"
            :aria-label="$t('rule-chain.actionUi.moveDown')"
            @click="reorder(index, 1)"
          >
            <IconifyIcon icon="lucide:arrow-down" />
          </Button>
          <Button
            type="text"
            size="small"
            :disabled="value.length <= limits[0]!"
            :aria-label="$t('rule-chain.actionUi.removeArgument')"
            @click="remove(index)"
          >
            <IconifyIcon icon="lucide:x" />
          </Button>
        </div>
      </div>
      <div class="flex min-w-0 flex-col gap-2 sm:col-span-2">
        <label :for="`${id}-${index}-source`">{{
          $t('rule-chain.actionUi.argumentSource')
        }}</label>
        <Select
          :id="`${id}-${index}-source`"
          :value="argument.type"
          :options="sources"
          @change="(type) => update(index, { type: String(type) })"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-2">
        <label :for="`${id}-${index}-key`">{{
          $t(
            argument.type === 'CONSTANT'
              ? 'rule-chain.actionUi.constantValue'
              : 'rule-chain.actionUi.argumentKey',
          )
        }}</label>
        <InputNumber
          v-if="argument.type === 'CONSTANT'"
          :id="`${id}-${index}-key`"
          :value="
            argument.key !== '' && Number.isFinite(Number(argument.key))
              ? Number(argument.key)
              : null
          "
          class="w-full"
          @update:value="
            (key) => update(index, { key: key === null ? '' : String(key) })
          "
        />
        <Input
          v-else
          :id="`${id}-${index}-key`"
          :value="argument.key"
          @update:value="(key) => update(index, { key })"
        />
      </div>
      <div
        v-if="argument.type !== 'CONSTANT'"
        class="flex min-w-0 flex-col gap-2"
      >
        <label :for="`${id}-${index}-default`">{{
          $t('rule-chain.nodeAction.defaultValue')
        }}</label>
        <InputNumber
          :id="`${id}-${index}-default`"
          :value="argument.defaultValue"
          class="w-full"
          @update:value="
            (next) =>
              update(index, {
                defaultValue: next === null ? null : Number(next),
              })
          "
        />
      </div>
      <div
        v-if="argument.type === 'ATTRIBUTE'"
        class="flex min-w-0 flex-col gap-2 sm:col-span-2"
      >
        <label :for="`${id}-${index}-scope`">{{
          $t('rule-chain.actionUi.attributeScope')
        }}</label>
        <Select
          :id="`${id}-${index}-scope`"
          :value="argument.attributeScope"
          :options="scopes"
          @change="
            (attributeScope) =>
              update(index, { attributeScope: String(attributeScope) })
          "
        />
      </div>
    </div>
    <Button type="dashed" :disabled="value.length >= limits[1]!" @click="add">
      {{ $t('rule-chain.actionUi.addArgument') }}
    </Button>
  </div>
</template>
