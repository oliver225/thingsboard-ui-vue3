<script setup lang="ts">
import type { Notification } from '#/api/tb/notification';

import { computed } from 'vue';

import { Bell, CircleAlert, CircleCheckBig, IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { VbenButton, VbenIconButton } from '@vben-core/shadcn-ui';

import {
  alarmSeverityColors,
  alarmSeverityLabel,
  notificationTypeLabel,
} from '#/enums';
import { $t } from '#/locales';
import { notificationLink, notificationText } from '#/utils/notifications';

const props = defineProps<{ notification: Notification; disabled?: boolean }>();
defineEmits<{ read: [id: string]; navigate: [link: string] }>();

const severity = computed(() =>
  props.notification.type === 'ALARM'
    ? props.notification.info?.alarmSeverity
    : undefined,
);
const color = computed(() =>
  severity.value ? alarmSeverityColors[severity.value] : undefined,
);
const link = computed(() => notificationLink(props.notification));
const icon = computed(() => {
  const config = props.notification.additionalConfig?.icon;
  if (!config?.enabled || !config.icon) return undefined;
  return config.icon.includes(':')
    ? config.icon
    : `material-symbols:${config.icon.replaceAll('_', '-')}`;
});
</script>

<template>
  <li
    class="flex items-start gap-2.5 border-l-2 border-transparent px-3 py-2.5"
    :style="{
      backgroundColor: color ? `${color}0d` : undefined,
      borderLeftColor: color,
    }"
  >
    <span
      class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
      :style="{
        color:
          color ||
          (icon ? notification.additionalConfig?.icon?.color : undefined),
        backgroundColor: color ? `${color}1a` : undefined,
      }"
    >
      <IconifyIcon v-if="icon" :icon="icon" class="size-4" aria-hidden="true" />
      <CircleAlert
        v-else-if="notification.type === 'ALARM'"
        class="size-4"
        aria-hidden="true"
      />
      <Bell v-else class="size-4" aria-hidden="true" />
    </span>
    <div class="min-w-0 flex-1">
      <div
        class="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      >
        <span>{{ notificationTypeLabel(notification.type) }}</span>
        <span
          v-if="severity"
          class="rounded px-1.5 py-0.5 font-medium text-foreground"
          :style="{ backgroundColor: color ? `${color}1a` : undefined }"
        >
          {{ alarmSeverityLabel(severity) }}
        </span>
        <time class="ml-auto">{{
          formatDateTime(notification.createdTime)
        }}</time>
      </div>
      <h3 class="whitespace-pre-wrap break-words text-sm font-medium">
        {{ notificationText(notification.subject) }}
      </h3>
      <p
        class="mt-0.5 whitespace-pre-wrap break-words text-sm text-muted-foreground"
      >
        {{ notificationText(notification.text) }}
      </p>
      <VbenButton
        v-if="link"
        variant="outline"
        size="sm"
        class="mt-1.5 h-7 max-w-full px-2 text-xs"
        @click="$emit('navigate', link)"
      >
        {{
          notificationText(
            notification.additionalConfig?.actionButtonConfig?.text,
          ) || $t('notification.bell.viewDetails')
        }}
      </VbenButton>
    </div>
    <VbenIconButton
      class="size-7 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
      :disabled="disabled || !notification.id?.id"
      :aria-label="$t('notification.actions.markRead')"
      :title="$t('notification.actions.markRead')"
      @click="notification.id?.id && $emit('read', notification.id.id)"
    >
      <CircleCheckBig class="size-4" aria-hidden="true" />
    </VbenIconButton>
  </li>
</template>
