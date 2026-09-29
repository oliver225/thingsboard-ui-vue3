<script setup lang="ts">
import type { TbResourceInfo } from '#/api/tb/image';
import type { ResourceScope } from '#/enums';

import { computed, ref, watch } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { $t } from '#/locales';
import { isSvgFile } from '#/utils/file';

import ImagePreview from './image-preview.vue';

const props = defineProps<{
  disabled?: boolean;
  /** undefined 保留已有图片，null 表示未选择或已清除，File 表示新选择。 */
  modelValue?: File | null;
  record?: null | TbResourceInfo;
  scope?: ResourceScope;
  svgOnly?: boolean;
}>();

const emit = defineEmits<{
  select: [file: File];
  'update:modelValue': [file: File | null];
}>();

const inputRef = ref<HTMLInputElement>();
const previewUrl = ref('');
const previewFailed = ref(false);
const showPreview = computed(
  () =>
    !!props.modelValue || (props.modelValue === undefined && !!props.record),
);
const localePrefix = computed(() =>
  props.svgOnly ? 'scada-symbol' : 'images',
);
const fileName = computed(
  () =>
    props.modelValue?.name || (showPreview.value ? props.record?.fileName : ''),
);

watch(
  () => props.modelValue,
  (file, _previous, onCleanup) => {
    previewUrl.value = '';
    previewFailed.value = false;
    // SVGZ 为压缩文件，不生成本地预览，上传后由服务端生成预览。
    if (!file || /\.svgz$/i.test(file.name)) return;
    const url = URL.createObjectURL(file);
    previewUrl.value = url;
    onCleanup(() => URL.revokeObjectURL(url));
  },
  { immediate: true },
);

function selectFile(file?: File) {
  if (!file || props.disabled) return;
  const valid = props.svgOnly
    ? isSvgFile(file)
    : file.type.startsWith('image/') || isSvgFile(file);
  if (!valid) {
    message.error(
      $t(
        `${localePrefix.value}.validation.${props.svgOnly ? 'svgOnly' : 'imageOnly'}`,
      ),
    );
    return;
  }
  emit('update:modelValue', file);
  emit('select', file);
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  selectFile(input.files?.[0]);
  input.value = '';
}

function handleFileDrop(event: DragEvent) {
  selectFile(event.dataTransfer?.files[0]);
}
</script>

<template>
  <div class="min-w-0 space-y-2">
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="svgOnly ? '.svg,.svgz,image/svg+xml' : 'image/*,.svgz'"
      :disabled="disabled"
      :aria-label="$t(`${localePrefix}.features.upload.file`)"
      @change="handleFileChange"
    />
    <div class="flex flex-col gap-4 sm:flex-row">
      <div
        v-if="showPreview"
        class="bg-muted/50 flex h-36 shrink-0 items-center justify-between gap-2 rounded-md border p-3 sm:w-44"
      >
        <div
          class="flex size-28 shrink-0 items-center justify-center overflow-hidden"
        >
          <img
            v-if="previewUrl && !previewFailed"
            :src="previewUrl"
            :alt="fileName"
            class="size-full object-contain"
            @error="previewFailed = true"
          />
          <ImagePreview
            v-else-if="!modelValue && record"
            class="size-full"
            :resource-key="record.resourceKey"
            :refresh-key="record.etag"
            :scope="scope"
            :preview="false"
          />
          <IconifyIcon
            v-else
            icon="lucide:file-image"
            class="text-muted-foreground size-8"
          />
        </div>
        <VbenButton
          type="button"
          variant="ghost"
          size="icon"
          class="text-primary size-7 shrink-0"
          :disabled="disabled"
          :aria-label="
            $t('tb.components.imageFileInput.actions.clearSelection')
          "
          :title="$t('tb.components.imageFileInput.actions.clearSelection')"
          @click="emit('update:modelValue', null)"
        >
          <IconifyIcon icon="lucide:x" class="size-5" />
        </VbenButton>
      </div>
      <VbenButton
        type="button"
        variant="outline"
        class="hover:border-primary hover:bg-muted/30 flex h-36 min-w-0 flex-1 gap-3 whitespace-normal rounded-md border-2 border-dashed bg-transparent px-4 shadow-none"
        :disabled="disabled"
        :aria-label="
          $t(
            `${localePrefix}.features.upload.${record ? 'replaceTip' : 'dragTip'}`,
          )
        "
        @click="inputRef?.click()"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
      >
        <IconifyIcon
          icon="mdi:cloud-upload"
          class="text-muted-foreground/40 size-10 shrink-0"
        />
        <span class="text-muted-foreground text-base font-normal leading-7">
          <span class="block">{{
            $t('tb.components.imageFileInput.messages.drop')
          }}</span>
          <i18n-t
            keypath="tb.components.imageFileInput.messages.orBrowse"
            tag="span"
          >
            <template #browse>
              <span class="text-primary font-medium">
                {{ $t('tb.components.imageFileInput.actions.browse') }}
              </span>
            </template>
          </i18n-t>
        </span>
      </VbenButton>
    </div>
    <p
      v-if="modelValue && (!previewUrl || previewFailed)"
      class="text-muted-foreground text-xs"
    >
      {{ $t('tb.components.imageFileInput.messages.previewUnavailable') }}
    </p>
  </div>
</template>
