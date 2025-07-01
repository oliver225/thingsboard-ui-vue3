<script lang="ts" setup>
import type { TenantProfileApi } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { copyToClipboard } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Descriptions, message, TabPane, Tabs } from 'ant-design-vue';

import { getTenantProfileByIdApi } from '#/api';

defineOptions({
  name: 'TenantProfileDetailDrawer',
});
const emits = defineEmits(['edit', 'delete', 'default']);

const record = ref<null | TenantProfileApi.TenantProfile>(null);
const tabActiveKey = ref('DETAIL');
const tabList = [
  {
    key: 'DETAIL',
    label: $t('page.tabs.detail'),
    icon: 'ant-design:appstore-outlined',
  },
  {
    key: 'TELEMETRY',
    label: $t('page.tabs.telemetry'),
    icon: 'ant-design:line-chart-outlined',
  },
  {
    key: 'ALARM',
    label: $t('page.tabs.alarm'),
    icon: 'ant-design:alert-outlined',
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('tenantProfile.detail')}`,
  overlayBlur: 0,
  footer: false,
  width: '50%',

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getTenantProfileByIdApi(id);
      } else if (data) {
        record.value = data;
      }
    }
    drawerApi.setState({ loading: false });
  },
});

function reset() {
  record.value = null;
  tabActiveKey.value = 'DETAIL';
}

function handleEdit() {
  drawerApi.close();
  emits('edit', { row: record.value });
}
function handleDelete() {
  emits('delete', { row: record.value });
  drawerApi.close();
}
function handleDefault() {
  emits('default', { row: record.value });
  drawerApi.close();
}

function handleCopyId() {
  if (record?.value?.id) {
    copyToClipboard(record?.value?.id.id);
    message.success({
      content: `${$t('复制成功！')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  }
}
</script>
<template>
  <Drawer>
    <template #extra>
      <VbenIconButton class="mr-2">
        <IconifyIcon class="size-4" icon="mdi:help-circle" />
      </VbenIconButton>
    </template>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon class="size-10" icon="mdi:account-box-multiple" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.name }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('tenantProfile.detail') }}
          </p>
        </div>
      </div>
    </template>
    <template #prepend-content>
      <Tabs v-model:active-key="tabActiveKey" class="detail-tabs">
        <TabPane v-for="tab in tabList" :key="tab.key">
          <template #tab>
            <IconifyIcon :icon="tab.icon" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>

    <div v-if="tabActiveKey === 'DETAIL'">
      <div class="mb-2 flex space-x-4">
        <Button
          v-if="record?.default === false"
          type="primary"
          @click="handleDefault"
        >
          <IconifyIcon class="mb-1 size-4" icon="mdi:flag" />
          {{ $t('设为默认配置') }}
        </Button>
        <Button type="primary" @click="handleEdit">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
          {{ $t('tenantProfile.button.edit') }}
        </Button>
        <Button type="primary" danger @click="handleDelete">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
          {{ $t('tenantProfile.button.remove') }}
        </Button>
      </div>
      <div class="mb-2 flex space-x-4">
        <Button @click="handleCopyId">
          <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
          {{ $t('tenantProfile.button.copyId') }}
        </Button>
      </div>
      <Descriptions bordered :column="2" size="middle">
        <Descriptions.Item :label="$t('tenantProfile.form.name')" :span="2">
          {{ record?.name }}
        </Descriptions.Item>

        <Descriptions.Item
          :label="$t('tenantProfile.form.description')"
          :span="2"
        >
          {{ record?.description }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Drawer>
</template>
