<script setup lang="ts">
import type { TbResourceInfo } from '#/api/tb/image';

import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

import { useVbenModal, VbenButton, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Input } from 'antdv-next';

import { getImages, uploadImage } from '#/api/tb/image';
import { $t } from '#/locales';

import ImageFileInput from '../image-file-input.vue';
import ImagePreview from '../image-preview.vue';
import TbCheckbox from '../tb-checkbox.vue';
import { getImageLink, getImageScope, removeImagePrefix } from './utils';

const emit = defineEmits<{ select: [image: TbResourceInfo] }>();

const searchText = ref('');
const includeSystemImagesId = useId();
const includeSystemImages = ref(false);
const images = ref<TbResourceInfo[]>([]);
const selectedImage = ref<null | TbResourceInfo>(null);
const currentValue = ref('');
const page = ref(0);
const totalPages = ref(0);
const totalElements = ref(0);
const loading = ref(false);
const loadFailed = ref(false);
const isOpen = ref(false);
const mode = ref('library');
const file = ref<File | null>(null);
const title = ref('');
let requestId = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const canConfirm = computed(() =>
  mode.value === 'upload'
    ? !!file.value && !!title.value.trim()
    : !!selectedImage.value,
);

const [Modal, modalApi] = useVbenModal<{ value?: null | string }>({
  async onConfirm() {
    if (!canConfirm.value) return;
    modalApi.lock();
    try {
      const image =
        mode.value === 'upload' && file.value
          ? await uploadImage(file.value, title.value.trim(), 'IMAGE')
          : selectedImage.value;
      if (!image) return;
      emit('select', image);
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(open) {
    isOpen.value = open;
    if (!open) {
      requestId++;
      clearTimeout(searchTimer);
      return;
    }
    currentValue.value = removeImagePrefix(modalApi.getData()?.value);
    selectedImage.value = null;
    file.value = null;
    title.value = '';
    page.value = 0;
    void loadImages();
  },
});

async function loadImages() {
  const id = ++requestId;
  loading.value = true;
  loadFailed.value = false;
  images.value = [];
  try {
    const result = await getImages({
      page: page.value,
      pageSize: 12,
      textSearch: searchText.value.trim(),
      includeSystemImages: includeSystemImages.value,
      imageSubType: 'IMAGE',
      sortProperty: 'title',
      sortOrder: 'ASC',
    });
    if (id !== requestId) return;
    images.value = result.data;
    totalPages.value = result.totalPages;
    totalElements.value = result.totalElements;
    if (!selectedImage.value) {
      selectedImage.value =
        result.data.find(
          (image) => getImageLink(image) === currentValue.value,
        ) ?? null;
    }
  } catch {
    if (id === requestId) loadFailed.value = true;
  } finally {
    if (id === requestId) loading.value = false;
  }
}

watch(searchText, () => {
  clearTimeout(searchTimer);
  // 输入发生时就使旧查询失效，避免防抖间隔内显示过期结果。
  requestId++;
  if (!isOpen.value) return;
  loading.value = true;
  searchTimer = setTimeout(() => {
    page.value = 0;
    void loadImages();
  }, 300);
});

watch(includeSystemImages, () => {
  clearTimeout(searchTimer);
  page.value = 0;
  if (isOpen.value) void loadImages();
});

function onPageChange(nextPage: number) {
  if (loading.value || nextPage < 0 || nextPage >= totalPages.value) return;
  page.value = nextPage;
  void loadImages();
}

function onFileSelect(selectedFile: File) {
  title.value = selectedFile.name;
}

onBeforeUnmount(() => {
  requestId++;
  clearTimeout(searchTimer);
});
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="flex min-h-0 flex-col overflow-hidden px-6 pt-5 pb-1"
    :title="$t('tb.components.imageInput.sections.libraryTitle')"
    :confirm-disabled="!canConfirm"
    :confirm-text="
      mode === 'upload'
        ? $t('tb.components.imageInput.actions.uploadAndUse')
        : $t('tb.components.imageInput.actions.useImage')
    "
  >
    <div class="flex min-h-0 flex-1 flex-col gap-5">
      <VbenSegmented
        v-model="mode"
        class="shrink-0"
        :tabs="[
          {
            label: $t('tb.components.imageInput.sections.library'),
            value: 'library',
          },
          {
            label: $t('tb.components.imageInput.actions.upload'),
            value: 'upload',
          },
        ]"
      />
      <template v-if="mode === 'library'">
        <div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            v-model:value="searchText"
            class="w-full sm:max-w-80"
            :aria-label="$t('tb.components.imageInput.fields.search')"
            :placeholder="$t('tb.components.imageInput.fields.search')"
          />
          <div class="inline-flex shrink-0 items-center gap-2">
            <TbCheckbox
              :id="includeSystemImagesId"
              v-model:checked="includeSystemImages"
              :aria-label="$t('tb.components.imageInput.fields.includeSystem')"
            />
            <label
              :for="includeSystemImagesId"
              class="cursor-pointer whitespace-nowrap text-sm"
            >
              {{ $t('tb.components.imageInput.fields.includeSystem') }}
            </label>
          </div>
        </div>
        <div :aria-busy="loading" class="min-h-0 flex-1 overflow-y-auto p-1">
          <div
            v-if="loading"
            role="status"
            class="flex min-h-full items-center justify-center gap-2 text-muted-foreground"
          >
            <IconifyIcon
              icon="lucide:loader-circle"
              class="size-5 animate-spin"
            />
            {{ $t('tb.components.imageInput.messages.loading') }}
          </div>
          <div
            v-else-if="loadFailed"
            role="alert"
            class="flex min-h-full flex-col items-center justify-center gap-3"
          >
            <p class="text-muted-foreground">
              {{ $t('tb.components.imageInput.messages.loadFailed') }}
            </p>
            <VbenButton type="button" variant="outline" @click="loadImages">
              {{ $t('tb.components.imageInput.actions.retry') }}
            </VbenButton>
          </div>
          <div
            v-else-if="images.length === 0"
            class="flex min-h-full flex-col items-center justify-center gap-3 text-muted-foreground"
          >
            <IconifyIcon icon="lucide:images" class="size-10" />
            <p>{{ $t('tb.components.imageInput.messages.noImages') }}</p>
          </div>
          <div
            v-else
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            <button
              v-for="image in images"
              :key="image.id?.id || getImageLink(image)"
              type="button"
              class="group relative min-w-0 overflow-hidden rounded-lg border p-2 text-left outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              :class="
                selectedImage &&
                getImageLink(selectedImage) === getImageLink(image)
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'bg-card'
              "
              :aria-pressed="
                !!selectedImage &&
                getImageLink(selectedImage) === getImageLink(image)
              "
              @click="selectedImage = image"
            >
              <ImagePreview
                :scope="getImageScope(image)"
                :resource-key="image.resourceKey"
                :refresh-key="image.etag"
                class="h-24 w-full rounded-md"
              />
              <span
                class="mt-2 block truncate text-sm font-medium"
                :title="image.title || image.fileName"
              >
                {{ image.title || image.fileName || image.resourceKey }}
              </span>
              <span class="text-muted-foreground text-xs">{{
                $t(`tb.components.imageInput.options.${getImageScope(image)}`)
              }}</span>
              <IconifyIcon
                v-if="
                  selectedImage &&
                  getImageLink(selectedImage) === getImageLink(image)
                "
                icon="lucide:circle-check"
                class="absolute right-3 top-3 size-5 rounded-full bg-background text-primary"
              />
            </button>
          </div>
        </div>
        <div
          v-if="!loadFailed"
          class="flex shrink-0 items-center justify-between gap-3 border-t pt-4"
        >
          <span class="text-muted-foreground text-xs" aria-live="polite">{{
            $t('tb.components.imageInput.messages.pagination', {
              page: totalPages ? page + 1 : 0,
              pages: totalPages,
              count: totalElements,
            })
          }}</span>
          <div class="flex gap-2">
            <VbenButton
              type="button"
              variant="outline"
              size="icon"
              :disabled="loading || page === 0"
              :aria-label="$t('tb.components.imageInput.actions.previous')"
              @click="onPageChange(page - 1)"
            >
              <IconifyIcon icon="lucide:chevron-left" class="size-4" />
            </VbenButton>
            <VbenButton
              type="button"
              variant="outline"
              size="icon"
              :disabled="loading || page + 1 >= totalPages"
              :aria-label="$t('tb.components.imageInput.actions.next')"
              @click="onPageChange(page + 1)"
            >
              <IconifyIcon icon="lucide:chevron-right" class="size-4" />
            </VbenButton>
          </div>
        </div>
      </template>
      <div v-else class="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <ImageFileInput v-model="file" @select="onFileSelect" />
        <label class="block space-y-2 text-sm font-medium">
          <span>{{ $t('tb.components.imageInput.fields.title') }}</span>
          <VbenInput
            v-model="title"
            :placeholder="
              $t('tb.components.imageInput.messages.titlePlaceholder')
            "
          />
        </label>
        <p class="text-muted-foreground text-xs">
          {{ $t('tb.components.imageInput.messages.uploadHint') }}
        </p>
      </div>
    </div>
  </Modal>
</template>
