<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Bell, LoaderCircle } from '@vben/icons';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  VbenButton,
  VbenIconButton,
} from '@vben-core/shadcn-ui';

import { useNotifications } from '#/hooks/use-notifications';
import { $t } from '#/locales';

import NotificationItem from './item.vue';

const open = ref(false);
const router = useRouter();
const {
  notifications,
  unreadCount,
  loading,
  status,
  error,
  refresh,
  markRead,
  actionError,
} = useNotifications(open);
const available = computed(() => status.value === 'live');
const label = computed(() =>
  $t('notification.bell.label', { count: unreadCount.value }),
);

function navigate(link: string) {
  open.value = false;
  if (link.startsWith('/')) void router.push(link);
  else window.open(link, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <VbenIconButton class="relative" :aria-label="label" :title="label">
        <Bell class="size-5" aria-hidden="true" />
        <span
          v-if="unreadCount > 0"
          class="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] leading-4 text-white"
          aria-hidden="true"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
        <span
          v-else-if="error || status === 'stale'"
          class="absolute right-0 top-0 size-2 rounded-full bg-amber-500"
          aria-hidden="true"
        ></span>
      </VbenIconButton>
    </PopoverTrigger>
    <PopoverContent
      align="end"
      :side-offset="8"
      class="w-[400px] max-w-[calc(100vw-24px)] overflow-hidden p-0"
      :aria-label="$t('notification.menu')"
    >
      <div
        class="flex items-center justify-between gap-2 border-b border-border px-3 py-2"
      >
        <h2 class="font-semibold">{{ $t('notification.menu') }}</h2>
        <VbenButton
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
          :disabled="!available || unreadCount === 0"
          @click="markRead()"
        >
          {{ $t('notification.actions.markAllRead') }}
        </VbenButton>
      </div>
      <div
        v-if="error || status === 'stale' || actionError"
        class="flex items-center justify-between gap-2 bg-muted/50 px-3 py-2 text-xs"
        role="status"
      >
        <span>{{
          $t(
            status === 'stale'
              ? 'notification.bell.reconnecting'
              : 'notification.bell.error',
          )
        }}</span>
        <VbenButton variant="ghost" size="sm" @click="refresh">
          {{ $t('notification.bell.retry') }}
        </VbenButton>
      </div>
      <div
        v-if="loading"
        class="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
        role="status"
      >
        <LoaderCircle class="size-5 animate-spin" aria-hidden="true" />
        {{ $t('notification.bell.loading') }}
      </div>
      <ul
        v-else-if="notifications.length"
        class="max-h-[min(420px,60vh)] divide-y divide-border overflow-y-auto overscroll-contain"
      >
        <NotificationItem
          v-for="item in notifications"
          :key="item.id?.id"
          :notification="item"
          :disabled="!available"
          @read="markRead"
          @navigate="navigate"
        />
      </ul>
      <div
        v-else-if="available"
        class="flex flex-col items-center gap-2 p-6 text-sm text-muted-foreground"
        role="status"
      >
        <Bell class="size-8 opacity-40" aria-hidden="true" />
        <span>{{ $t('notification.bell.empty') }}</span>
      </div>
      <div class="border-t border-border p-1">
        <VbenButton
          variant="ghost"
          class="h-8 w-full text-xs"
          @click="navigate('/notification/inbox')"
        >
          {{ $t('notification.bell.viewAll') }}
        </VbenButton>
      </div>
    </PopoverContent>
  </Popover>
</template>
