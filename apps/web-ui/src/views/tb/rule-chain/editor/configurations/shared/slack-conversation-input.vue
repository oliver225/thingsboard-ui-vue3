<script setup lang="ts">
import type {
  SlackConversation,
  SlackConversationType,
} from '#/api/tb/notification-target';

import { computed, ref, watch } from 'vue';

import { Select } from 'antdv-next';

import { getSlackConversations } from '#/api/tb/notification-target';

const props = defineProps<{
  type?: SlackConversationType;
  token?: string;
  system?: boolean;
}>();
const value = defineModel<SlackConversation>();
const conversations = ref<SlackConversation[]>([]);
const loading = ref(false);
let request = 0;
const options = computed(() => {
  const items = [...conversations.value];
  if (value.value && !items.some((item) => item.id === value.value?.id))
    items.push(value.value);
  return items.map((item) => ({
    value: item.id,
    label: item.title || item.name || item.id,
  }));
});

async function load(open: boolean) {
  if (!open || !props.type || (!props.system && !props.token)) return;
  const current = ++request;
  loading.value = true;
  try {
    const result = await getSlackConversations(
      props.type,
      props.system ? undefined : props.token,
    );
    if (current === request) conversations.value = result;
  } catch {
    // 请求失败由统一拦截器提示，保留当前选中的会话。
  } finally {
    if (current === request) loading.value = false;
  }
}

watch(
  () => [props.type, props.system, props.token],
  (_value, previous) => {
    request++;
    conversations.value = [];
    loading.value = false;
    if (previous?.[0]) value.value = undefined;
  },
);
</script>

<template>
  <Select
    class="w-full"
    :value="value?.id"
    :options="options"
    :loading="loading"
    option-filter-prop="label"
    show-search
    allow-clear
    @open-change="load"
    @change="(id) => (value = conversations.find((item) => item.id === id))"
  />
</template>
