<script setup lang="ts">
import { $t } from '@vben/locales';

import JwtToken from './jwt-token.vue';
import PasswordSetting from './password-setting.vue';
</script>
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <header
      class="flex min-h-[66px] shrink-0 items-center justify-between gap-4 border-b border-border p-4 md:px-6 md:py-[18px]"
    >
      <h2
        class="m-0 text-[length:var(--font-size-base)] font-semibold leading-6"
      >
        {{ $t('account.sections.security') }}
      </h2>
    </header>
    <div class="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-6">
      <div
        class="m-0 w-full min-w-0 max-w-[1040px] space-y-5 text-sm [&_.ant-form-item]:mb-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:font-medium [&_.ant-input-number]:w-full [&_.ant-select]:w-full"
      >
        <JwtToken class="shrink-0" />
        <PasswordSetting />
      </div>
    </div>
  </section>
</template>
