<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { Card, CardContent, CardHeader, CardTitle } from '@vben-core/shadcn-ui';

defineProps<{ title?: string; to?: string; fill?: boolean; dense?: boolean }>();
</script>

<template>
  <Card
    class="home-card flex min-w-0 flex-col gap-0 rounded-xl py-0 shadow-sm"
    :class="{ 'h-full min-h-0': fill }"
  >
    <CardHeader
      class="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3 space-y-0"
      :class="dense ? 'p-3 pb-2' : 'p-4 pb-3'"
    >
      <slot name="title">
        <CardTitle class="text-base font-medium">
          <RouterLink
            v-if="to"
            :to="to"
            class="hover:text-primary inline-flex items-center gap-2"
          >
            {{ title }}
            <IconifyIcon
              icon="lucide:arrow-up-right"
              class="text-muted-foreground size-4"
            />
          </RouterLink>
          <template v-else>{{ title }}</template>
        </CardTitle>
      </slot>
      <slot name="extra"></slot>
    </CardHeader>
    <CardContent
      class="min-w-0 flex-1 pt-1"
      :class="[
        dense ? 'px-3 pb-3' : 'px-4 pb-4',
        { 'flex min-h-0 flex-col': fill },
      ]"
    >
      <slot></slot>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Ant Design 的全局链接样式优先于 Tailwind 层；卡片内链接继承主题色。 */
.home-card :deep(a) {
  color: inherit;
}

.home-card :deep(a:hover),
.home-card :deep(a.text-primary) {
  color: hsl(var(--primary));
}
</style>
