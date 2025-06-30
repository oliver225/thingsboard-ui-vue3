<script lang="ts" setup>
import type { TenantApi } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Descriptions, TabPane, Tabs } from 'ant-design-vue';

import { getTenantInfoByIdApi } from '#/api';

defineOptions({
  name: 'TenantFormDetail',
});
const emits = defineEmits(['success']);

const record = ref<null | TenantApi.TenantInfo>(null);
const tabActiveKey = ref('DETAIL');

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
</script>
<template>
  <Drawer>
    <template #extra>
      <VbenIconButton class="mr-2">
        <IconifyIcon class="mb-1 size-4" icon="mdi:help-circle" />
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
        <TabPane key="DETAIL">
          <template #tab>
            <IconifyIcon icon="ant-design:appstore-outlined" />
            详情
          </template>
        </TabPane>
        <TabPane key="TELEMETRY">
          <template #tab>
            <IconifyIcon icon="ant-design:line-chart-outlined" />
            数据
          </template>
        </TabPane>
        <TabPane key="ALARM">
          <template #tab>
            <IconifyIcon icon="ant-design:alert-outlined" />
            报警
          </template>
        </TabPane>
        <TabPane key="EVENT">
          <template #tab>
            <IconifyIcon icon="ant-design:info-circle-outlined" />
            事件
          </template>
        </TabPane>
        <TabPane key="RELATION">
          <template #tab>
            <IconifyIcon icon="ant-design:radar-chart-outlined" />
            关联
          </template>
        </TabPane>
      </Tabs>
    </template>

    <div v-if="tabActiveKey === 'DETAIL'">
      <div class="mb-2 flex space-x-4">
        <Button type="primary">
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-circle-outline" />
          租户管理员
        </Button>
        <Button type="primary">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
          编辑租户
        </Button>
        <Button type="primary" danger>
          <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
          删除租户
        </Button>
      </div>
      <div class="mb-2 flex space-x-4">
        <Button>
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
