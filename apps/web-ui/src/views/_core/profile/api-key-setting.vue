<script setup lang="ts">
import { useUserStore } from '@vben/stores';

import { $t } from '#/locales';
import ApiKeyList from '#/views/tb/api-key/list.vue';

const userStore = useUserStore();
</script>
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <header
      class="flex min-h-[66px] shrink-0 items-center border-b border-border p-4 md:px-6 md:py-[18px]"
    >
      <h2
        class="m-0 text-[length:var(--font-size-base)] font-semibold leading-6"
      >
        {{ $t('api-key.menu') }}
      </h2>
    </header>
    <div class="min-h-0 flex-1">
      <ApiKeyList
        v-if="userStore.userInfo?.userId"
        :key="userStore.userInfo.userId"
        :user-id="userStore.userInfo.userId"
      />
    </div>
  </section>
</template>
