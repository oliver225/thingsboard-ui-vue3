<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { $t } from '#/locales';

import HomeCard from './home-card.vue';

const props = defineProps<{ system?: boolean }>();
const expandedStep = ref(-1);
const steps = computed(() =>
  props.system
    ? [
        { key: 'tenant', to: '/tenants', doc: 'user-guide/ui/tenants/' },
        {
          key: 'mail',
          to: '/settings/outgoing-mail',
          doc: 'user-guide/ui/mail-settings/',
        },
        {
          key: 'sms',
          to: '/settings/notifications',
          doc: 'user-guide/ui/sms-provider-settings/',
        },
        {
          key: 'twoFactor',
          to: '/settings/2fa',
          doc: 'user-guide/two-factor-authentication/',
        },
        {
          key: 'oauth',
          to: '/oauth2/clients',
          doc: 'user-guide/oauth-2-support/',
        },
      ]
    : [
        {
          key: 'device',
          to: '/entities/devices',
          doc: 'getting-started-guides/helloworld/',
        },
        { key: 'connect', to: '/entities/devices', doc: 'reference/mqtt-api/' },
        { key: 'dashboard', to: '/dashboards', doc: 'user-guide/dashboards/' },
        { key: 'rule', to: '/alarms/alarm-rules', doc: 'user-guide/alarms/' },
        { key: 'alarm', to: '/alarms/alarms', doc: 'user-guide/alarms/' },
        { key: 'customer', to: '/customers', doc: 'user-guide/ui/customers/' },
      ],
);
</script>

<template>
  <HomeCard :title="$t('home.getStarted')" class="h-full" fill>
    <div class="system-guide-steps">
      <section
        v-for="(step, index) in steps"
        :key="step.key"
        class="rounded-xl"
        :class="expandedStep === index ? 'bg-muted/60' : ''"
      >
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left"
          :aria-expanded="expandedStep === index"
          @click="expandedStep = expandedStep === index ? -1 : index"
        >
          <span
            class="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full text-primary-foreground text-base"
          >
            {{ index + 1 }}
          </span>
          <span class="flex-1 text-sm font-medium">
            {{ $t(`home.guide.${step.key}.title`) }}
          </span>
          <IconifyIcon
            :icon="
              expandedStep === index
                ? 'lucide:chevron-up'
                : 'lucide:chevron-down'
            "
            class="text-muted-foreground size-4 shrink-0"
          />
        </button>
        <div v-if="expandedStep === index" class="space-y-5 px-4 pb-5 pt-2">
          <p class="text-muted-foreground text-sm leading-7">
            {{ $t(`home.guide.${step.key}.description`) }}
          </p>
          <RouterLink
            :to="step.to"
            class="text-primary inline-flex items-center gap-1 text-sm font-medium"
          >
            {{ $t('home.openPage') }}
            <IconifyIcon icon="lucide:arrow-up-right" class="size-4" />
          </RouterLink>
          <a
            :href="`https://thingsboard.io/docs/${step.doc}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary bg-card flex items-center gap-2 rounded-md border px-3 py-3 text-sm"
          >
            <IconifyIcon icon="lucide:file-text" class="size-4 shrink-0" />
            {{ $t('home.viewDocs') }}
            <IconifyIcon
              icon="lucide:external-link"
              class="ml-auto size-3 shrink-0"
            />
          </a>
        </div>
      </section>
    </div>
  </HomeCard>
</template>

<style scoped>
.system-guide-steps {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  justify-content: flex-start;
  min-height: 0;
}

.system-guide-steps section {
  margin: 0;
}

.system-guide-steps button {
  padding: clamp(8px, 1.8vh, 16px) 8px;
}

.system-guide-steps section > div {
  padding: 0 12px 12px;
}

.system-guide-steps p {
  font-size: 12px;
  line-height: 1.7;
}

@media (max-height: 760px) {
  .system-guide-steps section > div {
    --tw-space-y-reverse: 0;
  }

  .system-guide-steps section > div > :not(:last-child) {
    margin-bottom: 10px;
  }

  .system-guide-steps a {
    font-size: 12px;
  }
}
</style>
