<script lang="ts" setup>
import type { Queue } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button } from 'ant-design-vue';

import { getQueueByIdApi } from '#/api';
import { copyToClipboard } from '#/utils';

defineOptions({
  name: 'QueueDetailDrawer',
});
const emits = defineEmits(['edit', 'delete']);

const record = ref<null | Queue>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('队列详情')}`,
  overlayBlur: 0,
  footer: false,
  class: ['w-1/2'],

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getQueueByIdApi(id);
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

function handleEdit() {
  drawerApi.close();
  emits('edit', { ...record.value });
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
            {{ record?.name }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('队列详情') }}
          </p>
        </div>
      </div>
    </template>

    <div class="mb-2 flex space-x-4">
      <Button type="primary" @click="handleEdit">
        <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
        {{ $t('编辑队列') }}
      </Button>
      <Button type="primary" danger @click="handleDelete">
        <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
        {{ $t('删除队列') }}
      </Button>
    </div>
    <div class="mb-2 flex space-x-4">
      <Button @click="handleCopyId">
        <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
        {{ $t('复制队列ID') }}
      </Button>
    </div>
  </Drawer>
</template>
