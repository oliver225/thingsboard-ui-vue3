<script setup lang="ts">
import type * as Monaco from 'monaco-editor/editor';

import type {
  CodeEditorApi,
  CodeEditorProps,
  CodeEditorSlots,
  EditorMarker,
} from './types';

import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from 'vue';

import { VbenButton, VbenTooltip } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { usePreferences } from '@vben/preferences';

import { useEditorFullscreen } from './composables/use-editor-fullscreen';
import { onFormatError } from './formatters/provider';
import { setScriptParameters } from './languages/script-parameters';
import { loadMonaco } from './runtime/loader';

interface ToolbarAction {
  disabled: boolean;
  icon: string;
  key: string;
  label: string;
  loading?: boolean;
  pressed?: boolean;
  run: () => Promise<void> | void;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CodeEditorProps>(), {
  height: 240,
  language: 'plaintext',
  markers: () => [],
  minHeight: 120,
  minimap: false,
  modelValue: '',
  parameters: () => [],
  title: '',
  toolbar: true,
  wordWrap: 'on',
});

const emit = defineEmits<{
  blur: [event: FocusEvent];
  change: [value: string];
  error: [error: Error];
  focus: [event: FocusEvent];
  ready: [api: CodeEditorApi];
  test: [value: string];
  'update:modelValue': [value: string];
  validate: [markers: EditorMarker[]];
}>();

defineSlots<CodeEditorSlots>();

const attrs = useAttrs();
const { isDark } = usePreferences();
const root = ref<HTMLDivElement>();
const container = ref<HTMLDivElement>();
const loadState = ref<'error' | 'loading' | 'ready'>('loading');
const {
  fullscreenPortal,
  isFullscreen,
  leaveFullscreen,
  popoverToggled,
  toggleFullscreen,
} = useEditorFullscreen({
  root,
  disabled: () => props.disabled,
  focus,
  layout,
  reportError,
});
const formatting = ref(false);
const formatFailed = ref(false);
const isReadonly = computed(() => props.disabled || props.readonly);
const canFormat = computed(() =>
  ['javascript', 'json', 'protobuf', 'tbel'].includes(props.language),
);
const canTest = computed(
  () => props.testable && ['javascript', 'tbel'].includes(props.language),
);
// Monaco registers Protocol Buffers under "proto", with "protobuf" as an alias.
const modelLanguage = computed(() =>
  props.language === 'protobuf' ? 'proto' : props.language,
);
const editorLabel = computed(
  () =>
    props.ariaLabel ??
    (attrs['aria-label'] as string | undefined) ??
    $t('tb.components.codeEditor.menu'),
);
const containerStyle = computed(() => ({
  height: isFullscreen.value ? '100%' : cssSize(props.height),
  minHeight: isFullscreen.value ? '0' : cssSize(props.minHeight),
}));

const toolbarActions = computed(() => {
  const actions: ToolbarAction[] = [];
  const editingBlocked = loadState.value !== 'ready' || isReadonly.value;
  if (canTest.value)
    actions.push({
      key: 'test',
      icon: 'lucide:bug',
      label: $t('tb.components.codeEditor.actions.test'),
      disabled: editingBlocked || props.testDisabled || props.testLoading,
      loading: props.testLoading,
      run: testScript,
    });
  if (canFormat.value)
    actions.push({
      key: 'format',
      icon: 'lucide:align-left',
      label: $t('tb.components.codeEditor.actions.format'),
      disabled: editingBlocked || formatting.value,
      run: format,
    });
  actions.push({
    key: 'fullscreen',
    icon: isFullscreen.value ? 'lucide:minimize' : 'lucide:maximize',
    label: $t(
      `tb.components.codeEditor.actions.${isFullscreen.value ? 'exitFullscreen' : 'fullscreen'}`,
    ),
    disabled: props.disabled && !isFullscreen.value,
    pressed: isFullscreen.value,
    run: toggleFullscreen,
  });
  return actions;
});

