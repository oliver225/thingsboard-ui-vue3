<script lang="ts" setup>
import { ref } from 'vue';

import { SvgGithubIcon, SvgWeChatIcon } from '@vben/icons';

import { Modal, Tooltip } from 'antdv-next';

import { GITEE_URL, GITHUB_URL } from '#/constants';
import { $t } from '#/locales';

const wechatOpen = ref(false);
const assetBase = import.meta.env.BASE_URL;
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center gap-4">
      <span class="flex-1 border-b border-input dark:border-gray-600"></span>
      <span class="text-center text-xs text-muted-foreground">
        {{ $t('tb.app.techSupport') }}
      </span>
      <span class="flex-1 border-b border-input dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex items-center justify-center gap-3">
      <Tooltip :title="$t('tb.app.wechatQr')">
        <button
          type="button"
          :aria-label="$t('tb.app.wechatQr')"
          aria-haspopup="dialog"
          class="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          @click="wechatOpen = true"
        >
          <SvgWeChatIcon class="size-6" />
        </button>
      </Tooltip>
      <Tooltip title="GitHub">
        <a
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          class="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <SvgGithubIcon class="size-6 dark:invert" />
        </a>
      </Tooltip>
      <Tooltip title="Gitee">
        <a
          :href="GITEE_URL"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Gitee"
          class="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <img
            :src="`${assetBase}login/gitee.png`"
            alt=""
            class="size-6 object-contain"
          />
        </a>
      </Tooltip>
    </div>

    <Modal
      v-model:open="wechatOpen"
      :title="$t('tb.app.wechatQr')"
      :footer="null"
      :width="360"
      centered
    >
      <img
        :src="`${assetBase}login/weixin.png`"
        :alt="$t('tb.app.wechatQr')"
        class="mx-auto my-4 h-auto w-64 max-w-full"
      />
    </Modal>
  </div>
</template>
