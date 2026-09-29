<script setup lang="ts">
import type { ScriptTestResult } from './types';

import { computed } from 'vue';

import { $t } from '#/locales';

import CodeEditor from '../code-editor/code-editor.vue';
import { parseJsonText } from '../code-editor/utils/json';

const props = defineProps<{ result?: ScriptTestResult }>();
const output = computed(() => {
  const text = props.result?.error || props.result?.output || '';
  const json = parseJsonText(text, { required: true });
  return !props.result?.error && json.valid
    ? { language: 'json' as const, text: JSON.stringify(json.value, null, 2) }
    : { language: 'plaintext' as const, text };
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-2 p-2">
    <CodeEditor
      class="min-h-0 flex-1"
      :model-value="output.text"
      :language="output.language"
      :title="
        result?.error
          ? $t('tb.components.scriptTest.sections.testErrorTitle')
          : $t('tb.components.scriptTest.fields.testOutput')
      "
      :aria-label="$t('tb.components.scriptTest.fields.testOutput')"
      :status="result?.error ? 'error' : undefined"
      :placeholder="
        result ? '' : $t('tb.components.scriptTest.messages.testOutputHint')
      "
      height="100%"
      :min-height="0"
      readonly
    />
    <p v-if="result?.error" class="sr-only" role="alert">{{ result.error }}</p>
    <p v-else-if="result?.output" class="sr-only" role="status">
      {{ result.output }}
    </p>
    <p
      v-else-if="result && !result.output"
      role="status"
      class="text-muted-foreground shrink-0 text-sm"
    >
      {{ $t('tb.components.scriptTest.messages.testEmptyOutput') }}
    </p>
  </div>
</template>
