<script setup lang="ts">
import { computed, watch } from 'vue';

import { VbenSelect } from '@vben/common-ui';

import { Input as VbenInput } from '@vben-core/shadcn-ui';

import { Alert } from 'antdv-next';

import { $t } from '#/locales';

const props = defineProps<{ dynamic?: boolean }>();
const value = defineModel<string>();
const severityOptions = computed(() =>
  ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INDETERMINATE'].map(
    (severity) => ({
      value: severity,
      label: $t(`alarm.options.severity.${severity}`),
    }),
  ),
);

watch(
  () => props.dynamic,
  (dynamic) => {
    value.value = dynamic ? '' : 'CRITICAL';
  },
);
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <VbenInput v-if="dynamic" v-model="value" class="w-full" />
    <VbenSelect
      v-else
      v-model="value"
      :options="severityOptions"
      class="w-full"
    />
    <Alert
      v-if="dynamic"
      type="warning"
      show-icon
      :message="$t('rule-chain.actionUi.severityHelp')"
    />
  </div>
</template>
