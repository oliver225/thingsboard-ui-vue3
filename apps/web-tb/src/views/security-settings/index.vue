<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { TabPane, Tabs } from 'ant-design-vue';

import { router } from '#/router';

import JwtSetting from './jwtSetting.vue';
import SecuritySettings from './securitySetting.vue';

defineOptions({
  name: 'SecuritySettingsIndex',
});

const tabActiveKey = ref('general');

const settingType = router.currentRoute.value.params.settingType;

tabActiveKey.value = (settingType as string) || 'general';
</script>
<template>
  <Page auto-content-height>
    <div
      class="bg-background h-[calc(var(--vben-content-height)-32px)] overflow-hidden rounded-[var(--radius)] py-4 pr-4"
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
              <IconifyIcon icon="mdi:security" class="size-4" />
              <span>安全设置</span>
            </div>
          </template>
          <div
            class="h-[calc(var(--vben-content-height)-60px)] overflow-y-auto"
          >
            <SecuritySettings />
          </div>
        </TabPane>
        <TabPane key="jwt">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="ant-design:trophy-outlined" class="size-4" />
              <span>JWT 设置</span>
            </div>
          </template>
          <div
            class="h-[calc(var(--vben-content-height)-60px)] overflow-y-auto"
          >
            <JwtSetting />
          </div>
        </TabPane>
        <TabPane key="2fa">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon
                icon="mdi:two-factor-authentication"
                class="size-4"
              />
              <span>双因素认证</span>
            </div>
          </template>
          <div
            class="h-[calc(var(--vben-content-height)-60px)] overflow-y-auto"
          >
            开发中
          </div>
        </TabPane>
        <TabPane key="oauth2">
          <template #tab>
            <div class="flex items-center gap-2">
              <IconifyIcon icon="mdi:shield-account" class="size-4" />
              <span>OAuth2</span>
            </div>
          </template>
          <div
            class="h-[calc(var(--vben-content-height)-60px)] overflow-y-auto"
          >
            开发中
          </div>
        </TabPane>
      </Tabs>
    </div>
  </Page>
</template>
