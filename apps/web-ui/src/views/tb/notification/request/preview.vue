<script lang="ts" setup>
import type { NotificationRequestPreview } from '#/api/tb/notification';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { NotificationDeliveryMethod } from '#/enums';
import { $t } from '#/locales';

import { deliveryMethodOptions } from '../templates/template';
import { getEmailPreviewDocument } from './form-data';

const props = defineProps<{
  preview: NotificationRequestPreview;
  scheduledTime?: string;
  timezone?: string;
}>();

const templates = computed(() =>
  deliveryMethodOptions().flatMap((option) => {
    const template = props.preview.processedTemplates[option.value];
    return template ? [{ ...option, template }] : [];
  }),
);
</script>

<template>
  <div class="space-y-5">
    <section class="border-border bg-muted/30 rounded-xl border p-5">
      <div class="flex items-center gap-3">
        <span
          class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
        >
          <IconifyIcon icon="lucide:users" class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 class="text-base font-semibold">
            {{
              $t('notification.features.request.preview.recipients', {
                count: preview.totalRecipientsCount,
              })
            }}
          </h3>
          <p class="text-muted-foreground mt-1 text-sm">
            {{
              scheduledTime
                ? $t('notification.features.request.preview.scheduled', {
                    time: scheduledTime,
                    timezone,
                  })
                : $t('notification.features.request.preview.immediate')
            }}
          </p>
        </div>
      </div>
      <dl
        v-if="Object.keys(preview.recipientsCountByTarget).length > 1"
        class="mt-4 space-y-2 text-sm"
      >
        <div
          v-for="(count, name) in preview.recipientsCountByTarget"
          :key="name"
          class="flex justify-between gap-4"
        >
          <dt class="break-all">{{ name }}</dt>
          <dd class="shrink-0 tabular-nums">{{ count }}</dd>
        </div>
      </dl>
      <div
        v-if="preview.recipientsPreview.length"
        class="mt-4 flex flex-wrap gap-2"
      >
        <span
          v-for="(recipient, index) in preview.recipientsPreview"
          :key="index"
          class="border-border bg-background max-w-full break-all rounded-md border px-2 py-1 text-xs"
          >{{ recipient }}</span>
      </div>
      <p
        v-if="preview.totalRecipientsCount > preview.recipientsPreview.length"
        class="text-muted-foreground mt-3 text-xs"
      >
        {{ $t('notification.features.request.preview.sample') }}
      </p>
      <p
        v-if="preview.totalRecipientsCount === 0"
        role="status"
        class="text-destructive mt-3 text-sm"
      >
        {{ $t('notification.features.request.preview.empty') }}
      </p>
    </section>
    <section
      v-for="{ value, label, icon, template } in templates"
      :key="value"
      class="border-border overflow-hidden rounded-xl border"
    >
      <h3
        class="border-border bg-muted/30 flex items-center gap-2 border-b px-4 py-3 text-sm font-medium"
      >
        <IconifyIcon :icon="icon" class="size-4" aria-hidden="true" />{{
          label
        }}
      </h3>
      <div class="space-y-3 p-4">
        <div v-if="template.subject" class="flex items-center gap-2">
          <IconifyIcon
            v-if="
              template.additionalConfig?.icon?.enabled &&
              template.additionalConfig.icon.icon
            "
            :icon="template.additionalConfig.icon.icon"
            :style="{ color: template.additionalConfig.icon.color }"
            class="size-5 shrink-0"
            aria-hidden="true"
          />
          <h4 class="break-words text-sm font-semibold">
            {{ template.subject }}
          </h4>
        </div>
        <iframe
          v-if="value === NotificationDeliveryMethod.EMAIL"
          :title="label"
          sandbox=""
          referrerpolicy="no-referrer"
          :srcdoc="getEmailPreviewDocument(template.body ?? '')"
          class="bg-white h-72 w-full rounded-md border-0"
        ></iframe>
        <p
          v-else
          class="mb-0 whitespace-pre-wrap break-words text-sm leading-6"
        >
          {{ template.body }}
        </p>
        <span
          v-if="
            template.additionalConfig?.actionButtonConfig?.enabled ||
            template.button?.enabled
          "
          class="border-border inline-flex rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          {{
            template.additionalConfig?.actionButtonConfig?.text ||
            template.button?.text
          }}
        </span>
      </div>
    </section>
  </div>
</template>
