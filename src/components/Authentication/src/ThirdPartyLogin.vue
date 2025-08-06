<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center justify-between">
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
      <span class="text-muted-foreground text-center text-xs uppercase">
        {{ t('authentication.thirdPartyLogin') }}
      </span>
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex flex-wrap justify-center">
      <Icon class="mb-3" icon="mdi:wechat" />
      <Icon class="mb-3" icon="mdi:qqchat" />
      <Icon class="mb-3" icon="mdi:github" />
      <Icon class="mb-3" icon="mdi:google" />
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from '/@/hooks/web/useI18n';
  const { t } = useI18n('tb');

  import { Icon } from '/@/components/Icon';

  defineOptions({
    name: 'ThirdPartyLogin',
  });
</script>
