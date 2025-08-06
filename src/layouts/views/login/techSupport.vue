<script setup lang="ts">
  import { h } from 'vue';

  import { useI18n } from '/@/hooks/web/useI18n';
  import { GITHUB_URL } from '/@/settings/siteSetting';
  import Icon from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';

  defineOptions({
    name: 'TechSupport',
  });

  const { t } = useI18n();
  const { showMessageModal } = useMessage();

  function handleClickWeChat() {
    showMessageModal({
      title: '',
      content: () =>
        h('img', {
          src: '/resource/img/weixin.jpg',
          alt: 'WeChat QR Code',
          class: 'w-82',
        }),
    });
  }
  function handleClickGithub() {
    window.open(GITHUB_URL, '_blank');
  }
  function handleClickGitee() {
    window.open(GITHUB_URL, '_blank');
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
      <Icon class="cursor-pointer" icon="i-ant-design:wechat-outlined" :size="28" @click="handleClickWeChat" />
      <Icon class="cursor-pointer" icon="i-ant-design:github-outlined" :size="28" @click="handleClickGithub" />
      <Icon class="cursor-pointer p-0.4" icon="icons/gitee.png" :size="28" @click="handleClickGitee" />
    </div>
  </div>
</template>
