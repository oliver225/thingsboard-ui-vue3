<template>
  <div class="border border-solid border-gray-300 rounded w-full h-90px flex">
    <div class="border border-solid border-gray-300 w-90px h-full align-content-center justify-items-center p-0.5">
      <img v-if="shouldShowImage" :src="displayImageSrc" alt="" class="img-content-clip" />
      <div v-else class="flex items-center justify-center h-full text-gray-400">
        {{ t('tb.images.input.notSelected') }}
      </div>
    </div>
    <div class="flex-1">
      <div v-if="selectedType === 'resource'" class="h-full flex items-center text-gray-500 px-2">
        <div class="flex-1">
          <div>{{ imageResource.fileName }}</div>
          <Space :size="1">
            <template #split>
              <Divider type="vertical" />
            </template>
            <div>{{ imageResource.descriptor?.width }}×{{ imageResource.descriptor?.height }}</div>
            <div>{{ convertBytesToSize(imageResource.descriptor?.size) }}</div>
          </Space>
        </div>
        <Icon
          v-if="!disabled"
          icon="ant-design:close-outlined"
          :size="20"
          @click="handleClear"
          class="cursor-pointer mr-4"
        />
      </div>

      <div v-else-if="selectedType === 'link'" class="h-full flex items-center text-gray-500 px-2">
        <InputGroup>
          <Input v-model:value="currentValue" :placeholder="t('tb.images.form.linkPlaceholder')" :disabled="disabled" />
          <Button @click="handleClear" v-if="!disabled">
            <Icon icon="ant-design:close-outlined" :size="20" />
          </Button>
        </InputGroup>
      </div>

      <div v-else class="w-full h-full flex">
        <div
          class="border border-solid border-gray-300 flex-1 flex flex-col justify-center items-center m-2 py-2 text-blue-500 hover:bg-blue-50 hover:border-blue-500 cursor-pointer"
          @click="handleClickBtn('resource')"
        >
          <Icon icon="ant-design:picture-outlined" :size="24" />
          <div>{{ t('tb.images.input.chooseFromLibrary') }}</div>
        </div>
        <div
          class="border border-solid border-gray-300 flex-1 flex flex-col justify-center items-center m-2 py-2 text-blue-500 hover:bg-blue-50 hover:border-blue-500 cursor-pointer"
          @click="handleClickBtn('link')"
        >
          <Icon icon="ant-design:link-outlined" :size="24" />
          <div>{{ t('tb.images.input.setLink') }}</div>
        </div>
      </div>
    </div>
    <ImageSelect @register="registerModal" @selected="handleSelected" />
  </div>
</template>

<script lang="ts" setup name="ImageUrlInput">
  import { ref, watchEffect, watch, computed } from 'vue';
  import { convertBytesToSize } from '/@/utils';
  import { propTypes } from '/@/utils/propTypes';
  import { Input, InputGroup, Button, Space, Divider } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isEmpty } from '/@/utils/is';
  import { Icon } from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import ImageSelect from './imageSelect.vue';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { tbImagePrefix, imagePreview, getImageInfo2 } from '/@/api/tb/images';
  import { imageToBase64 } from '/@/utils/file/base64Conver';

  const props = defineProps({
    value: propTypes.string,
    disabled: propTypes.bool.def(false),
  });

  const emit = defineEmits(['change', 'update:value']);

  const currentValue = ref('');
  const selectedType = ref('');
  const imageResource = ref<ResourceInfo>({} as ResourceInfo);
  const imageBase64 = ref('');

  const { t } = useI18n('tb');

  const [registerModal, { openModal }] = useModal();

  // 计算属性，用于决定是否显示图片
  const shouldShowImage = computed(() => {
    return currentValue.value && selectedType.value;
  });

  // 计算属性，用于确定显示的图片源
  const displayImageSrc = computed(() => {
    return selectedType.value === 'resource' ? imageBase64.value : currentValue.value;
  });

  watchEffect(async () => {
    const origin = (props.value as string | undefined) || '';
    const tmp: string = origin.replace(tbImagePrefix, '');
    currentValue.value = tmp;

    if (isEmpty(tmp as string)) {
      selectedType.value = '';
      return;
    }

    if ((tmp as string).startsWith('http')) {
      selectedType.value = 'link';
      return;
    }

    selectedType.value = 'resource';
    try {
      imageResource.value = await getImageInfo2(tmp);
      imageBase64.value = await fetchImageBase64(imageResource.value.link, imageResource.value.etag);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  });

  watch(
    () => currentValue.value,
    (v) => {
      const fullValue = tbImagePrefix + v;
      emit('update:value', fullValue);
      emit('change', fullValue);
    },
  );

  function handleClear() {
    currentValue.value = '';
    selectedType.value = '';
  }

  function handleClickBtn(btn: string) {
    if (props.disabled) return;

    if (btn === 'resource') {
      openModal(true, {});
    } else {
      selectedType.value = 'link';
    }
  }

  async function handleSelected(data: Recordable) {
    imageResource.value = data as ResourceInfo;
    if (imageResource.value.link) {
      currentValue.value = imageResource.value.link;
      selectedType.value = 'resource';
    }
    try {
      imageBase64.value = await fetchImageBase64(imageResource.value.link, imageResource.value.etag);
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
    }
  }

  async function fetchImageBase64(link: string, etag?: string) {
    const blob = await imagePreview(link, etag);
    return await imageToBase64(blob);
  }
</script>
