<script lang="ts" setup>
/**
 * 图片库选择弹窗(可复用)。
 * 供 image-input 等表单控件从图片库中挑选图片,选中后 emit('select', resourceInfo)。
 * 对齐 ui-ngx image-gallery-dialog 的选择语义(仅选择,不做增删改)。
 */
import type { TbResourceInfo } from '#/api/tb/resource';

import { reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Checkbox, Empty, Input, Pagination, Spin } from 'antdv-next';

import { getImages } from '#/api/tb/image';
import { Authority } from '#/enums';
import { $t } from '#/locales';
import { imageResourceScope } from '#/utils/image-url';
import ImageThumbnail from '#/views/tb/image/components/image-thumbnail.vue';

const emit = defineEmits<{ select: [TbResourceInfo] }>();

const { hasAccessByRoles } = useAccess();
const isTenantAdmin = hasAccessByRoles([Authority.TENANT_ADMIN]);

const queryParams = reactive({
  includeSystemImages: true,
  textSearch: '',
});
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);
const images = ref<TbResourceInfo[]>([]);
const loading = ref(false);
const selected = ref<null | TbResourceInfo>(null);

async function fetch() {
  loading.value = true;
  try {
    const result = await getImages({
      imageSubType: 'IMAGE',
      includeSystemImages: queryParams.includeSystemImages,
      page: page.value - 1,
      pageSize: pageSize.value,
      sortOrder: 'DESC',
      sortProperty: 'createdTime',
      textSearch: queryParams.textSearch || undefined,
    });
    images.value = result.data;
    total.value = result.totalElements;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  fetch();
}

function onPageChange(current: number, size: number) {
  page.value = current;
  pageSize.value = size;
  fetch();
}

function selectImage(image: TbResourceInfo) {
  selected.value = image;
}

function confirmSelect(image?: TbResourceInfo) {
  const target = image ?? selected.value;
  if (!target) {
    return;
  }
  emit('select', target);
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  onConfirm() {
    confirmSelect();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    selected.value = null;
    queryParams.textSearch = '';
    page.value = 1;
    fetch();
  },
});
</script>

<template>
  <Modal
    class="w-3/5"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
    :title="$t('tb.imageInput.galleryTitle')"
  >
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <div class="w-72">
          <Input
            v-model:value="queryParams.textSearch"
            allow-clear
            :placeholder="$t('tb.common.searchPlaceholder')"
            @change="onSearch"
          >
            <template #suffix>
              <IconifyIcon icon="lucide:search" />
            </template>
          </Input>
        </div>
        <Checkbox
          v-if="isTenantAdmin"
          v-model:checked="queryParams.includeSystemImages"
          @change="onSearch"
        >
          {{ $t('tb.imageInput.includeSystemImages') }}
        </Checkbox>
      </div>

      <Spin :spinning="loading">
        <div
          v-if="images.length > 0"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        >
          <div
            v-for="image in images"
            :key="image.resourceKey"
            class="hover:border-primary cursor-pointer overflow-hidden rounded-md border transition"
            :class="{
              'border-primary ring-primary ring-1':
                selected?.resourceKey === image.resourceKey,
            }"
            @click="selectImage(image)"
            @dblclick="confirmSelect(image)"
          >
            <ImageThumbnail
              :resource-key="image.resourceKey"
              :scope="imageResourceScope(image)"
              class="h-28 w-full"
            />
            <div class="truncate px-2 py-1 text-xs" :title="image.title">
              {{ image.title }}
            </div>
          </div>
        </div>
        <Empty
          v-else
          :description="$t('tb.imageInput.noImages')"
          class="py-8"
        />
      </Spin>

      <div class="flex justify-end">
        <Pagination
          :current="page"
          :page-size="pageSize"
          :show-size-changer="false"
          :total="total"
          size="small"
          @change="onPageChange"
        />
      </div>
    </div>
  </Modal>
</template>
