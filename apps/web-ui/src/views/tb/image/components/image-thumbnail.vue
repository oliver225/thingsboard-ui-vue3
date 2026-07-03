<script lang="ts" setup>
import type { ResourceScope } from '#/enums';

import { onUnmounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { downloadImage, downloadImagePreview } from '#/api/tb/image';

/**
 * 鉴权图片加载器:图片下载接口需带 X-Authorization 头,无法直接用 <img src>,
 * 故以 Blob 拉取后转 ObjectURL 显示,卸载时释放。
 */
const props = withDefaults(
  defineProps<{
    /** true 取预览图(更小),false 取原图 */
    preview?: boolean;
    refreshKey?: null | number | string;
    resourceKey?: string;
    scope?: ResourceScope;
  }>(),
  {
    preview: true,
    refreshKey: undefined,
    resourceKey: undefined,
    scope: undefined,
  },
);

const src = ref<string>('');
const loading = ref(false);
const error = ref(false);
let objectUrl = '';

function revoke() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = '';
  }
}

async function load() {
  revoke();
  src.value = '';
  error.value = false;
  if (!props.scope || !props.resourceKey) {
    return;
  }
  loading.value = true;
  const { refreshKey, resourceKey, preview, scope } = props;
  try {
    const blob = preview
      ? await downloadImagePreview(scope, resourceKey)
      : await downloadImage(scope, resourceKey);
    // 加载期间 props 可能已变更,丢弃过期结果
    if (
      props.scope !== scope ||
      props.resourceKey !== resourceKey ||
      props.refreshKey !== refreshKey
    ) {
      return;
    }
    objectUrl = URL.createObjectURL(blob);
    src.value = objectUrl;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.scope, props.resourceKey, props.preview, props.refreshKey],
  load,
  {
    immediate: true,
  },
);

onUnmounted(revoke);
</script>

<template>
  <div class="bg-muted flex items-center justify-center overflow-hidden">
    <img
      v-if="src"
      :src="src"
      :alt="resourceKey"
      class="h-full w-full object-contain"
    />
    <IconifyIcon
      v-else-if="loading"
      icon="lucide:loader-circle"
      class="text-muted-foreground animate-spin"
    />
    <IconifyIcon v-else icon="lucide:image-off" class="text-muted-foreground" />
  </div>
</template>