let monaco: typeof Monaco | undefined;
let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
let model: Monaco.editor.ITextModel | undefined;
let resizeObserver: ResizeObserver | undefined;
let layoutFrame: number | undefined;
let mountVersion = 0;
let disposed = false;
let applyingValue = false;
let composing = false;
let deferredValue: string | undefined;
let localValue = props.modelValue ?? '';
let lastPublishedValue = props.modelValue ?? '';
let clearScriptParameters: (() => void) | undefined;
const subscriptions: Monaco.IDisposable[] = [];
const markerOwner = 'tb-code-editor';

function cssSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function reportError(error: unknown) {
  emit('error', error instanceof Error ? error : new Error(String(error)));
}

function layout() {
  if (disposed || layoutFrame !== undefined) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = undefined;
    if (container.value?.clientWidth && container.value.clientHeight) {
      editor?.layout();
    }
  });
}

function focus() {
  editor?.focus();
}

function blur() {
  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLElement &&
    container.value?.contains(activeElement)
  ) {
    activeElement.blur();
  }
}

function getValue() {
  return model?.getValue() ?? localValue;
}

function getModelUri() {
  return model?.uri.toString();
}

function publishValue() {
  if (applyingValue || composing) return;
  const value = getValue();
  localValue = value;
  formatFailed.value = false;
  if (lastPublishedValue === value) return;
  lastPublishedValue = value;
  emit('update:modelValue', value);
  emit('change', value);
}

/** Parent echoes must not reset selection or undo history. */
function applyValue(value: string) {
  formatFailed.value = false;
  localValue = value;
  lastPublishedValue = value;
  if (!editor || !model || model.getValue() === value) return;
  applyingValue = true;
  try {
    const selection = editor.getSelection();
    const selections = selection ? [selection] : null;
    // Model updates remain valid when readonly Monaco rejects editor commands.
    model.pushStackElement();
    model.pushEditOperations(
      selections,
      [{ range: model.getFullModelRange(), text: value }],
      () => selections,
    );
    model.pushStackElement();
    if (selection) editor.setSelection(selection);
  } finally {
    applyingValue = false;
  }
}

function setValue(value: string) {
  if (isReadonly.value) return;
  const previousValue = lastPublishedValue;
  applyValue(value);
  lastPublishedValue = previousValue;
  publishValue();
}

async function format() {
  if (!editor || isReadonly.value || !canFormat.value || formatting.value)
    return;
  formatting.value = true;
  formatFailed.value = false;
  try {
    await editor.getAction('editor.action.formatDocument')?.run();
  } catch (error) {
    formatFailed.value = true;
    reportError(error);
  } finally {
    formatting.value = false;
  }
}

async function testScript() {
  if (
    !canTest.value ||
    isReadonly.value ||
    props.testDisabled ||
    props.testLoading
  )
    return;
  if (isFullscreen.value) {
    leaveFullscreen(false);
    await nextTick();
  }
  emit('test', getValue());
}

function syncScriptParameters() {
  clearScriptParameters?.();
  clearScriptParameters = undefined;
  if (model && ['javascript', 'tbel'].includes(props.language)) {
    clearScriptParameters = setScriptParameters(
      model.uri.toString(),
      props.parameters,
    );
  }
}

function severity(value: EditorMarker['severity']): Monaco.MarkerSeverity {
  if (!monaco) throw new Error('Monaco is not ready');
  const levels = monaco.MarkerSeverity;
  switch (value) {
    case 'error': {
      return levels.Error;
    }
    case 'warning': {
      return levels.Warning;
    }
    case 'info': {
      return levels.Info;
    }
    default: {
      return levels.Hint;
    }
  }
}

function setMarkers() {
  if (!monaco || !model) return;
  monaco.editor.setModelMarkers(
    model,
    markerOwner,
    props.markers.map((marker) => ({
      ...marker,
      severity: severity(marker.severity),
    })),
  );
}

function publishDiagnostics() {
  if (!monaco || !model) return;
  const levels = monaco.MarkerSeverity;
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });
  emit(
    'validate',
    markers.map((marker): EditorMarker => {
      let level: EditorMarker['severity'] = 'hint';
      if (marker.severity === levels.Error) level = 'error';
      else if (marker.severity === levels.Warning) level = 'warning';
      else if (marker.severity === levels.Info) level = 'info';
      return {
        code:
          typeof marker.code === 'string' ? marker.code : marker.code?.value,
        endColumn: marker.endColumn,
        endLineNumber: marker.endLineNumber,
        message: marker.message,
        severity: level,
        source: marker.source,
        startColumn: marker.startColumn,
        startLineNumber: marker.startLineNumber,
      };
    }),
  );
}

