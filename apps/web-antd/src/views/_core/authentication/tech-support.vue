<script setup lang="ts">
import { h } from 'vue';

import { alert } from '@vben/common-ui';
import { TBV_GITEE_URL, TBV_GITHUB_URL } from '@vben/constants';
import { MdiGithub, MdiGoogle, MdiWechat } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

defineOptions({
  name: 'TechSupport',
});

function handleClickWeChat() {
  alert({
    title: '',
    content: () =>
      h('img', {
        src: '/static/images/weixin.jpg',
        alt: 'WeChat QR Code',
        class: 'w-82',
      }),
    footer: undefined,
  });
}
function handleClickGithub() {
  window.open(TBV_GITHUB_URL, '_blank');
}
function handleClickGitee() {
  window.open(TBV_GITEE_URL, '_blank');
}
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
        <MdiWechat class="h-6 w-6" @click="handleClickWeChat" />
      </VbenIconButton>
      <VbenIconButton class="mb-3">
        <MdiGithub class="h-6 w-6" @click="handleClickGithub" />
      </VbenIconButton>
      <VbenIconButton class="mb-3">
        <MdiGoogle class="h-6 w-6" @click="handleClickGitee" />
      </VbenIconButton>
    </div>
  </div>
</template>
