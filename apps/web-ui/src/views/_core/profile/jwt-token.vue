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

import { FormSection } from '#/components/form-section';

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
    message.success($t('account.messages.copied'));
  } catch {
    message.error($t('account.messages.copyFailed'));
  }
}
</script>

<template>
  <FormSection
    content-class="flex flex-wrap items-center justify-between gap-4"
    :title="$t('account.fields.jwtToken')"
  >
    <div class="mt-1 text-sm text-foreground">
      {{ $t('account.fields.jwtTokenExpiration') }}: {{ expiration }}
    </div>
    <VbenButton @click="handleCopy">
      {{ $t('account.actions.copyJwtToken') }}
    </VbenButton>
  </FormSection>
</template>
