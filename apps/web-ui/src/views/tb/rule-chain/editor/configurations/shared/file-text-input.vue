<script setup lang="ts">
import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, TextArea } from 'antdv-next';

import JsonEditor from '#/adapter/component/code-editor/json-editor.vue';
import { $t } from '#/locales';

defineProps<{ fileName?: string; json?: boolean }>();
const emit = defineEmits<{ select: [name: string] }>();
const value = defineModel<string>();
const input = ref<HTMLInputElement>();

async function handleFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    value.value = await file.text();
    emit('select', file.name);
  } catch {
    message.error($t('rule-chain.config.readFileError'));
  } finally {
    target.value = '';
  }
}
</script>

<template>
  <div class="w-full min-w-0 space-y-2">
    <div class="flex min-w-0 items-center gap-3">
      <VbenButton
        type="button"
        variant="outline"
        size="sm"
        @click="input?.click()"
      >
        <IconifyIcon icon="lucide:upload" class="mr-2 size-4" />
        {{ $t('rule-chain.config.selectFile') }}
      </VbenButton>
      <span
        v-if="fileName"
        class="text-muted-foreground truncate text-xs"
        :title="fileName"
        v-text="fileName"
      ></span>
    </div>
    <input
      ref="input"
      type="file"
      class="hidden"
      :accept="json ? '.json' : '.pem,.crt,.key,.cer,.txt'"
      @change="handleFile"
    />
    <JsonEditor v-if="json" v-model="value" :height="220" />
    <TextArea
      v-else
      v-model:value="value"
      :rows="4"
      class="font-mono text-xs"
    />
  </div>
</template>
