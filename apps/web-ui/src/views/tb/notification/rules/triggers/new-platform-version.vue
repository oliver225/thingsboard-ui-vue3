<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

async function validate() {
  return { valid: true };
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  return {};
}

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="flex items-start gap-4">
      <div
        class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg"
      >
        <IconifyIcon
          icon="lucide:package-check"
          class="size-5"
          aria-hidden="true"
        />
      </div>
      <div class="min-w-0 space-y-1">
        <h3 class="text-sm font-medium">
          {{ $t('notification.features.rule.trigger.newPlatformVersionTitle') }}
        </h3>
        <p class="text-muted-foreground text-sm leading-6">
          {{ $t('notification.features.rule.trigger.newPlatformVersionHint') }}
        </p>
      </div>
    </div>
  </section>
</template>
