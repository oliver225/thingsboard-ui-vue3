<script setup lang="ts">
import type { OAuth2LoginClient } from '#/api/tb/noauth';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { getOAuth2LoginClients } from '#/api/tb/noauth';
import { $t } from '#/locales';
import { getLoginRedirect } from '#/utils/auth';

const route = useRoute();
const clients = ref<OAuth2LoginClient[]>([]);
const error = ref('');
const icons: Record<string, string> = {
  'google-logo': 'svg:google',
  'github-logo': 'mdi:github',
  'facebook-logo': 'logos:facebook',
  'apple-logo': 'mdi:apple',
};

async function handleLoad() {
  try {
    const result = await getOAuth2LoginClients();
    clients.value = result.map((client) => {
      const icon = icons[client.icon] || client.icon || 'lucide:key-round';
      return {
        ...client,
        icon: icon.includes(':')
          ? icon
          : `ic:baseline-${icon.replaceAll('_', '-')}`,
      };
    });
  } catch {
    error.value = $t('authentication.oauth2.unavailable');
  }
}

function handleLogin(client: OAuth2LoginClient) {
  try {
    const url = new URL(client.url, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      !/^\/oauth2\/authorization\/[^/]+$/.test(url.pathname)
    ) {
      throw new Error('Invalid OAuth2 authorization URL');
    }
    // prevUri 不支持 fragment，通过查询参数保留站内登录目标。
    url.searchParams.set(
      'prevUri',
      `/auth/login?redirect=${encodeURIComponent(getLoginRedirect(route.query.redirect))}`,
    );
    window.location.assign(url.href);
  } catch {
    error.value = $t('authentication.oauth2.invalidUrl');
  }
}

onMounted(handleLoad);
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md" @keydown.enter.stop>
    <template v-if="clients.length">
      <div class="mt-4 flex items-center gap-4">
        <span class="flex-1 border-b border-input dark:border-gray-600"></span>
        <span class="text-center text-xs text-muted-foreground">
          {{ $t('authentication.oauth2.otherLogin') }}
        </span>
        <span class="flex-1 border-b border-input dark:border-gray-600"></span>
      </div>
      <div
        class="mt-2 grid gap-2"
        :style="{
          gridTemplateColumns: `repeat(${Math.min(clients.length, 4)}, minmax(0, 1fr))`,
        }"
      >
        <button
          v-for="client in clients"
          :key="client.url"
          type="button"
          :aria-label="
            $t('authentication.oauth2.loginWith', { name: client.name })
          "
          class="flex min-w-0 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          @click="handleLogin(client)"
        >
          <IconifyIcon
            :icon="client.icon"
            class="size-5 shrink-0"
            aria-hidden="true"
          />
          <span class="w-full break-words text-center">{{ client.name }}</span>
        </button>
      </div>
    </template>
    <p
      v-if="error || route.query.loginError"
      role="alert"
      class="mt-4 text-sm text-destructive"
    >
      {{ error || $t('authentication.oauth2.failed') }}
    </p>
  </div>
</template>
