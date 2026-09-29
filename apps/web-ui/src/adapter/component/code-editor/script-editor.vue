<script setup lang="ts">
import type {
  CodeEditorApi,
  CodeEditorSlots,
  EditorMarker,
  ScriptEditorProps,
} from './types';

import { computed, ref, watch } from 'vue';

import CodeEditor from './code-editor.vue';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ScriptEditorProps>(), {
  language: 'tbel',
  modelValue: '',
  toolbar: true,
});
const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [value: string];
  error: [error: Error];
  focus: [event: FocusEvent];
  ready: [api: CodeEditorApi];
  'update:modelValue': [value: string];
  validate: [markers: EditorMarker[]];
}>();
defineSlots<CodeEditorSlots>();
const editorRef = ref<CodeEditorApi>();
const draft = ref(props.modelValue ?? '');
const testing = ref(false);
const editorProps = computed(() => {
  const { testHandler: _handler, ...options } = props;
  return options;
});
watch(
  () => props.modelValue,
  (value) => {
    draft.value = value ?? '';
  },
);

function updateDraft(value: string) {
  if (props.disabled || props.readonly) return;
  draft.value = value;
  emit('update:modelValue', value);
  emit('change', value);
}

async function testScript(script: string) {
  if (
    !props.testHandler ||
    props.disabled ||
    props.readonly ||
    props.testDisabled ||
    props.testLoading ||
    testing.value
  )
    return;
  testing.value = true;
  try {
    await props.testHandler(script);
  } catch (error) {
    emit('error', error instanceof Error ? error : new Error(String(error)));
  } finally {
    testing.value = false;
  }
}

const api: CodeEditorApi = {
  blur: () => editorRef.value?.blur(),
  exitFullscreen: () => editorRef.value?.exitFullscreen(),
  focus: () => editorRef.value?.focus(),
  format: async () => {
    await editorRef.value?.format();
  },
  getModelUri: () => editorRef.value?.getModelUri(),
  getValue: () => draft.value,
  layout: () => editorRef.value?.layout(),
  setValue: updateDraft,
};
function onReady(editor: CodeEditorApi) {
  editorRef.value = editor;
  emit('ready', api);
}
defineExpose(api);
</script>

<template>
  <CodeEditor
    v-bind="{ ...$attrs, ...editorProps }"
    :model-value="draft"
    :testable="!!testHandler"
    :test-loading="testLoading || testing"
    @update:model-value="updateDraft"
    @test="testScript"
    @blur="emit('blur', $event)"
    @focus="emit('focus', $event)"
    @ready="onReady"
    @error="emit('error', $event)"
    @validate="emit('validate', $event)"
  >
    <template v-if="$slots['toolbar-start']" #toolbar-start>
      <slot name="toolbar-start"></slot>
    </template>
  </CodeEditor>
</template>
