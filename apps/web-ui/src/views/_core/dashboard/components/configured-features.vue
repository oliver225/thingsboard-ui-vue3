<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { Button, Col, Row } from 'antdv-next';

import { getAdminSettings } from '#/api/tb/admin';
import { getNotificationSettings } from '#/api/tb/notification';
import { getOAuth2Clients } from '#/api/tb/oauth2';
import { getPlatformTwoFaSettings } from '#/api/tb/two-factor-auth';
import { $t } from '#/locales';

import HomeCard from './home-card.vue';

const loading = ref(false);
const features = ref<{ key: string; to: string; configured?: boolean }[]>([
  { key: 'email', to: '/settings/outgoing-mail' },
  { key: 'sms', to: '/settings/notifications' },
  { key: 'slack', to: '/settings/notifications' },
  { key: 'oauth', to: '/oauth2/clients' },
  { key: 'twoFactor', to: '/settings/2fa' },
]);
async function loadFeatures() {
  if (loading.value) return;
  loading.value = true;
  const results = await Promise.allSettled([
    getAdminSettings('mail').then((settings) => !!settings.jsonValue.smtpHost),
    getAdminSettings('sms').then((settings) => !!settings.jsonValue.type),
    getNotificationSettings().then(
      (settings) => !!settings.deliveryMethodsConfigs?.SLACK?.botToken,
    ),
    getOAuth2Clients({ page: 0, pageSize: 1 }).then(
      (page) => page.totalElements > 0,
    ),
    getPlatformTwoFaSettings().then(
      (settings) => !!settings?.providers?.length,
    ),
  ]);
  features.value.forEach((feature, index) => {
    const result = results[index];
    feature.configured =
      result?.status === 'fulfilled' ? result.value : undefined;
  });
  loading.value = false;
}
onMounted(loadFeatures);
</script>

<template>
  <HomeCard
    :title="$t('home.configuredFeatures')"
    fill
    class="compact-features"
  >
    <template #extra>
      <Button
        type="text"
        size="small"
        :loading="loading"
        :aria-label="$t('home.retry')"
        @click="loadFeatures"
      >
        <IconifyIcon icon="lucide:refresh-cw" class="size-4" />
      </Button>
    </template>
    <Row class="feature-grid" :gutter="[8, 8]" align="top">
      <Col v-for="feature in features" :key="feature.key" :xs="24" :sm="12">
        <RouterLink
          :to="feature.to"
          class="hover:bg-muted/50 flex items-center gap-2 rounded-lg border p-3 text-sm"
        >
          <IconifyIcon
            :icon="
              feature.configured === undefined
                ? 'lucide:circle-help'
                : feature.configured
                  ? 'lucide:circle-check'
                  : 'lucide:circle-x'
            "
            :class="
              feature.configured ? 'text-emerald-600' : 'text-muted-foreground'
            "
            class="size-4 shrink-0"
          />
          <span>{{ $t(`home.features.${feature.key}`) }}</span>
          <span class="text-muted-foreground ml-auto text-xs">
            {{
              $t(
                feature.configured === undefined
                  ? 'home.unknown'
                  : feature.configured
                    ? 'home.configured'
                    : 'home.notConfigured',
              )
            }}
          </span>
        </RouterLink>
      </Col>
    </Row>
  </HomeCard>
</template>

<style scoped>
.compact-features :deep([data-slot='card-header']) {
  padding: 10px 12px 6px;
}

.compact-features :deep([data-slot='card-content']) {
  padding: 4px 12px 12px;
}

.feature-grid {
  flex: 0 0 auto;
  align-content: start;
  min-height: 0;
  padding-top: 0;
}

.feature-grid a {
  gap: 6px;
  min-width: 0;
  min-height: 44px;
  padding: 8px 10px;
  font-size: 14px;
}

.feature-grid a :deep(svg) {
  width: 18px;
  height: 18px;
}

.feature-grid a > span:last-child {
  font-size: 13px;
  white-space: nowrap;
}

@media (max-height: 760px) {
  .feature-grid a {
    gap: 4px;
    min-height: 36px;
    padding: 5px 6px;
  }
}
</style>
