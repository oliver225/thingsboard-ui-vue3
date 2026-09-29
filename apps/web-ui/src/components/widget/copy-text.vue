<script setup lang="ts">
import { computed, ref } from 'vue';

import { VbenIconButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { message } from 'antdv-next';

import { $t } from '#/locales';

const props = withDefaults(
  defineProps<{
    text?: null | string;
    /** 显示内容可与复制内容不同，例如密钥掩码。 */
    displayText?: string;
    disabled?: boolean;
    /** 超长文本默认显示省略号；false 时直接裁切。 */
    ellipsis?: boolean;
  }>(),
  { text: undefined, displayText: undefined, disabled: false, ellipsis: true },
);

const { copy } = useClipboard({ legacy: true });
const copying = ref(false);
const content = computed(() => props.displayText ?? props.text ?? '—');
const canCopy = computed(() => !props.disabled && !!props.text);

async function handleCopy() {
  if (!canCopy.value || !props.text || copying.value) return;
  copying.value = true;
  try {
    await copy(props.text);
    message.success($t('tb.components.copyText.copySuccess'));
  } catch {
    message.error($t('tb.components.copyBlock.messages.copyFailed'));
  } finally {
    copying.value = false;
  }
}
</script>

<template>
  <span
    class="copy-text inline-flex max-w-full min-w-0 items-center gap-1 align-middle"
  >
    <span
      class="min-w-0 overflow-hidden whitespace-nowrap"
      :class="ellipsis ? 'text-ellipsis' : 'text-clip'"
      :title="content"
      >{{ content }}</span>
    <VbenIconButton
      v-if="canCopy"
      type="button"
      class="copy-text-button size-7 shrink-0 rounded-md"
      :title="$t('tb.common.copy')"
      :aria-label="$t('tb.common.copy')"
      :disabled="copying"
      @click.stop="handleCopy"
    >
      <IconifyIcon icon="lucide:copy" class="size-3.5" aria-hidden="true" />
    </VbenIconButton>
  </span>
</template>

<style scoped>
/* 保留按钮位置，悬停时文字和列宽不会跳动。 */
.copy-text-button {
  pointer-events: none;
  opacity: 0;
}

.copy-text:hover .copy-text-button,
.copy-text-button:focus-visible {
  pointer-events: auto;
  opacity: 1;
}

/* 触屏设备没有悬停，始终提供复制入口。 */
@media (hover: none) {
  .copy-text-button {
    pointer-events: auto;
    opacity: 1;
  }
}
</style>
