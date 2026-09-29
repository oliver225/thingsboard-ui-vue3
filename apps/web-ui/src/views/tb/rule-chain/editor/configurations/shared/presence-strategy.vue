<script setup lang="ts">
import { computed } from 'vue';

import { VbenSegmented } from '@vben/common-ui';

import { $t } from '#/locales';

const value = defineModel<boolean>();
const strategy = computed({
  get: () => (value.value ? 'ON_EACH_MESSAGE' : 'ON_FIRST_MESSAGE'),
  set: (next: string) => {
    value.value = next === 'ON_EACH_MESSAGE';
  },
});
const tabs = computed(() =>
  ['ON_FIRST_MESSAGE', 'ON_EACH_MESSAGE'].map((value) => ({
    value,
    label: $t(`rule-chain.actionUi.${value}`),
  })),
);
</script>

<template>
  <VbenSegmented
    v-model="strategy"
    :tabs="tabs"
    :aria-label="$t('rule-chain.actionUi.presenceStrategy')"
    class="mx-auto w-full max-w-md p-[2px]"
  />
</template>
