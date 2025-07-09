<script lang="ts" setup>
import type { ResourceApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { encodeHtml } from '@vben/utils';

import { Card } from 'ant-design-vue';

import { CodeViewer } from '#/components/CodeViewer';

defineOptions({
  name: 'ImageEmbedModel',
});

const record = ref<null | ResourceApi.ResourceInfo>(null);

const [EmbedModal, modalApi] = useVbenModal({
  title: `${$t('嵌入图像')}`,
  footer: false,
  async onOpenChange(isOpen: boolean) {
    modalApi.setState({ loading: true });
    if (isOpen) {
      record.value = null;
      const { data } = modalApi.getData<Record<string, any>>();
      if (data) {
        record.value = data as ResourceApi.ResourceInfo;
      }
    }
    modalApi.setState({ loading: false });
  },
});

const embedHtmlCode = computed(() => {
  return encodeHtml(
    `<img src="${record.value?.publicLink}" alt="${record.value?.title}" />`,
  );
});

const embedVueCode = computed(() => {
  return encodeHtml(`<img [src]="'${record.value?.link}' | image | async" />`);
});
</script>
<template>
  <EmbedModal class="w-1/2">
    <Card size="small">
      <template #title>
        <div class="font-semibold">嵌入到HTML</div>
      </template>
      <div class="text-muted-foreground text-sm">
        <p>使用以下代码片段，您可以将图像嵌入到基于纯HTML的组件中。</p>
        <p>此类组件包括HTML卡片小部件、单元格内容函数等。</p>
      </div>
      <CodeViewer :value="embedHtmlCode" language="html" />
    </Card>
    <Card size="small" class="mt-4">
      <template #title>
        <div class="font-semibold">嵌入到Vue3模板</div>
      </template>
      <div class="text-muted-foreground text-sm">
        <p>使用以下代码片段，您可以将图像嵌入到 VUE 3模板中。</p>
        <p>
          此类组件包括Markdown小部件、小部件编辑器中的HTML部分、自定义操作等。
        </p>
      </div>
      <CodeViewer :value="embedVueCode" language="html" />
    </Card>
  </EmbedModal>
</template>
