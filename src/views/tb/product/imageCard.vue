<template>
  <div class="product-image-card">
    <Card hoverable style="width: 100%">
      <div class="product-image-card-cover" @click="handleDetail">
        <img :alt="record.name" :src="getImageUrl(record.image || defaultImage)" />
        <div v-if="record.default" class="default">
          <span>默认配置</span>
        </div>
      </div>
      <div class="product-image-card-info">
        <Card.Meta :title="record.name" :description="record.description || '&nbsp;'" />
      </div>
      <template #actions>
        <Tooltip :title="'设为默认'">
          <Icon
            icon="i-ant-design:flag-outlined"
            :size="16"
            color="black"
            @click="handleSetDefault"
          />
        </Tooltip>
        <Tooltip :title="'编辑产品'">
          <Icon icon="i-ant-design:edit-outlined" :size="16" color="green" @click="handleEdit" />
        </Tooltip>
        <Tooltip :title="'删除产品'">
          <Icon icon="i-ant-design:delete-outlined" :size="16" color="red" @click="handleDelete" />
        </Tooltip>
      </template>
    </Card>
  </div>
</template>
<script lang="ts" setup name="ViewsTbProductImageCard">
  import { ref, watch } from 'vue';
  import { DeviceProfile } from '/@/api/tb/deviceProfile';
  import { Card, Tooltip } from 'ant-design-vue';
  import { tbImagePrefix } from '/@/api/tb/images';
  import { Icon } from '/@/components/Icon';

  const defaultImage = '/resource/img/logo.png';

  const props = defineProps({
    value: {
      required: true,
      type: Object as PropType<DeviceProfile>,
    },
  });
  const record = ref<DeviceProfile>({} as DeviceProfile);

  const emit = defineEmits(['edit', 'delete', 'default', 'detail']);

  watch(
    () => props.value,
    (v) => {
      record.value = props.value;
    },
    { immediate: true },
  );

  function getImageUrl(image: string) {
    if (image) {
      return image.replace(tbImagePrefix, '');
    } else {
      return defaultImage;
    }
  }

  function handleDetail() {
    emit('detail', record.value);
  }

  function handleSetDefault() {
    emit('default', record.value);
  }

  function handleDelete() {
    emit('delete', record.value);
  }

  function handleEdit() {
    emit('edit', record.value);
  }
</script>
<style lang="less">
  .product-image-card {
    width: 100%;
    border: 1px solid fade(@primary-color, 55);
    border-radius: 8px;
    background-color: fade(@primary-color, 5) !important;
    .ant-card-body {
      padding: 2px !important;
      cursor: default;
    }
    .ant-card-actions {
      background-color: fade(@primary-color, 5) !important;
    }
    .product-image-card-cover {
      padding: 0 8px 0 8px;
      width: 100%;
      display: flex;
      justify-content: center;
      background-image: radial-gradient(circle, rgba(203, 213, 225) 1px, #fff 1px);
      background-size: 10px 10px;
      background-position: center center;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      img {
        height: 230px;
      }
      .default {
        width: 100px;
        height: 100px;
        position: absolute;
        background: red;
        top: -50px;
        right: -50px;
        transform: rotate(45deg);
        color: #fff;
        span {
          position: absolute;
          bottom: 0;
          display: block;
          width: 100px;
          text-align: center;
        }
      }
    }
    .product-image-card-info {
      background-color: fade(@primary-color, 5);
      padding: 16px 8px;
    }
  }
</style>
