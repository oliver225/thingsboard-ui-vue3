<template>
  <BasicModal v-bind="$attrs" :footer="null" :can-fullscreen="false" @register="registerModal">
    <template #title>
      <Icon icon="i-clarity:note-edit-line" class="pr-1 m-1" />
      <span> 编辑图片 </span>
    </template>
    <div class="w-full">
      <Input v-model:value="record.title" />
    </div>

    <div class="rounded border-slate-200 bg-slate-100 mt-4 p-4">
      <div class="flex justify-between px-1">
        <Space :size="25">
          <Tooltip title="下载图片">
            <Icon :size="26" icon="ant-design:download-outlined" @click="handleDownload" />
          </Tooltip>
          <Tooltip title="嵌入图片">
            <Icon :size="26" icon="ant-design:code-outlined" @click="handleEmbedImage" />
          </Tooltip>
        </Space>
        <a-button
          type="primary"
          v-if="!!!(userStore.getAuthority == Authority.TENANT_ADMIN && record.link?.indexOf('system') > -1)"
        >
          更新图片
        </a-button>
      </div>
      <div class="h-100 my-2">
        <img :src="record.preview" :alt="record.name" class="img-content-clip" />
      </div>
      <div class="px-1">
        <Space :size="1">
          <template #split>
            <Divider type="vertical" />
          </template>
          <div>{{ record.descriptor?.width }}×{{ record.descriptor?.height }}</div>
          <div> {{ convertBytesToSize(record.descriptor?.size) }}</div>
        </Space>
      </div>
    </div>
  </BasicModal>
</template>
<script lang="ts" setup name="EmbedImage">
  import { Icon } from '/@/components/Icon';
  import { ref } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ResourceInfo } from '/@/api/tb/resourceLibrary';
  import { Input, Space, Divider, Tooltip } from 'ant-design-vue';
  import { convertBytesToSize } from '/@/utils';
  import { updateImageInfo, imagePreview } from '/@/api/tb/images';
  import { Authority } from '/@/enums/authorityEnum';
  import { useUserStore } from '/@/store/modules/user';

  const emit = defineEmits(['register', 'embed', 'download']);

  const record = ref<ResourceInfo>({} as ResourceInfo);
  const userStore = useUserStore();

  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    record.value = { ...data } as ResourceInfo;
    if (record.value.link) {
      record.value['preview'] = await fetchPreviewImage(record.value.link);
    }
    setModalProps({ loading: false });
  });

  function clear() {
    record.value = {} as ResourceInfo;
  }

  async function fetchPreviewImage(link: string) {
    return new Promise((resolve) => {
      imagePreview(link).then((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          resolve(e.target?.result);
        };
        fileReader.readAsDataURL(file);
      });
    });
  }

  function handleEmbedImage() {
    emit('embed', record.value);
  }

  function handleDownload() {
    emit('download', record.value);
  }
</script>
