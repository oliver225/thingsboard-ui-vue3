<script setup lang="ts">
/**
 * 安全配置 = JWT Token + API 密钥
 * 页面结构与 password-setting.vue / notification-setting.vue 一致:
 * h3 标题 + 可滚动内容区,使用 Vben 默认样式。
 */
import { $t } from '@vben/locales';

import ApiKey from './api-key.vue';
import JwtToken from './jwt-token.vue';
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <h3 class="text-lg font-bold text-foreground">
      {{ $t('tb.account.security') }}
    </h3>

    <JwtToken />
    <ApiKey class="flex-1" />
  </div>
</template>