function syncAccessibility() {
  const input = container.value?.querySelector('textarea.inputarea');
  if (!input) return;
  const attributes: Record<string, unknown> = {
    'aria-describedby': attrs['aria-describedby'],
    'aria-disabled': props.disabled || undefined,
    'aria-invalid': props.status === 'error' || attrs['aria-invalid'],
    'aria-label': editorLabel.value,
    'aria-labelledby': attrs['aria-labelledby'],
    'aria-readonly': isReadonly.value || undefined,
    id: props.id,
  };
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) input.removeAttribute(name);
    else input.setAttribute(name, String(value));
  }
}

function editorOptions(): Monaco.editor.IEditorOptions {
  return {
    ariaLabel: editorLabel.value,
    ariaRequired:
      attrs['aria-required'] === true || attrs['aria-required'] === 'true',
    domReadOnly: isReadonly.value,
    minimap: { enabled: props.minimap },
    placeholder: props.placeholder,
    readOnly: isReadonly.value,
    tabIndex: props.disabled ? -1 : Number(attrs.tabindex ?? 0),
    wordWrap: props.wordWrap,
  };
}

function disposeEditor() {
  clearScriptParameters?.();
  clearScriptParameters = undefined;
  for (const subscription of subscriptions.splice(0)) subscription.dispose();
  editor?.dispose();
  editor = undefined;
  model?.dispose();
  model = undefined;
}

async function initialize() {
  const version = ++mountVersion;
  loadState.value = 'loading';
  try {
    const runtime = await loadMonaco();
    if (disposed || version !== mountVersion || !container.value) return;
    monaco = runtime;
    monaco.editor.setTheme(isDark.value ? 'vs-dark' : 'vs');
    model = monaco.editor.createModel(localValue, modelLanguage.value);
    lastPublishedValue = localValue;
    editor = monaco.editor.create(container.value, {
      ...editorOptions(),
      automaticLayout: false,
      editContext: false,
      fixedOverflowWidgets: false,
      fontSize: 13,
      lineNumbersMinChars: 3,
      model,
      padding: { bottom: 12, top: 12 },
      scrollBeyondLastLine: false,
      scrollbar: {
        horizontalScrollbarSize: 8,
        verticalScrollbarSize: 8,
      },
      tabSize: 2,
    });
    subscriptions.push(
      {
        dispose: onFormatError(model.uri.toString(), (error) => {
          formatFailed.value = true;
          reportError(error);
        }),
      },
      model.onDidChangeContent(publishValue),
      editor.onDidCompositionStart(() => {
        composing = true;
      }),
      editor.onDidCompositionEnd(() => {
        composing = false;
        if (deferredValue === undefined) {
          publishValue();
        } else {
          const value = deferredValue;
          deferredValue = undefined;
          applyValue(value);
        }
      }),
      monaco.editor.onDidChangeMarkers((resources) => {
        if (
          resources.some((resource) => resource.toString() === getModelUri())
        ) {
          publishDiagnostics();
        }
      }),
    );
    setMarkers();
    syncScriptParameters();
    syncAccessibility();
    layout();
    emit('ready', api);
    publishDiagnostics();
  } catch (error) {
    if (disposed || version !== mountVersion) return;
    disposeEditor();
    loadState.value = 'error';
    reportError(error);
  } finally {
    if (!disposed && version === mountVersion && loadState.value === 'loading')
      loadState.value = 'ready';
  }
}

function onFocusIn(event: FocusEvent) {
  if (!container.value?.contains(event.relatedTarget as Node | null)) {
    emit('focus', event);
  }
}

