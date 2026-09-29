<script lang="ts" setup>
import type { ResourceScope } from '#/enums';

import { ref, watch } from 'vue';

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

const src = ref('');
const loading = ref(false);

watch(
  () =>
    [props.scope, props.resourceKey, props.preview, props.refreshKey] as const,
  async ([scope, resourceKey, preview], _previous, onCleanup) => {
    let active = true;
    let objectUrl = '';
    // 切换资源、预览模式或卸载时，释放地址并忽略旧请求的结果。
    onCleanup(() => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    });

    src.value = '';
    loading.value = false;
    if (!scope || !resourceKey) return;

    loading.value = true;
    try {
      const blob = preview
        ? await downloadImagePreview(scope, resourceKey)
        : await downloadImage(scope, resourceKey);
      if (!active) return;

      objectUrl = URL.createObjectURL(blob);
      src.value = objectUrl;
    } catch {
      // 下载失败时由模板显示占位图标，过期请求不修改当前状态。
      if (active) src.value = '';
    } finally {
      if (active) loading.value = false;
    }
  },
  { immediate: true },
);
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
