<template>
  <div class="image-url-Input">
    <div class="image-show-box">
      <img :src="currentVale" alt="" v-if="currentVale" />
      <div v-else>未选择图片</div>
    </div>
    <div class="image-info">
      <div class="input-info-resource" v-if="selectBtn === 'resource'">
        <div>
          {{ imageResource.fileName }}
        </div>
        <Space :size="1">
          <template #split>
            <Divider type="vertical" />
          </template>
          <div>{{ imageResource.descriptor?.width }}×{{ imageResource.descriptor?.height }}</div>
          <div> {{ convertBytesToSize(imageResource.descriptor?.size) }}</div>
        </Space>
        <div>
          <Icon icon="ant-design:close-outlined" :size="24" @click="handleClear" v-if="disabled == false" />
        </div>
      </div>
      <div class="input-info-link" v-if="selectBtn === 'link'">
        <InputGroup>
          <Input
            v-model:value="currentVale"
            placeholder="请输入图片链接"
            style="width: calc(100% - 100px)"
            :disabled="disabled"
          />
          <Button type="primary" @click="handleClear" v-if="disabled == false">
            <Icon icon="ant-design:close-outlined" :size="24" />
          </Button>
        </InputGroup>
      </div>
      <div v-if="isEmpty(selectBtn)" class="show-btn">
        <div class="resource-image-btn" @click="handleClickBtn('resource')">
          <Icon icon="ant-design:picture-outlined" :size="24" />
          <div> 从图形库选择 </div>
        </div>
        <div class="resource-image-btn" @click="handleClickBtn('link')">
          <Icon icon="ant-design:link-outlined" :size="24" />
          <div>设置链接</div>
        </div>
      </div>
    </div>
    <ImageSelect @register="registerModal" @selected="handleSelected" />
  </div>
</template>
<script lang="ts" setup name="ImageUrlInput">
  import { ref, watchEffect, watch } from 'vue';
  import { convertBytesToSize } from '/@/utils';
  import { propTypes } from '/@/utils/propTypes';
  import { Input, InputGroup, Button, Space, Divider } from 'ant-design-vue';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isEmpty } from '/@/utils/is';
  import { Icon } from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import ImageSelect from './imageSelect.vue';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { tbImagePrefix, imagePreview } from '/@/api/tb/images';

  const props = defineProps({
    value: propTypes.string,
    disabled: propTypes.bool.def(false),
  });

  const emit = defineEmits(['change', 'update:value']);

  const currentVale = ref('');
  const selectBtn = ref('');
  const imageResource = ref<ResourceInfo>({} as ResourceInfo);

  const { t } = useI18n();
  const { prefixCls } = useDesign('image-url-Input');

  const [registerModal, { openModal: openModal }] = useModal();

  watchEffect(async () => {
    const tmp = props.value?.replace(tbImagePrefix, '') || '';
    currentVale.value = tmp;
    if (isEmpty(tmp)) {
      selectBtn.value = '';
    } else if (tmp.startsWith('http')) {
      selectBtn.value = 'link';
    } else {
      selectBtn.value = 'resource';
    }
  });

  watch(
    () => currentVale.value,
    (v) => {
      emit('update:value', tbImagePrefix + v);
      return emit('change', tbImagePrefix + v);
    },
  );

  function handleClear() {
    currentVale.value = '';
    selectBtn.value = '';
  }

  function handleClickBtn(btn: string) {
    if (props.disabled == true) {
      return;
    }
    if (btn == 'resource') {
      openModal(true, {});
    } else {
      selectBtn.value = 'link';
    }
  }

  async function handleSelected(data: Recordable) {
    imageResource.value = data as ResourceInfo;
    if (imageResource.value.publicLink) {
      currentVale.value = imageResource.value.publicLink;
      selectBtn.value = 'resource';
    }
  }

  async function fetchPreviewImage(record: Recordable) {
    return new Promise((resolve) => {
      imagePreview(record.link).then((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          resolve(e.target?.result);
        };
        fileReader.readAsDataURL(file);
      });
    });
  }
</script>
<style lang="less">
  @prefix-cls: ~'image-url-Input';
  .@{prefix-cls} {
    border: 1px solid @border-color-base;
    border-radius: @border-radius-base;
    width: 100%;
    height: 90px;
    display: flex;
    .image-show-box {
      border: 1px solid @border-color-base;
      width: 110px;
      height: 100%;
      align-content: center;
      justify-items: center;
      padding: 2px;
      img {
        width: 100%;
        max-height: 90px;
      }
    }
    .image-info {
      width: 100%;
      .input-info-link {
        height: 100%;
        width: 100%;
        align-content: center;
        padding-left: 10px;
      }
      .input-info-resource {
        height: 100%;
        width: 100%;
        padding: 4px 10px;
        align-content: center;
        color: @text-color-secondary;
      }
      .show-btn {
        width: 100%;
        height: 100%;
        display: flex;
        .resource-image-btn {
          border: 1px solid @border-color-base;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 8px;
          color: @primary-color;
        }
        .resource-image-btn:hover {
          background-color: fade(@primary-color, 10);
          border-color: @primary-color;
        }
      }
    }
  }
</style>
