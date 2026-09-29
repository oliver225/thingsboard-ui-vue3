import type { ScriptTestResult } from './types';

import { computed, onScopeDispose, ref } from 'vue';

import { $t } from '#/locales';

import { getScriptTestError } from '../code-editor/utils/script-test-errors';

/** Shared lifecycle for loading samples, testing, and applying a tested script. */
export function useScriptTest() {
  const action = ref<'load' | 'save' | 'test'>();
  const result = ref<ScriptTestResult>();
  const busy = computed(() => !!action.value);
  let controller: AbortController | undefined;

  function reset() {
    controller?.abort();
    controller = undefined;
    action.value = undefined;
    result.value = undefined;
  }

  async function run(
    operation: NonNullable<typeof action.value>,
    task: (signal: AbortSignal) => Promise<void>,
    onError?: (cause: unknown) => void,
  ) {
    if (busy.value) return;
    reset();
    const current = new AbortController();
    controller = current;
    action.value = operation;
    try {
      await task(current.signal);
    } catch (error) {
      if (current.signal.aborted) return;
      if (onError) onError(error);
      else {
        result.value = {
          error: getScriptTestError(
            error,
            $t(
              operation === 'save' && result.value && !result.value.error
                ? 'tb.components.scriptTest.messages.applyFailed'
                : 'tb.components.scriptTest.messages.testFailed',
            ),
          ),
        };
      }
    } finally {
      // An older request must not clear a newer dialog's loading state.
      if (controller === current) {
        controller = undefined;
        action.value = undefined;
      }
    }
  }

  onScopeDispose(reset);
  return { action, busy, reset, result, run };
}
