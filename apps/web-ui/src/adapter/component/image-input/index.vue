<script setup lang="ts">
import type { TbResourceInfo } from '#/api/tb/image';

import { computed, ref, watch } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input as VbenInput } from '@vben-core/shadcn-ui';

import { $t } from '#/locales';

import ImagePreview from '../image-preview.vue';
import ImageLibrary from './library.vue';
import {
  getImageLink,
  getImageResource,
  removeImagePrefix,
  toImageValue,
} from './utils';

export interface ImageInputProps {
  disabled?: boolean;
  modelValue?: null | string;
}

const props = defineProps<ImageInputProps>();
const emit = defineEmits<{
  blur: [];
  'update:modelValue': [value: null | string];
}>();

const url = computed(() => removeImagePrefix(props.modelValue));
const resource = computed(() => getImageResource(props.modelValue));
const isEmbedded = computed(() => url.value.startsWith('data:image/'));
const previewFailed = ref(false);
const editingLink = ref(false);
const refreshKey = ref(0);
// 允许站内相对地址、HTTP(S) 和已有的内嵌图片；不将其他协议交给 img。
const previewUrl = computed(() =>
  /^(?:https?:\/\/|\/(?!\/)|data:image\/)/i.test(url.value) ? url.value : '',
);

watch(url, () => {
  previewFailed.value = false;
});

const [LibraryModal, libraryModalApi] = useVbenModal({
  connectedComponent: ImageLibrary,
  destroyOnClose: true,
});

function onOpenLibrary() {
  if (props.disabled) return;
  libraryModalApi.setData({ value: props.modelValue }).open();
}

function onSelect(image: TbResourceInfo) {
  if (props.disabled) return;
  editingLink.value = false;
  refreshKey.value++;
  emit('update:modelValue', toImageValue(getImageLink(image)));
  emit('blur');
}

function onLinkChange(value: number | string) {
  if (props.disabled) return;
  emit('update:modelValue', toImageValue(String(value)));
}

function onClear() {
  if (props.disabled) return;
  editingLink.value = false;
  emit('update:modelValue', null);
  emit('blur');
}
</script>

<template>
  <div
    class="image-input min-w-0 space-y-3 rounded-lg border bg-muted/20 p-4"
    :data-disabled="disabled || undefined"
  >
    <LibraryModal @select="onSelect" />
    <div class="flex items-center gap-4">
      <div
        class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background"
      >
        <ImagePreview
          v-if="resource"
          v-bind="resource"
          :refresh-key="refreshKey"
          class="size-full"
        />
        <img
          v-else-if="previewUrl && !previewFailed"
          :src="previewUrl"
          :alt="$t('tb.components.imageInput.sections.preview')"
          class="size-full object-contain"
          @error="previewFailed = true"
        />
        <IconifyIcon
          v-else
          :icon="url ? 'lucide:image-off' : 'lucide:image-plus'"
          class="text-muted-foreground size-7"
        />
      </div>
      <div class="min-w-0 flex-1 space-y-2">
        <p class="m-0 truncate text-sm font-medium">
          {{
            resource?.resourceKey ||
            (isEmbedded
              ? $t('tb.components.imageInput.options.embedded')
              : url) ||
            $t('tb.components.imageInput.messages.empty')
          }}
        </p>
        <div class="flex flex-wrap gap-2">
          <VbenButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="disabled"
            @click="onOpenLibrary"
          >
            <IconifyIcon icon="lucide:images" class="mr-2 size-4" />
            {{ $t('tb.components.imageInput.actions.choose') }}
          </VbenButton>
          <VbenButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="disabled"
            @click="editingLink = true"
          >
            <IconifyIcon icon="lucide:link" class="mr-2 size-4" />
            {{ $t('tb.components.imageInput.actions.setLink') }}
          </VbenButton>
          <VbenButton
            v-if="url || editingLink"
            type="button"
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-destructive"
            :disabled="disabled"
            :aria-label="$t('tb.components.imageInput.actions.clear')"
            :title="$t('tb.components.imageInput.actions.clear')"
            @click="onClear"
          >
            <IconifyIcon icon="lucide:x" class="size-4" />
          </VbenButton>
        </div>
      </div>
    </div>
    <VbenInput
      v-if="editingLink || (url && !resource && !isEmbedded)"
      :model-value="isEmbedded ? '' : url"
      :disabled="disabled"
      :aria-label="$t('tb.components.imageInput.actions.setLink')"
      :placeholder="$t('tb.components.imageInput.messages.linkPlaceholder')"
      @update:model-value="onLinkChange"
      @blur="emit('blur')"
    />
  </div>
</template>

<style scoped>
.image-input {
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.image-input:not([data-disabled]):hover {
  background-color: hsl(var(--primary) / 4%);
  border-color: hsl(var(--primary) / 60%);
}

.image-input:not([data-disabled]):focus-within {
  background-color: hsl(var(--primary) / 4%);
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 15%);
}

.image-input:not([data-disabled]):active {
  background-color: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary));
}
</style>
