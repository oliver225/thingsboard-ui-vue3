<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Input,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@vben-core/shadcn-ui';

import { useMediaQuery } from '@vueuse/core';
import { message, Select } from 'antdv-next';

import CodeEditor from '#/adapter/component/code-editor/code-editor.vue';
import ScriptEditor from '#/adapter/component/code-editor/script-editor.vue';
import { parseJsonText } from '#/adapter/component/code-editor/utils/json';
import { getScriptTestError } from '#/adapter/component/code-editor/utils/script-test-errors';
import ScriptTestResult from '#/adapter/component/script-test/result.vue';
import { useScriptTest } from '#/adapter/component/script-test/use-script-test';
import { getRuleNodeDebugInput, testRuleNodeScript } from '#/api/tb/rule-chain';
import { $t } from '#/locales';

import { messageTypeLabels } from './shared/message-type-options';

interface TestData {
  script: string;
  scriptLang: 'JS' | 'TBEL';
  scriptType: string;
  title?: string;
  parameters?: { name: string }[];
  nodeId?: string;
  onApply?: (script: string) => Promise<void> | void;
}
interface MetadataEntry {
  id: number;
  key: string;
  value: string;
}

const emit = defineEmits<{ success: [value: { scriptContent: string }] }>();
const id = useId();
const compact = useMediaQuery('(max-width: 767px)');
const data = ref<TestData>();
const script = ref('');
const msg = ref('');
const msgType = ref('POST_TELEMETRY_REQUEST');
const messageTypeSearch = ref('');
const metadata = ref<MetadataEntry[]>([]);
const submitted = ref(false);
const { action, busy, result, reset, run } = useScriptTest();
let metadataId = 0;

const parameters = computed(
  () =>
    data.value?.parameters ??
    (data.value?.scriptType === 'generate'
      ? ['prevMsg', 'prevMetadata', 'prevMsgType']
      : ['msg', 'metadata', 'msgType']
    ).map((name) => ({ name })),
);
const messageTypes = computed(() =>
  Object.entries(messageTypeLabels).map(([value, label]) => ({
    value,
    label: `${$t(`rule-chain.nodeAction.${label}`)} (${value})`,
  })),
);
const filteredMessageTypes = computed(() => {
  const search = messageTypeSearch.value.trim();
  const options = messageTypes.value.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );
  if (search && !messageTypes.value.some((option) => option.value === search)) {
    options.push({ value: search, label: search });
  }
  return options;
});
const messageError = computed(() => {
  const result = parseJsonText(msg.value, { required: true });
  return result.valid
    ? ''
    : $t(`tb.components.codeEditor.validation.json.${result.error}`);
});
const metadataError = computed(() => {
  const keys = metadata.value.map((entry) => entry.key);
  if (keys.some((key) => !key.trim())) {
    return $t('rule-chain.editor.metadataKeyRequired');
  }
  if (new Set(keys).size !== keys.length) {
    return $t('rule-chain.editor.metadataKeyDuplicate');
  }
  return '';
});
const canSave = computed(
  () =>
    !busy.value && !!script.value.trim() && script.value !== data.value?.script,
);
function setMetadata(values: Record<string, string>) {
  metadata.value = Object.entries(values).map(([key, value]) => ({
    id: ++metadataId,
    key,
    value,
  }));
}
function addMetadata() {
  metadata.value.push({ id: ++metadataId, key: '', value: '' });
}
watch(
  [script, msg, msgType, metadata],
  () => {
    if (action.value !== 'load') reset();
  },
  { deep: true, flush: 'sync' },
);

function testScript(save = false) {
  const request = data.value;
  if (busy.value || !request || (save && !canSave.value)) return;
  submitted.value = true;
  if (messageError.value || metadataError.value || !msgType.value.trim())
    return;
  return run(save ? 'save' : 'test', async (signal) => {
    const testedScript = script.value;
    if (!testedScript.trim()) {
      throw new Error(
        $t('tb.components.scriptTest.validation.testScriptRequired'),
      );
    }
    const response = await testRuleNodeScript(
      {
        script: testedScript,
        scriptType: request.scriptType,
        argNames: parameters.value.map(({ name }) => name),
        msg: msg.value,
        metadata: Object.fromEntries(
          metadata.value.map(({ key, value }) => [key, value]),
        ),
        msgType: msgType.value,
      },
      request.scriptLang,
      signal,
    );
    if (signal.aborted) return;
    result.value = response;
    if (save && !response.error) {
      await request.onApply?.(testedScript);
      if (signal.aborted) return;
      emit('success', { scriptContent: testedScript });
      await modalApi.close();
    }
  });
}

