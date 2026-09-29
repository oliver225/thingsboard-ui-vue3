<script setup lang="ts">
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  VbenIconButton,
} from '@vben-core/shadcn-ui';

import { $t } from '#/locales';

const props = defineProps<{
  device: {
    active?: string;
    label: string;
    lastActivity: number;
    name: string;
  };
}>();
const emit = defineEmits<{ close: [] }>();
const status = computed(() => {
  switch (props.device.active) {
    case 'true': {
      return { label: $t('home.active'), variant: 'success' as const };
    }
    case 'false': {
      return { label: $t('home.inactive'), variant: 'warning' as const };
    }
    default: {
      return { label: $t('home.unknown'), variant: 'secondary' as const };
    }
  }
});
</script>

<template>
  <Card
    class="map-info-window w-[300px] gap-0 overflow-hidden rounded-xl py-0 shadow-lg"
    :aria-label="device.name"
  >
    <CardHeader
      class="bg-primary text-primary-foreground flex flex-row items-center gap-3 space-y-0 px-4 py-3"
    >
      <div class="min-w-0 flex-1">
        <CardTitle
          class="text-primary-foreground break-words text-sm font-semibold leading-5"
        >
          {{ device.name }}
        </CardTitle>
      </div>
      <VbenIconButton
        class="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/15 -mr-1 size-7 shrink-0 rounded-md"
        :aria-label="$t('common.close')"
        @click="emit('close')"
      >
        <IconifyIcon icon="lucide:x" class="size-4" />
      </VbenIconButton>
    </CardHeader>
    <CardContent class="p-4">
      <CardDescription class="mb-3 break-words text-xs leading-relaxed">
        {{ device.label }}
      </CardDescription>
      <dl class="m-0 text-xs">
        <div class="flex items-center justify-between gap-3 border-t py-3">
          <dt class="text-muted-foreground">{{ $t('home.map.status') }}</dt>
          <dd class="m-0">
            <Badge
              :variant="status.variant"
              class="gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
            >
              <span
                class="size-1.5 rounded-full"
                :class="
                  device.active === 'true'
                    ? 'bg-current'
                    : 'border border-current'
                "
              ></span>
              {{ status.label }}
            </Badge>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="text-muted-foreground shrink-0">
            {{ $t('home.map.lastActivity') }}
          </dt>
          <dd class="m-0 text-right tabular-nums">
            {{
              Number.isFinite(device.lastActivity) && device.lastActivity > 0
                ? formatDateTime(device.lastActivity)
                : '—'
            }}
          </dd>
        </div>
      </dl>
    </CardContent>
  </Card>
</template>

<style scoped>
/* 天地图会将容器内的 SVG 绝对定位，组件图标需要恢复正常文档流。 */
.map-info-window :deep(svg) {
  position: static;
  overflow: visible;
}
</style>