function onFocusOut(event: FocusEvent) {
  if (!container.value?.contains(event.relatedTarget as Node | null)) {
    emit('blur', event);
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (composing) deferredValue = value ?? '';
    else applyValue(value ?? '');
  },
);
watch(modelLanguage, (language) => {
  if (model) monaco?.editor.setModelLanguage(model, language);
  syncScriptParameters();
});
watch(() => props.parameters, syncScriptParameters, { deep: true });
watch(isDark, (dark) => monaco?.editor.setTheme(dark ? 'vs-dark' : 'vs'));
watch(() => props.markers, setMarkers, { deep: true });
watch(
  () => [
    isReadonly.value,
    props.disabled,
    props.placeholder,
    props.minimap,
    props.wordWrap,
    editorLabel.value,
  ],
  () => {
    editor?.updateOptions(editorOptions());
    syncAccessibility();
  },
);
watch(containerStyle, () => void nextTick(layout));
onUpdated(syncAccessibility);
onActivated(layout);
onMounted(() => {
  resizeObserver = new ResizeObserver(layout);
  if (container.value) resizeObserver.observe(container.value);
  void initialize();
});
onBeforeUnmount(() => {
  disposed = true;
  mountVersion++;
  resizeObserver?.disconnect();
  if (layoutFrame !== undefined) cancelAnimationFrame(layoutFrame);
  disposeEditor();
});

const api: CodeEditorApi = {
  blur,
  exitFullscreen: () => leaveFullscreen(false),
  focus,
  format,
  getModelUri,
  getValue,
  layout,
  setValue,
};
defineExpose(api);
</script>

<template>
  <Teleport to="body" :disabled="!isFullscreen || !fullscreenPortal">
    <div
      ref="root"
      v-bind="$attrs"
      class="tb-code-editor bg-background relative flex w-full min-w-0 flex-col overflow-hidden rounded-lg border shadow-xs"
      :class="{
        'opacity-60': disabled,
        'tb-code-editor--fullscreen': isFullscreen,
      }"
      :aria-busy="loadState === 'loading'"
      :data-disabled="disabled || undefined"
      :data-status="status"
      @toggle="popoverToggled"
    >
      <div
        v-if="toolbar"
        class="tb-code-editor__toolbar bg-muted/30 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-2 py-1"
      >
        <div
          class="text-foreground flex min-w-0 flex-1 items-center gap-2 text-sm font-medium"
        >
          <slot name="toolbar-start">
            <span v-if="title" class="truncate" :title="title">
              {{ title }}
            </span>
          </slot>
        </div>
        <div
          class="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1"
        >
          <span
            class="tb-code-editor__language mr-1 shrink-0 select-none rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium leading-4 tracking-wide uppercase"
          >
            {{ language }}
          </span>
          <VbenTooltip
            v-for="action in toolbarActions"
            :key="action.key"
            side="top"
            :portal-target="isFullscreen ? root : undefined"
          >
            <template #trigger>
              <VbenButton
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 w-7 shrink-0 rounded-sm p-0 text-black dark:text-white"
                tabindex="0"
                :disabled="action.disabled"
                :loading="action.loading"
                :aria-label="action.label"
                :aria-pressed="action.pressed"
                @click="action.run"
              >
                <IconifyIcon
                  :icon="action.icon"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </VbenButton>
            </template>
            {{ action.label }}
          </VbenTooltip>
        </div>
      </div>
      <p
        v-if="formatFailed"
        role="alert"
        class="text-destructive shrink-0 px-3 py-1 text-sm"
      >
        {{ $t('tb.components.codeEditor.messages.formatError') }}
      </p>
      <div class="relative min-h-0 min-w-0 flex-1">
        <div
          ref="container"
          class="w-full min-w-0"
          :style="containerStyle"
          @focusin="onFocusIn"
          @focusout="onFocusOut"
        ></div>
        <div
          v-if="loadState !== 'ready'"
          class="bg-background text-muted-foreground absolute inset-0 flex items-center justify-center gap-2 text-sm"
          :role="loadState === 'error' ? 'alert' : 'status'"
        >
          <template v-if="loadState === 'error'">
            {{ $t('tb.components.codeEditor.messages.loadError') }}
            <VbenButton
              type="button"
              size="sm"
              variant="outline"
              @click="initialize"
            >
              {{ $t('tb.components.codeEditor.actions.retry') }}
            </VbenButton>
          </template>
          <template v-else>
            <IconifyIcon
              icon="lucide:loader-circle"
              class="size-4 animate-spin"
              aria-hidden="true"
            />
            {{ $t('tb.components.codeEditor.messages.loading') }}
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped src="./styles/code-editor.css"></style>
