<script setup lang="ts">
import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { message } from 'antdv-next';

import { $t } from '#/locales';

const props = defineProps<{
  text: string;
  buttonText?: string;
  disabled?: boolean;
}>();

const { copy } = useClipboard({ legacy: true });

async function handleCopy() {
  if (props.disabled || !props.text) return;
  try {
    await copy(props.text);
    message.success($t('tb.common.copySuccess'));
  } catch {
    message.error($t('tb.components.copyBlock.messages.copyFailed'));
  }
}
</script>

<template>
  <div class="flex w-full min-w-0 items-center gap-2">
    <div
      class="bg-muted/50 border-input h-10 min-w-0 flex-1 overflow-hidden rounded-md border px-3 transition-colors duration-200 hover:border-primary focus-within:border-primary"
    >
      <div
        class="copy-block-scroll h-full overflow-x-auto overflow-y-hidden whitespace-nowrap text-sm leading-9 outline-none"
        role="region"
        tabindex="0"
        :aria-label="$t('tb.components.copyBlock.fields.content')"
      >
        {{ text }}
      </div>
    </div>
    <VbenButton
      type="button"
      variant="outline"
      class="h-10 shrink-0"
      :disabled="disabled || !text"
      @click="handleCopy"
    >
      <IconifyIcon icon="lucide:copy" class="mr-2 size-4" aria-hidden="true" />
      {{ buttonText || $t('tb.components.copyBlock.actions.copy') }}
    </VbenButton>
  </div>
</template>

<style scoped>
/* 边框由外层绘制，滚动条在内侧，避免覆盖高亮圆角。 */
.copy-block-scroll {
  scrollbar-color: auto;
  scrollbar-width: auto;
}

.copy-block-scroll::-webkit-scrollbar {
  height: 5px;
}

.copy-block-scroll::-webkit-scrollbar-button {
  display: none;
  width: 0;
  height: 0;
}

.copy-block-scroll::-webkit-scrollbar-track {
  cursor: pointer;
  background: transparent;
}

.copy-block-scroll::-webkit-scrollbar-thumb {
  cursor: pointer;
  background: hsl(var(--muted-foreground) / 35%);
  border-radius: 999px;
}

@supports not selector(::-webkit-scrollbar) {
  .copy-block-scroll {
    scrollbar-width: thin;
  }
}
</style>
