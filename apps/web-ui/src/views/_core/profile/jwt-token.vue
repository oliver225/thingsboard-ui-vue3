<script lang="ts" setup>
/**
 * JWT Token:vben 默认设置行样式(标题 + 有效期 + 复制按钮)
 */
import { computed } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useAccessStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { message } from 'antdv-next';

defineOptions({ name: 'AccountJwtToken' });

const accessStore = useAccessStore();

/** 解析 JWT payload(无需额外依赖) */
function decodeJwt(token?: null | string): null | Record<string, any> {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const binary = atob(part.replaceAll('-', '+').replaceAll('_', '/'));
    const json = decodeURIComponent(
      [...binary]
        .map((c) => `%${(c.codePointAt(0) ?? 0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const expiration = computed(() => {
  const payload = decodeJwt(accessStore.accessToken);
  return payload?.exp ? formatDateTime(payload.exp * 1000) : '-';
});

async function handleCopy() {
  const token = accessStore.accessToken;
  if (!token) return;
  try {
    await navigator.clipboard.writeText(`Bearer ${token}`);
    message.success($t('tb.account.copied'));
  } catch {
    message.error($t('tb.account.copyFailed'));
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4"
  >
    <div>
      <div class="text-lg font-semibold">
        {{ $t('tb.account.jwtToken') }}
      </div>
      <div class="mt-1 text-sm text-foreground">
        {{ $t('tb.account.jwtTokenExpiration') }}: {{ expiration }}
      </div>
    </div>
    <VbenButton @click="handleCopy">
      {{ $t('tb.account.copyJwtToken') }}
    </VbenButton>
  </div>
</template>