function loadInput(automatic = false) {
  const nodeId = data.value?.nodeId;
  if (!nodeId) return;
  return run(
    'load',
    async (signal) => {
      const input = await getRuleNodeDebugInput(nodeId, signal);
      if (signal.aborted) return;
      if (!input) {
        if (!automatic) message.info($t('rule-chain.editor.noDebugInput'));
        return;
      }
      const payload = parseJsonText(input.data ?? '', { required: true });
      const meta = parseJsonText(input.metadata ?? '', {
        required: true,
        rootType: 'object',
      });
      if (payload.valid) msg.value = JSON.stringify(payload.value, null, 2);
      if (
        meta.valid &&
        meta.value &&
        typeof meta.value === 'object' &&
        Object.values(meta.value).every((value) => typeof value === 'string')
      ) {
        setMetadata(meta.value as Record<string, string>);
      }
      if (input.msgType?.trim()) msgType.value = input.msgType;
    },
    (cause) => {
      message.warning(
        getScriptTestError(cause, $t('rule-chain.editor.debugInputFailed')),
      );
    },
  );
}

const [Modal, modalApi] = useVbenModal<TestData>({
  fullscreen: true,
  closeOnClickModal: false,
  onConfirm: () => testScript(true),
  async onOpenChange(open) {
    reset();
    if (!open) return;
    modalApi.setState({ fullscreen: true });
    data.value = modalApi.getData();
    script.value = data.value?.script ?? '';
    msg.value = JSON.stringify({ temperature: 22.4, humidity: 78 }, null, 2);
    msgType.value = 'POST_TELEMETRY_REQUEST';
    messageTypeSearch.value = '';
    setMetadata({
      deviceName: 'Test Device',
      deviceType: 'default',
      ts: String(Date.now()),
    });
    submitted.value = false;
    await loadInput(true);
  },
});
</script>

