<script setup lang="ts">
import type { ScriptTestData } from './types';

import { computed, ref, watch } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@vben-core/shadcn-ui';

import { useMediaQuery } from '@vueuse/core';
import { Spin } from 'antdv-next';

import CodeEditor from '#/adapter/component/code-editor/code-editor.vue';
import {
  createScriptParameters,
  createTestArguments,
} from '#/adapter/component/field-arguments/data';
import { testCalculatedFieldScript } from '#/api/tb/calculated-field';
import { $t } from '#/locales';

import ScriptTestArguments from './arguments.vue';
import ScriptTestResult from './result.vue';
import { useScriptTest } from './use-script-test';

const compact = useMediaQuery('(max-width: 767px)');
const argumentsEditor = ref<InstanceType<typeof ScriptTestArguments>>();
const data = ref<ScriptTestData>();
const expression = ref('');
const samples = ref<Record<string, unknown>>();
const { action, busy, result, reset, run } = useScriptTest();
const parameters = computed(() =>
  createScriptParameters(data.value?.arguments ?? []),
);
const functionSignature = computed(
  () =>
    `${data.value?.functionName ?? 'calculate'}(${parameters.value.map(({ name }) => name).join(', ')})`,
);
const canApply = computed(
  () => !!data.value?.onApply && !busy.value && !!expression.value.trim(),
);

function testScript(save = false) {
  const request = data.value;
  if (!request || (save && !canApply.value)) return;
  return run(save ? 'save' : 'test', async (signal) => {
    const script = expression.value;
    if (!script.trim()) {
      throw new Error(
        $t('tb.components.scriptTest.validation.testScriptRequired'),
      );
    }
    const args = argumentsEditor.value?.getArguments();
    if (!args)
      throw new Error($t('tb.components.scriptTest.validation.testArguments'));
    const response = await (request.testRunner ?? testCalculatedFieldScript)(
      script,
      createTestArguments(request.arguments, Date.now(), args),
      signal,
    );
    if (signal.aborted) return;
    result.value = response;
    if (save && !response.error) {
      await request.onApply?.(script);
      if (!signal.aborted) await modalApi.close();
    }
  });
}

watch(
  expression,
  () => {
    if (action.value !== 'load') reset();
  },
  { flush: 'sync' },
);
const [Modal, modalApi] = useVbenModal<ScriptTestData>({
  fullscreen: true,
  closeOnClickModal: false,
  onConfirm: () => testScript(true),
  async onOpenChange(open) {
    reset();
    if (!open) {
      data.value = undefined;
      return;
    }
    modalApi.setState({ fullscreen: true });
    const request = modalApi.getData();
    data.value = request;
    if (!request) return;
    expression.value = request.expression;
    samples.value = request.testArguments;
    if (!request.loadTestArguments) return;
    await run(
      'load',
      async (signal) => {
        const loaded = await request.loadTestArguments?.();
        if (!signal.aborted && loaded) samples.value = loaded;
      },
      () => {
        // Debug samples are optional; keep editable defaults on failure.
      },
    );
  },
});
</script>

<template>
  <Modal
    :title="`${$t('tb.components.scriptTest.menu')} (TBEL)`"
    :confirm-text="$t('tb.common.save')"
    :confirm-disabled="!canApply"
    :confirm-loading="action === 'save'"
    :show-confirm-button="!!data?.onApply"
    class="h-[85dvh] w-[calc(100%_-_2rem)] max-w-[1600px]"
    content-class="flex min-h-0 flex-col overflow-auto p-3 md:overflow-hidden"
    footer-class="gap-2 px-4 py-3"
  >
    <ResizablePanelGroup
      :direction="compact ? 'vertical' : 'horizontal'"
      class="min-h-[1100px] flex-1 md:min-h-0"
    >
      <ResizablePanel :default-size="50" :min-size="25">
        <div class="flex h-full min-h-0 flex-col p-2">
          <CodeEditor
            v-model="expression"
            language="tbel"
            class="min-h-0 flex-1"
            :aria-label="$t('calculated-fields.fields.script')"
            height="100%"
            :min-height="0"
            :parameters="parameters"
            :title="functionSignature"
            :readonly="action === 'save'"
          />
        </div>
      </ResizablePanel>
      <ResizableHandle
        with-handle
        :aria-label="$t('tb.components.scriptTest.actions.resizePanels')"
      />
      <ResizablePanel :default-size="50" :min-size="25">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel :default-size="50" :min-size="25">
            <section
              class="flex h-full min-h-0 flex-col gap-2 p-2"
              :aria-label="$t('tb.components.scriptTest.fields.testArguments')"
              :aria-busy="action === 'load'"
            >
              <div
                class="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <h3 class="text-sm font-medium">
                  {{ $t('tb.components.scriptTest.fields.testArguments') }}
                </h3>
                <p class="text-muted-foreground text-xs">
                  {{
                    $t('tb.components.scriptTest.messages.testArgumentsHint')
                  }}
                </p>
              </div>
              <div
                v-if="action === 'load'"
                class="flex min-h-0 flex-1 items-center justify-center rounded-lg border"
              >
                <Spin />
              </div>
              <ScriptTestArguments
                v-else-if="data"
                ref="argumentsEditor"
                class="min-h-0 flex-1"
                :arguments="data.arguments"
                :samples="samples"
                :disabled="action === 'save'"
                @change="reset"
              />
            </section>
          </ResizablePanel>
          <ResizableHandle
            with-handle
            :aria-label="$t('tb.components.scriptTest.actions.resizePanels')"
          />
          <ResizablePanel :default-size="50" :min-size="25">
            <ScriptTestResult :result="result" :aria-busy="busy" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
    <template #prepend-footer>
      <div class="mr-auto flex min-w-0 flex-wrap items-center gap-3">
        <VbenButton
          type="button"
          :loading="action === 'test'"
          :disabled="busy"
          @click="testScript()"
        >
          <IconifyIcon
            icon="lucide:play"
            class="mr-1 size-4"
            aria-hidden="true"
          />
          {{ $t('tb.components.codeEditor.actions.test') }}
        </VbenButton>
        <p class="text-muted-foreground hidden text-xs lg:block">
          {{
            data?.onApply
              ? $t('tb.components.scriptTest.messages.testHint')
              : $t('tb.components.scriptTest.messages.testOnlyHint')
          }}
        </p>
      </div>
    </template>
  </Modal>
</template>
