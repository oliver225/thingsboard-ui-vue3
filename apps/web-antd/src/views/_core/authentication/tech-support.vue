<script setup lang="ts">
import { MdiGithub, MdiGoogle, MdiWechat } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

defineOptions({
  name: 'ThirdPartyLogin',
});
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center justify-between">
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
      <span class="text-muted-foreground text-center text-xs uppercase">
        {{ $t('authentication.techSupport') }}
      </span>
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
    </div>

    <div class="mx-20 mt-4 flex flex-wrap justify-between">
      <VbenIconButton class="mb-3">
        <MdiWechat class="h-6 w-6" />
      </VbenIconButton>
      <VbenIconButton class="mb-3">
        <MdiGithub class="h-6 w-6" />
      </VbenIconButton>
      <VbenIconButton class="mb-3">
        <MdiGoogle class="h-6 w-6" />
      </VbenIconButton>
    </div>
  </div>
</template>