<template>
  <Modal
    :title="`${$t('rule-chain.nodeAction.testScriptModal.title')} (${data?.scriptLang === 'TBEL' ? 'TBEL' : 'JavaScript'})`"
    :confirm-text="$t('tb.common.save')"
    :confirm-disabled="!canSave"
    :confirm-loading="action === 'save'"
    class="h-[85dvh] w-[calc(100%_-_2rem)] max-w-[1600px]"
    content-class="flex min-h-0 flex-col overflow-auto p-3 md:overflow-hidden"
    footer-class="gap-2 px-4 py-3"
  >
    <ResizablePanelGroup
      direction="vertical"
      class="min-h-[1100px] flex-1 md:min-h-0"
    >
      <ResizablePanel :default-size="35" :min-size="25">
        <ResizablePanelGroup :direction="compact ? 'vertical' : 'horizontal'">
          <ResizablePanel :default-size="50" :min-size="25">
            <section
              class="flex h-full min-h-0 flex-col gap-2 p-2"
              :aria-label="$t('rule-chain.editor.message')"
            >
              <div class="flex shrink-0 flex-wrap items-center gap-2">
                <label :for="`${id}-message-type`" class="text-sm font-medium">
                  {{ $t('rule-chain.editor.messageType') }}
                </label>
                <Select
                  :id="`${id}-message-type`"
                  :value="msgType || undefined"
                  class="min-w-0 flex-1"
                  :options="filteredMessageTypes"
                  :filter-option="false"
                  show-search
                  allow-clear
                  :disabled="busy"
                  :status="submitted && !msgType.trim() ? 'error' : undefined"
                  :aria-label="$t('rule-chain.editor.messageType')"
                  :aria-invalid="submitted && !msgType.trim()"
                  :aria-describedby="
                    submitted && !msgType.trim()
                      ? `${id}-type-error`
                      : undefined
                  "
                  @update:value="msgType = String($event ?? '')"
                  @search="messageTypeSearch = $event"
                  @open-change="messageTypeSearch = ''"
                />
              </div>
              <p
                v-if="submitted && !msgType.trim()"
                :id="`${id}-type-error`"
                role="alert"
                class="text-destructive text-xs"
              >
                {{ $t('rule-chain.editor.messageTypeRequired') }}
              </p>
              <CodeEditor
                v-model="msg"
                language="json"
                :title="$t('rule-chain.editor.message')"
                :aria-label="$t('rule-chain.editor.message')"
                :aria-describedby="
                  messageError ? `${id}-message-error` : undefined
                "
                :aria-invalid="!!messageError"
                :status="messageError ? 'error' : undefined"
                :readonly="busy"
                class="min-h-0 flex-1"
                height="100%"
                :min-height="0"
              />
              <p
                v-if="messageError"
                :id="`${id}-message-error`"
                role="alert"
                class="text-destructive shrink-0 text-xs"
              >
                {{ messageError }}
              </p>
            </section>
          </ResizablePanel>
          <ResizableHandle
            with-handle
            :aria-label="$t('rule-chain.editor.resizePanels')"
          />
          <ResizablePanel :default-size="50" :min-size="25">
            <section
              class="flex h-full min-h-0 flex-col gap-2 p-2"
              :aria-label="$t('rule-chain.editor.metadata')"
            >
              <div class="flex shrink-0 items-center justify-between gap-2">
                <h3 class="text-sm font-medium">
                  {{ $t('rule-chain.editor.metadata') }}
                </h3>
                <VbenButton
                  variant="outline"
                  size="sm"
                  :disabled="busy"
                  @click="addMetadata"
                >
                  <IconifyIcon
                    icon="lucide:plus"
                    class="mr-1 size-4"
                    aria-hidden="true"
                  />
                  {{ $t('rule-chain.nodeAction.testScriptModal.addMetadata') }}
                </VbenButton>
              </div>
              <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
                <table class="w-full table-fixed text-sm">
                  <thead class="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" class="px-3 py-2 text-left font-medium">
                        {{ $t('rule-chain.nodeAction.testScriptModal.key') }}
                      </th>
                      <th scope="col" class="px-3 py-2 text-left font-medium">
                        {{ $t('rule-chain.nodeAction.testScriptModal.value') }}
                      </th>
                      <th scope="col" class="w-12">
                        <span class="sr-only">{{
                          $t('tb.common.delete')
                        }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(entry, index) in metadata"
                      :key="entry.id"
                      class="border-t"
                    >
                      <td class="p-2">
                        <Input
                          v-model="entry.key"
                          :disabled="busy"
                          :aria-label="`${$t('rule-chain.nodeAction.testScriptModal.key')} ${index + 1}`"
                        />
                      </td>
                      <td class="p-2">
                        <Input
                          v-model="entry.value"
                          :disabled="busy"
                          :aria-label="`${$t('rule-chain.nodeAction.testScriptModal.value')} ${index + 1}`"
                        />
                      </td>
                      <td class="p-1">
                        <VbenButton
                          variant="ghost"
                          size="icon"
                          :disabled="busy"
                          :aria-label="`${$t('tb.common.delete')} ${entry.key || index + 1}`"
                          @click="metadata.splice(index, 1)"
                        >
                          <IconifyIcon
                            icon="lucide:trash-2"
                            class="size-4"
                            aria-hidden="true"
                          />
                        </VbenButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p
                v-if="metadataError"
                role="alert"
                class="text-destructive shrink-0 text-xs"
              >
                {{ metadataError }}
              </p>
            </section>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle
        with-handle
        :aria-label="$t('rule-chain.editor.resizePanels')"
      />
      <ResizablePanel :default-size="65" :min-size="30">
        <ResizablePanelGroup :direction="compact ? 'vertical' : 'horizontal'">
          <ResizablePanel :default-size="50" :min-size="25">
            <div class="flex h-full min-h-0 flex-col p-2">
              <ScriptEditor
                v-model="script"
                :title="
                  data?.title ?? $t('rule-chain.editor.parameters.script')
                "
                :aria-label="$t('rule-chain.editor.parameters.script')"
                :language="data?.scriptLang === 'TBEL' ? 'tbel' : 'javascript'"
                :parameters="parameters"
                :readonly="busy"
                height="100%"
                :min-height="0"
                class="min-h-0 flex-1"
              />
            </div>
          </ResizablePanel>
          <ResizableHandle
            with-handle
            :aria-label="$t('rule-chain.editor.resizePanels')"
          />
          <ResizablePanel :default-size="50" :min-size="25">
            <ScriptTestResult :result="result" :aria-busy="busy" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
    <template #prepend-footer>
      <div class="mr-auto flex flex-wrap items-center gap-2">
        <VbenButton
          :disabled="busy"
          :loading="action === 'test'"
          @click="testScript()"
        >
          <IconifyIcon
            icon="lucide:play"
            class="mr-1 size-4"
            aria-hidden="true"
          />
          {{ $t('rule-chain.nodeAction.testScriptModal.test') }}
        </VbenButton>
        <VbenButton
          v-if="data?.nodeId"
          variant="outline"
          :disabled="busy"
          :loading="action === 'load'"
          @click="loadInput()"
        >
          {{ $t('rule-chain.editor.loadDebugInput') }}
        </VbenButton>
      </div>
    </template>
  </Modal>
</template>
