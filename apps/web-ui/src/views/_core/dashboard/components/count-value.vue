<script setup lang="ts">
import type { WsCommand } from '#/types/ws';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { useWs } from '#/hooks/use-ws';
import { $t } from '#/locales';

const props = defineProps<{ command: WsCommand }>();
const { data, status, refresh } = useWs(() => props.command);
const count = computed(() => {
  const message = data.value;
  return message && 'count' in message ? message.count.toLocaleString() : '—';
});
</script>

<template>
  <div class="flex items-center gap-2" aria-live="polite">
    <span
      class="text-2xl font-semibold tabular-nums"
      :class="{ 'animate-pulse': status === 'loading' }"
    >
      {{ count }}
    </span>
    <button
      v-if="status === 'error' || status === 'stale'"
      type="button"
      class="text-muted-foreground hover:text-primary"
      :title="$t('home.retry')"
      :aria-label="$t('home.retry')"
      @click.stop.prevent="refresh"
    >
      <IconifyIcon icon="lucide:refresh-cw" class="size-4" />
    </button>
  </div>
</template>
