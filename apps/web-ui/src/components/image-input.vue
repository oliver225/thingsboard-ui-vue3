<script lang="ts" setup>
import type { TbResourceInfo } from '#/api/tb/resource';
import type { ImageLinkType } from '#/utils/image-url';

import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input } from 'antdv-next';

import { getImageInfo } from '#/api/tb/image';
import { $t } from '#/locales';
import { formatBytes } from '#/utils/file';
import {
  buildImageResourceLink,
  detectImageLinkType,
  extractParamsFromImageResourceUrl,
  prependTbImagePrefix,
  removeTbImagePrefix,
} from '#/utils/image-url';
import ImageThumbnail from '#/views/tb/image/components/image-thumbnail.vue';

import ImageGalleryModal from './image-gallery-modal.vue';

interface Props {
  class?: any;
  disabled?: boolean;
}
const props = defineProps<Props>();

const modelValue = defineModel<string | undefined>('value');

/** 去前缀后的图片 URL(内部使用) */
const imageUrl = ref('');
const linkType = ref<ImageLinkType>('none');
const imageResource = ref<null | TbResourceInfo>(null);
const loadingResource = ref(false);

const resourceParams = computed(() =>
  linkType.value === 'resource'
    ? extractParamsFromImageResourceUrl(imageUrl.value)
    : null,
);

/** 外部链接输入桥接:仅在 external 模式下读写 imageUrl */
const externalLink = computed({
  get: () => (linkType.value === 'external' ? imageUrl.value : ''),
  set: (value: string) => {
    linkType.value = 'external';
    updateModel(value);
  },
});

const [GalleryModal, galleryModalApi] = useVbenModal({
  connectedComponent: ImageGalleryModal,
});

watch(modelValue, syncFromModel, { immediate: true });

function syncFromModel(raw?: string) {
  const value = removeTbImagePrefix(raw ?? '');
  // 跳过由 updateModel 回写自身触发的“回声”
  if (value === imageUrl.value) {
    return;
  }
  reset();
  imageUrl.value = value;
  linkType.value = detectImageLinkType(value);
  if (linkType.value === 'resource') {
    loadResourceInfo();
  }
}

async function loadResourceInfo() {
  const params = resourceParams.value;
  if (!params) {
    reset();
    return;
  }
  loadingResource.value = true;
  try {
    imageResource.value = await getImageInfo(params.type, params.key);
  } catch {
    // 资源不存在:清空为未选择
    reset();
    updateModel();
  } finally {
    loadingResource.value = false;
  }
}

function reset() {
  linkType.value = 'none';
  imageResource.value = null;
}

function updateModel(value?: string) {
  imageUrl.value = value ?? '';
  modelValue.value = value ? prependTbImagePrefix(value) : undefined;
}

function onGallerySelect(image: TbResourceInfo) {
  imageResource.value = image;
  linkType.value = 'resource';
  updateModel(buildImageResourceLink(image));
}

function openGallery() {
  galleryModalApi.open();
}

function setLink() {
  linkType.value = 'external';
  imageUrl.value = '';
}

function clearImage() {
  reset();
  updateModel();
}
</script>

<template>
  <div :class="props.class" class="w-full">
    <!-- 未选择图片 -->
    <div
      v-if="linkType === 'none'"
      class="flex items-stretch gap-3 rounded-md border p-2"
    >
      <div
        class="text-muted-foreground bg-muted/40 flex h-24 w-32 shrink-0 items-center justify-center rounded-md text-sm"
      >
        {{ $t('tb.imageInput.noImageSelected') }}
      </div>
      <button
        type="button"
        :disabled="disabled"
        class="text-primary hover:border-primary hover:bg-accent flex h-24 flex-1 flex-col items-center justify-center gap-1 rounded-md border text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        @click="openGallery"
      >
        <IconifyIcon icon="lucide:images" class="text-2xl" />
        <span>{{ $t('tb.imageInput.browseFromGallery') }}</span>
      </button>
      <button
        type="button"
        :disabled="disabled"
        class="text-primary hover:border-primary hover:bg-accent flex h-24 flex-1 flex-col items-center justify-center gap-1 rounded-md border text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        @click="setLink"
      >
        <IconifyIcon icon="lucide:link" class="text-2xl" />
        <span>{{ $t('tb.imageInput.setLink') }}</span>
      </button>
    </div>

    <!-- 已选择图片 -->
    <div v-else class="flex items-center gap-3 rounded-md border p-2">
      <div class="h-24 w-32 shrink-0 overflow-hidden rounded">
        <ImageThumbnail
          v-if="linkType === 'resource' && resourceParams"
          :resource-key="resourceParams.key"
          :scope="resourceParams.type"
          class="h-full w-full"
        />
        <img
          v-else-if="linkType !== 'resource' && imageUrl"
          :src="imageUrl"
          alt=""
          class="h-full w-full object-contain"
        />
        <div
          v-else
          class="bg-muted flex h-full w-full items-center justify-center"
        >
          <IconifyIcon
            icon="lucide:loader-circle"
            class="text-muted-foreground animate-spin"
          />
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <template v-if="linkType === 'resource'">
          <div class="truncate font-medium" :title="imageResource?.title">
            {{ loadingResource ? '…' : imageResource?.title }}
          </div>
          <div
            class="text-muted-foreground mt-1 flex items-center gap-2 text-xs"
          >
            <span v-if="imageResource?.descriptor?.width">
              {{ imageResource.descriptor.width }}x{{
                imageResource.descriptor.height
              }}
            </span>
            <span v-if="imageResource?.descriptor?.size">
              {{ formatBytes(imageResource.descriptor.size) }}
            </span>
          </div>
        </template>
        <template v-else-if="linkType === 'external'">
          <div class="text-muted-foreground mb-1 text-xs">
            {{ $t('tb.imageInput.imageLink') }}
          </div>
          <Input
            v-model:value="externalLink"
            :disabled="disabled"
            :placeholder="$t('tb.imageInput.imageLinkPlaceholder')"
          />
        </template>
        <template v-else>
          <div class="text-muted-foreground text-sm">
            {{ $t('tb.imageInput.embeddedImage') }}
          </div>
        </template>
      </div>

      <Button
        v-if="!disabled"
        type="text"
        :title="$t('tb.imageInput.clearImage')"
        @click="clearImage"
      >
        <template #icon>
          <IconifyIcon icon="lucide:x" />
        </template>
      </Button>
    </div>

    <GalleryModal @select="onGallerySelect" />
  </div>
</template>
