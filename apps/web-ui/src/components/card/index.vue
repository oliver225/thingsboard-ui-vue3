<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { cn } from '@vben/utils';

import {
  Card as BaseCard,
  CardContent,
  CardHeader,
  CardTitle,
} from '@vben-core/shadcn-ui';

defineOptions({ name: 'Card' });

const props = defineProps<{
  class?: HTMLAttributes['class'];
  contentClass?: HTMLAttributes['class'];
  icon?: string;
  title?: string;
}>();
</script>

<template>
  <BaseCard
    :class="
      cn('min-h-0 min-w-0 gap-5 overflow-hidden shadow-none', props.class)
    "
  >
    <CardHeader
      v-if="title || icon"
      class="flex shrink-0 items-center gap-2 space-y-0"
    >
      <IconifyIcon
        v-if="icon"
        :icon="icon"
        class="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <CardTitle v-if="title" class="text-base">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent :class="cn('min-h-0 flex-1 overflow-y-auto', contentClass)">
      <slot></slot>
    </CardContent>
  </BaseCard>
</template>
