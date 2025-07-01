<script lang="ts" setup>
import type { TenantApi } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { copyToClipboard } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { Button, Descriptions, message, TabPane, Tabs } from 'ant-design-vue';

import { getTenantInfoByIdApi } from '#/api';

defineOptions({
  name: 'TenantDetailDrawer',
});
const emits = defineEmits(['edit', 'delete', 'admin']);

const record = ref<null | TenantApi.TenantInfo>(null);
const tabActiveKey = ref('DETAIL');
const tabList = [
  {
    key: 'DETAIL',
    label: $t('详情'),
    icon: 'ant-design:appstore-outlined',
  },
  {
    key: 'TELEMETRY',
    label: $t('数据'),
    icon: 'ant-design:line-chart-outlined',
  },
  {
    key: 'ALARM',
    label: $t('报警'),
    icon: 'ant-design:alert-outlined',
  },
  {
    key: 'EVENT',
    label: $t('事件'),
    icon: 'ant-design:info-circle-outlined',
  },
  {
    key: 'RELATION',
    label: $t('关联'),
    icon: 'ant-design:radar-chart-outlined',
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('租户详情')}`,
  overlayBlur: 0,
  footer: false,
  width: '50%',

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getTenantInfoByIdApi(id);
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
  drawerApi.close();
  emits('delete', { row: record.value });
}

function handleAdmin() {
  drawerApi.close();
  emits('admin', { row: record.value });
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
        <IconifyIcon class="size-10" icon="mdi:account-supervisor" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.title }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('page.tenant.detail') }}
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
        <Button type="primary" @click="handleAdmin">
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-circle-outline" />
          租户管理员
        </Button>
        <Button type="primary" @click="handleEdit">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
          编辑租户
        </Button>
        <Button type="primary" danger @click="handleDelete">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
          删除租户
        </Button>
      </div>
      <div class="mb-2 flex space-x-4">
        <Button @click="handleCopyId">
          <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
          复制租户ID
        </Button>
      </div>
      <Descriptions bordered :column="2" size="middle">
        <Descriptions.Item label="租户名称" :span="2">
          {{ record?.title }}
        </Descriptions.Item>
        <Descriptions.Item label="租户配置">
          {{ record?.tenantProfileName }}
        </Descriptions.Item>
        <Descriptions.Item label="邮政编码">
          {{ record?.zip }}
        </Descriptions.Item>
        <Descriptions.Item label="手机号码">
          {{ record?.phone }}
        </Descriptions.Item>
        <Descriptions.Item label="邮箱地址">
          {{ record?.email }}
        </Descriptions.Item>
        <Descriptions.Item label="详细地址" :span="2">
          {{ record?.address }}
        </Descriptions.Item>
        <Descriptions.Item label="备用地址" :span="2">
          {{ record?.address2 }}
        </Descriptions.Item>
        <Descriptions.Item label="描述信息" :span="2">
          {{ record?.additionalInfo?.description }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Drawer>
</template>
