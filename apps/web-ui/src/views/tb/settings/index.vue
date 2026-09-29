<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import { settingsSections } from './sections';

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const sections = computed(() =>
  settingsSections.filter((item) => hasAccessByRoles(item.authority)),
);
const isTablePage = computed(() =>
  sections.value.some(
    (item) =>
      item.layout === 'table' && route.path === `/settings/${item.path}`,
  ),
);
</script>
<template>
  <Page auto-content-height>
    <div
      class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground [font-family:inherit] md:flex-row"
    >
      <nav
        class="flex min-w-0 shrink-0 gap-1 overflow-auto border-b border-border p-2 text-[length:var(--menu-font-size)] md:block md:basis-[196px] md:overflow-y-auto md:border-r md:border-b-0 md:py-4"
        :aria-label="$t('tb.menu.settings')"
      >
        <div aria-hidden="true" class="hidden h-5 md:block"></div>
        <RouterLink
          v-for="item in sections"
          :key="item.path"
          :to="`/settings/${item.path}`"
          class="flex min-h-[38px] shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[length:inherit] font-normal leading-[22px] whitespace-nowrap text-foreground/85! transition-colors duration-150 hover:bg-accent! focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px] aria-[current=page]:bg-primary/10! aria-[current=page]:font-medium aria-[current=page]:text-primary! md:mb-1 md:whitespace-normal"
          :aria-current="
            route.path === `/settings/${item.path}` ? 'page' : undefined
          "
        >
          <IconifyIcon :icon="item.icon" class="size-4 shrink-0" />
          <span>{{ $t(item.title) }}</span>
        </RouterLink>
      </nav>
      <main
        class="min-h-0 min-w-0 flex-1"
        :class="isTablePage ? 'overflow-auto p-0.5 md:p-1' : 'overflow-hidden'"
      >
        <RouterView v-slot="{ Component }">
          <component :is="Component" :key="route.path" />
        </RouterView>
      </main>
    </div>
  </Page>
</template>
