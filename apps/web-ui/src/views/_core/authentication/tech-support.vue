<script lang="ts" setup>
/**
 * 登录页「技术支持」区:微信(弹二维码)、GitHub、Gitee
 */
import { SvgGithubIcon, SvgWeChatIcon } from '@vben/icons';

import { Popover, Tooltip } from 'antdv-next';

import { GITEE_URL, GITHUB_URL } from '#/constants/index';
import { $t } from '#/locales';

defineOptions({ name: 'TechSupport' });

/** public 目录静态资源,部署 base 默认为 / */
const WECHAT_QR = '/login/weixin.png';
const GITEE_ICON = '/login/gitee.png';

function openLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center justify-between">
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
      <span class="text-center text-xs text-muted-foreground">
        {{ $t('tb.app.techSupport') }}
      </span>
      <span class="w-[35%] border-b border-input dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex items-center justify-between px-14">
      <!-- 微信:hover/点击弹出二维码 -->
      <Popover trigger="click" :title="null">
        <template #content>
          <img :src="WECHAT_QR" alt="WeChat" class="h-64 w-64 object-cover" />
        </template>
        <Tooltip :title="$t('tb.app.wechatQr')" placement="top">
          <span
            class="cursor-pointer text-3xl text-[#1aad19] transition-transform hover:scale-110"
          >
            <SvgWeChatIcon />
          </span>
        </Tooltip>
      </Popover>

      <!-- GitHub -->
      <Tooltip title="GitHub" placement="top">
        <span
          class="cursor-pointer text-3xl transition-transform hover:scale-110"
          @click="openLink(GITHUB_URL)"
        >
          <SvgGithubIcon />
        </span>
      </Tooltip>

      <!-- Gitee -->
      <Tooltip title="Gitee" placement="top">
        <img
          :src="GITEE_ICON"
          alt="Gitee"
          class="h-[30px] w-[30px] cursor-pointer object-contain transition-transform hover:scale-110"
          @click="openLink(GITEE_URL)"
        />
      </Tooltip>
    </div>
  </div>
</template>
