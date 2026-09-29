<script setup lang="ts">
import type {
  CodeEditorApi,
  CodeEditorSlots,
  EditorMarker,
  JsonEditorApi,
  JsonEditorProps,
  JsonValidationResult,
} from './types';

import { computed, ref, useId, watch } from 'vue';

import { $t } from '#/locales';

import CodeEditor from './code-editor.vue';
import { parseJsonText, parseJsonTextOrThrow } from './utils/json';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<JsonEditorProps>(), {
  modelValue: '',
  required: false,
  rootType: 'any',
  showValidationMessage: true,
  toolbar: true,
});
const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [value: string];
  diagnostics: [markers: EditorMarker[]];
  error: [error: Error];
  focus: [event: FocusEvent];
  ready: [api: JsonEditorApi];
  'update:modelValue': [value: string];
  validate: [result: JsonValidationResult];
}>();
defineSlots<CodeEditorSlots>();
const editorRef = ref<CodeEditorApi>();
const draft = ref(props.modelValue ?? '');
const errorId = `${useId()}-json-error`;
const validation = computed(() => parseJsonText(draft.value, props));
const errorMessage = computed(() =>
  validation.value.valid
    ? ''
    : $t(`tb.components.codeEditor.validation.json.${validation.value.error}`),
);
const editorProps = computed(() => {
  const {
    required: _required,
    rootType: _rootType,
    showValidationMessage: _showValidationMessage,
    ...options
  } = props;
  return options;
});

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value ?? '';
  },
);
watch(validation, (result) => emit('validate', result), {
  flush: 'sync',
  immediate: true,
});

function updateDraft(value: string) {
  if (props.disabled || props.readonly) return;
  draft.value = value;
  emit('update:modelValue', value);
  emit('change', value);
}

const api: JsonEditorApi = {
  blur: () => editorRef.value?.blur(),
  exitFullscreen: () => editorRef.value?.exitFullscreen(),
  focus: () => editorRef.value?.focus(),
  format: async () => {
    if (validation.value.valid) await editorRef.value?.format();
  },
  getModelUri: () => editorRef.value?.getModelUri(),
  getParsedValue: () => parseJsonTextOrThrow(draft.value, props),
  getValue: () => draft.value,
  layout: () => editorRef.value?.layout(),
  setValue: (value) => {
    updateDraft(value);
  },
  validate: () => validation.value,
};
function onReady(editor: CodeEditorApi) {
  editorRef.value = editor;
  emit('ready', api);
}
defineExpose(api);
</script>

<template>
  <div class="w-full min-w-0" :class="$attrs.class" :style="$attrs.style">
    <CodeEditor
      v-bind="{ ...$attrs, ...editorProps, class: undefined, style: undefined }"
      language="json"
      :model-value="draft"
      :status="errorMessage ? 'error' : status"
      :aria-invalid="errorMessage ? 'true' : $attrs['aria-invalid']"
      :aria-describedby="
        [
          $attrs['aria-describedby'],
          showValidationMessage && errorMessage ? errorId : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined
      "
      @update:model-value="updateDraft"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @ready="onReady"
      @error="emit('error', $event)"
      @validate="emit('diagnostics', $event)"
    >
      <template v-if="$slots['toolbar-start']" #toolbar-start>
        <slot name="toolbar-start"></slot>
      </template>
    </CodeEditor>
    <p
      v-if="showValidationMessage && errorMessage"
      :id="errorId"
      role="alert"
      class="text-destructive mt-1 text-sm"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
