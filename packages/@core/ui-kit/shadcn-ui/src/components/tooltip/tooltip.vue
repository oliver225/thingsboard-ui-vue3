<script setup lang="ts">
import type { TooltipContentProps } from 'reka-ui';

import type { StyleValue } from 'vue';

import type { ClassType } from '@vben-core/typings';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui';

interface Props {
  contentClass?: ClassType;
  contentStyle?: StyleValue;
  delayDuration?: number;
  open?: boolean;
  portalTarget?: HTMLElement | string;
  side?: TooltipContentProps['side'];
}

withDefaults(defineProps<Props>(), {
  delayDuration: 0,
  open: undefined,
  side: 'right',
});
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <Tooltip :open="open">
      <TooltipTrigger as-child tabindex="-1">
        <slot name="trigger"></slot>
      </TooltipTrigger>
      <TooltipContent
        :portal-target="portalTarget"
        :class="contentClass"
        :side="side"
        :style="contentStyle"
        class="text-popover-foreground rounded-md"
      >
        <slot></slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
