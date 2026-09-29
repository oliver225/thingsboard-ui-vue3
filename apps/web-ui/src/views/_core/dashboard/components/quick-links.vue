<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { useStorage } from '@vueuse/core';
import { Button, CheckboxGroup, Col, Popover, Row } from 'antdv-next';

import { $t } from '#/locales';

import HomeCard from './home-card.vue';

const userStore = useUserStore();
const selected = useStorage<string[]>(
  `tb-home-links-${userStore.userInfo?.userId}`,
  ['/alarms/alarms', '/dashboards', '/entities/devices'],
);

const links = [
  {
    title: 'device',
    icon: 'lucide:cpu',
    to: '/entities/devices',
  },
  {
    title: 'alarm',
    icon: 'lucide:bell-ring',
    to: '/alarms/alarms',
  },
  {
    title: 'dashboards',
    icon: 'lucide:layout-dashboard',
    to: '/dashboards',
  },
  {
    title: 'assets',
    icon: 'lucide:box',
    to: '/entities/assets',
  },
];
const visibleLinks = computed(() =>
  selected.value.flatMap((path) => links.filter((link) => link.to === path)),
);
const options = computed(() =>
  links.map((link) => ({ label: $t(`home.${link.title}`), value: link.to })),
);
</script>

<template>
  <HomeCard :title="$t('home.quickLinks')" dense>
    <template #extra>
      <Popover trigger="click" :title="$t('home.editQuickLinks')">
        <template #content>
          <CheckboxGroup v-model:value="selected" :options="options" />
        </template>
        <Button
          type="text"
          size="small"
          :aria-label="$t('home.editQuickLinks')"
        >
          <IconifyIcon icon="lucide:pencil" class="size-4" />
        </Button>
      </Popover>
    </template>
    <Row :gutter="[0, 8]" class="pt-2">
      <Col v-for="link in visibleLinks" :key="link.to" :span="24">
        <RouterLink
          :to="link.to"
          class="group hover:bg-primary/5 bg-muted/35 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm transition-colors"
        >
          <span
            class="bg-card text-primary flex size-7 shrink-0 items-center justify-center rounded-md border"
          >
            <IconifyIcon :icon="link.icon" class="size-3.5" />
          </span>
          <span class="min-w-0 flex-1 truncate">
            {{ $t(`home.${link.title}`) }}
          </span>
          <IconifyIcon
            icon="lucide:arrow-up-right"
            class="text-muted-foreground size-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </RouterLink>
      </Col>
      <Col
        v-if="!visibleLinks.length"
        :span="24"
        class="text-muted-foreground text-sm"
      >
        {{ $t('home.chooseQuickLinks') }}
      </Col>
    </Row>
  </HomeCard>
</template>
