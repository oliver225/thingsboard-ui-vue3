<script setup lang="ts">
import type { EntityId } from '#/types/tb';

import { computed, ref, watch } from 'vue';

import { VbenSelect } from '@vben/common-ui';

import { getAiModelById } from '#/api/tb/ai-model';

const props = defineProps<{ modelId?: EntityId }>();
const value = defineModel<string>();
const provider = ref<string>();
const options = computed(() => {
  const formats = ['TEXT', 'JSON_SCHEMA'];
  if (!['AMAZON_BEDROCK', 'ANTHROPIC'].includes(provider.value ?? ''))
    formats.splice(1, 0, 'JSON');
  return formats.map((value) => ({ label: value, value }));
});

watch(
  () => props.modelId?.id,
  async (id, _previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });
    provider.value = undefined;
    if (!id) return;
    try {
      const model = await getAiModelById(id);
      if (cancelled) return;
      provider.value = model.configuration?.provider;
      if (
        value.value &&
        !options.value.some((option) => option.value === value.value)
      )
        value.value = undefined;
    } catch {
      // 请求错误由统一拦截器提示，保留当前配置供用户重试。
    }
  },
  { immediate: true },
);
</script>

<template>
  <VbenSelect v-model="value" :options="options" class="w-full" />
</template>
