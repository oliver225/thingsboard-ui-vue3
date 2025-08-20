<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { TabPane, Tabs } from 'ant-design-vue';

import { router } from '#/router';
import QueueList from '#/views/queue/list.vue';

defineOptions({
  name: 'SettingsIndex',
});

const tabActiveKey = ref('general');

const settingType = router.currentRoute.value.params.settingType;

tabActiveKey.value = (settingType as string) || 'general';
</script>
<template>
  <Page auto-content-height>
    <div
      class="bg-background h-[calc(var(--vben-content-height)-30px)] overflow-hidden rounded-[var(--radius)] py-4"
    >
      <Tabs
        v-model:active-key="tabActiveKey"
        tab-position="left"
        :destroy-inactive-tab-pane="true"
        :tab-bar-style="{ width: '180px' }"
      >
        <TabPane key="general">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:global-outlined" class="size-4" />
              <span>基本设置</span>
            </div>
          </template>
          <div></div>
        </TabPane>
        <TabPane key="connectivity">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:api-outlined" class="size-4" />
              <span>设备连接</span>
            </div>
          </template>
          <div></div>
        </TabPane>
        <TabPane key="mail">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:mail-outlined" class="size-4" />
              <span>邮件配置</span>
            </div>
          </template>
          <div></div>
        </TabPane>
        <TabPane key="sms">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:message-outlined" class="size-4" />
              <span>短信配置</span>
            </div>
          </template>
          <div></div>
        </TabPane>
        <TabPane key="queues">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:branches-outlined" class="size-4" />
              <span>队列设置</span>
            </div>
          </template>
          <QueueList style="margin-top: -40px" />
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
