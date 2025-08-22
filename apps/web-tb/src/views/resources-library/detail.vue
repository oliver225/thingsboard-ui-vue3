<script lang="ts" setup>
import type { Resource } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Descriptions } from 'ant-design-vue';

import { getResourceByIdApi } from '#/api';
import { RESOURCE_TYPE_OPTIONS } from '#/constants';
import { copyToClipboard } from '#/utils';

defineOptions({
  name: 'ResourceLibraryDetailDrawer',
});
const emits = defineEmits(['delete']);

const record = ref<null | Resource>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('资源详情')}`,
  overlayBlur: 0,
  footer: false,
  class: ['w-1/2'],

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getResourceByIdApi(id);
      } else if (data) {
        record.value = data;
      }
    }
    drawerApi.setState({ loading: false });
  },
});

function reset() {
  record.value = null;
}

function handleDelete() {
  drawerApi.close();
  emits('delete', { ...record.value });
}

function handleCopyId() {
  if (record?.value?.id) {
    copyToClipboard(record?.value?.id.id, '复制成功！');
  }
}
</script>
<template>
  <Drawer header-class="drawer-header">
    <template #extra>
      <VbenIconButton class="mr-2">
        <IconifyIcon class="size-4" icon="mdi:help-circle" />
      </VbenIconButton>
    </template>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon class="size-8" icon="mdi:account-supervisor" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.title }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('资源详情') }}
          </p>
        </div>
      </div>
    </template>

    <div class="mb-2 flex space-x-4">
      <Button type="primary" danger @click="handleDelete">
        <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
        {{ $t('删除资源') }}
      </Button>
    </div>
    <div class="mb-2 flex space-x-4">
      <Button @click="handleCopyId">
        <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
        {{ $t('复制资源ID') }}
      </Button>
    </div>
    <Descriptions bordered :column="2" size="middle">
      <Descriptions.Item :label="$t('标题')" :span="2">
        {{ record?.title }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('资源类型')" :span="2">
        {{
          RESOURCE_TYPE_OPTIONS.find(
            (item) => item.value === record?.resourceType,
          )?.label || record?.resourceType
        }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('文件名称')" :span="2">
        {{ record?.fileName }}
      </Descriptions.Item>
    </Descriptions>
  </Drawer>
</template>
