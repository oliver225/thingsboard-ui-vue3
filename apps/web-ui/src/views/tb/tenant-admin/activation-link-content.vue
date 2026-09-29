<script lang="ts" setup>
import type { UserActivationLink } from '#/api/tb/user';

import { computed, ref } from 'vue';

import { useIntervalFn } from '@vueuse/core';

import CopyBlock from '#/components/widget/copy-block.vue';
import { $t } from '#/locales';
import { router } from '#/router';

const props = defineProps<{ activationLinkInfo: UserActivationLink }>();

const activationUrl = computed(() => {
  try {
    const source = new URL(
      props.activationLinkInfo.value,
      window.location.origin,
    );
    const activateToken = source.searchParams.get('activateToken');
    if (!activateToken?.trim()) return '';

    // 使用当前前端域名与路由 base，兼容 history/hash 部署，避免跳到后端站点。
    const { href } = router.resolve({
      name: 'CreatePassword',
      query: { activateToken },
    });
    return new URL(href, window.location.href).href;
  } catch {
    return '';
  }
});
const remainingMs = ref(Math.max(0, props.activationLinkInfo.ttlMs));
const expiresAt = Date.now() + remainingMs.value;
const canActivate = computed(
  () => !!activationUrl.value && remainingMs.value > 0,
);
const { pause } = useIntervalFn(() => {
  remainingMs.value = Math.max(0, expiresAt - Date.now());
  if (remainingMs.value === 0) pause();
}, 1000);

const remainingTime = computed(() => {
  const totalSeconds = Math.ceil(remainingMs.value / 1000);
  return $t('authentication.features.activation.duration', {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  });
});
</script>

<template>
  <div class="min-w-0 space-y-4">
    <p class="text-muted-foreground text-base leading-7">
      {{ $t('authentication.features.activation.description') }}
      <a
        v-if="canActivate"
        :href="activationUrl"
        class="text-primary! underline underline-offset-4"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ $t('authentication.features.activation.linkWord') }}
      </a>
      <span v-else>{{
        $t('authentication.features.activation.linkWord')
      }}</span>
      {{
        remainingMs > 0
          ? $t('authentication.features.activation.expiresIn', {
              duration: remainingTime,
            })
          : $t('authentication.features.activation.expired')
      }}
    </p>
    <CopyBlock :text="activationUrl" :disabled="!canActivate" />
  </div>
</template>
