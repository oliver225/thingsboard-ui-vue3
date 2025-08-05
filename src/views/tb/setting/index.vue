<template>
  <PageWrapper>
    <div ref="wrapperRef" class="admin-setting">
      <Tabs tab-position="left" :destroyInactiveTabPane="true" :tabBarStyle="{ width: '180px' }">
        <Tabs.TabPane key="10">
          <template #tab>
            <Icon :icon="'ant-design:global-outlined'" size="18" />
            基本设置
          </template>
          <GeneralSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="40">
          <template #tab>
            <Icon :icon="'ant-design:api-outlined'" size="18" />
            设备连接
          </template>
          <ConnectivitySetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="60">
          <template #tab>
            <Icon :icon="'ant-design:mail-outlined'" size="18" />
            邮件配置
          </template>
          <MailSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="80">
          <template #tab>
            <Icon :icon="'ant-design:message-outlined'" size="18" />
            短信配置
          </template>
          <SmsSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="100">
          <template #tab>
            <Icon :icon="'ant-design:branches-outlined'" size="18" />
            队列设置
          </template>
          <QueueList />
        </Tabs.TabPane>
        <Tabs.TabPane key="120">
          <template #tab>
            <Icon :icon="'ant-design:safety-outlined'" size="18" />
            安全设置
          </template>
          <SecuritySetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="160">
          <template #tab>
            <Icon :icon="'ant-design:trophy-outlined'" size="18" />
            JWT设置
          </template>
          <JwtSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="200">
          <template #tab>
            <Icon :icon="'ant-design:verified-outlined'" size="18" />
            双因素身份验证
          </template>
          双因素身份验证
        </Tabs.TabPane>
        <Tabs.TabPane key="240">
          <template #tab>
            <Icon :icon="'ant-design:contacts-outlined'" size="18" />
            OAuth2
          </template>
          OAuth2
        </Tabs.TabPane>
      </Tabs>
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup name="ViewsTbSettingIndex">
  import { Tabs } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { PageWrapper } from '/@/components/Page';
  import GeneralSetting from './generalSetting.vue';
  import ConnectivitySetting from './connectivitySetting.vue';
  import MailSetting from './mailSetting.vue';
  import SmsSetting from './smsSetting.vue';
  import QueueList from '../queue/list.vue';
  import SecuritySetting from './securitySetting.vue';
  import JwtSetting from './jwtSetting.vue';
</script>
<style lang="less">
  .admin-setting {
    .base-title {
      padding-left: 0;
    }

    .ant-tabs-tab-active {
      background-color: @item-active-bg;
    }

    .queue-list {
      .jeesite-basic-table {
        padding: 0;
      }
    }
  }
</style>
