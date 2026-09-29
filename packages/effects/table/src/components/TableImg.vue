<script lang="ts" setup name="TableImage">
import type { CSSProperties, PropType } from 'vue';

import { computed } from 'vue';

import { Badge, Image } from 'antdv-next';

const props = defineProps({
  imgList: {
    default: undefined,
    type: Array as PropType<string[]>,
  },
  size: { type: Number, default: 40 },
  // 是否简单显示（只显示第一张图片）
  simpleShow: { type: Boolean, default: undefined },
  // 简单模式下是否显示图片数量的badge
  showBadge: { type: Boolean, default: true },
  // 图片间距
  margin: { type: Number, default: 4 },
  // src前缀，将会附加在imgList中每一项之前
  srcPrefix: { type: String, default: '' },
});

const PreviewGroup = Image.PreviewGroup;

const getWrapStyle = computed((): CSSProperties => {
  const { size } = props;
  const s = `${size}px`;
  return { height: s, width: s };
});
</script>
<template>
  <div
    class="tb-basic-table-img mx-auto flex items-center"
    v-if="imgList && imgList.length"
    :style="getWrapStyle"
  >
    <Badge
      :count="!showBadge || imgList.length === 1 ? 0 : imgList.length"
      v-if="simpleShow"
    >
      <div class="img-div">
        <PreviewGroup>
          <template v-for="(img, index) in imgList" :key="img">
            <Image
              :width="size"
              :style="{
                display: index === 0 ? '' : 'none !important',
              }"
              :src="srcPrefix + img"
            />
          </template>
        </PreviewGroup>
      </div>
    </Badge>
    <PreviewGroup v-else>
      <template v-for="(img, index) in imgList" :key="img">
        <Image
          :width="size"
          :style="{ marginLeft: index === 0 ? 0 : margin }"
          :src="srcPrefix + img"
        />
      </template>
    </PreviewGroup>
  </div>
</template>
<style lang="less">
.tb-basic-table-img {
  .ant-image {
    margin-right: 4px;
    cursor: zoom-in;

    img {
      border-radius: var(--radius);
    }
  }

  .img-div {
    display: inline-grid;
  }
}
</style>
