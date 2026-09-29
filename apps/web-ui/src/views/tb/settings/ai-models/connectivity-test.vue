<script lang="ts" setup>
import type { AiModel } from '#/api/tb/ai-model';

import { computed, onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { checkAiModelConnectivity } from '#/api/tb/ai-model';
import { $t } from '#/locales';

const isTesting = ref(true);
const result = ref<null | { errorDetails?: string; status: string }>(null);
let requestId = 0;

const isSuccess = computed(() => result.value?.status === 'SUCCESS');
const resultDetails = computed(() => {
  const details = result.value?.errorDetails;
  if (!details) return '';
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
});

const [Modal, modalApi] = useVbenModal<{ aiModel: AiModel }>({
  async onOpenChange(isOpen) {
    // 关闭或重新打开时，使上一次请求失效，避免迟到的结果覆盖当前状态。
    const currentRequestId = ++requestId;
    if (!isOpen) return;
    const aiModel = modalApi.getData()?.aiModel;
    if (!aiModel) {
      modalApi.close();
      return;
    }
    result.value = null;
    isTesting.value = true;
    try {
      const response = await checkAiModelConnectivity(aiModel);
      if (currentRequestId === requestId) result.value = response;
    } catch (error) {
      if (currentRequestId === requestId) {
        result.value = {
          status: 'FAILED',
          errorDetails:
            error instanceof Error
              ? error.message
              : $t('settings.features.ai.failed'),
        };
      }
    } finally {
      if (currentRequestId === requestId) isTesting.value = false;
    }
  },
});

onBeforeUnmount(() => {
  requestId++;
});
</script>

<template>
  <Modal
    class="w-[calc(100%_-_2rem)] max-w-2xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :title="$t('settings.features.ai.test')"
    :cancel-text="$t('tb.common.close')"
    :show-confirm-button="false"
  >
    <div
      class="space-y-4"
      role="status"
      aria-live="polite"
      :aria-busy="isTesting"
    >
      <div class="flex items-start gap-3">
        <IconifyIcon
          :icon="
            isTesting
              ? 'lucide:loader-circle'
              : isSuccess
                ? 'lucide:circle-check'
                : 'lucide:circle-alert'
          "
          class="mt-0.5 size-5 shrink-0"
          :class="
            isTesting
              ? 'text-primary animate-spin'
              : isSuccess
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive'
          "
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="m-0 text-sm font-semibold">
            {{
              isTesting
                ? $t('settings.features.ai.testing')
                : isSuccess
                  ? $t('settings.features.ai.connected')
                  : $t('settings.features.ai.failed')
            }}
          </p>
          <p class="text-muted-foreground mb-0 mt-1 text-sm">
            {{
              isTesting
                ? $t('settings.features.ai.form.testDescription')
                : isSuccess
                  ? $t('settings.features.ai.connectionSuccessDescription')
                  : $t('settings.features.ai.connectionFailureDescription')
            }}
          </p>
        </div>
      </div>
      <div
        v-if="!isTesting && resultDetails"
        class="border-border bg-muted/40 rounded-lg border p-4"
      >
        <pre
          class="m-0 max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs leading-5"
          >{{ resultDetails }}</pre>
      </div>
    </div>
  </Modal>
</template>
