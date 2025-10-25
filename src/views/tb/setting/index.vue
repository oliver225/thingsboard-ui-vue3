<template>
  <PageWrapper>
    <div ref="wrapperRef" class="admin-setting">
      <Tabs tab-position="left" :destroyInactiveTabPane="true" :tabBarStyle="{ width: '180px' }">
        <Tabs.TabPane key="10">
          <template #tab>
            <Icon :icon="'ant-design:global-outlined'" size="18" />
            {{ t('tb.setting.tabs.general') }}
          </template>
          <GeneralSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="40">
          <template #tab>
            <Icon :icon="'ant-design:api-outlined'" size="18" />
            {{ t('tb.setting.tabs.connectivity') }}
          </template>
          <ConnectivitySetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="60">
          <template #tab>
            <Icon :icon="'ant-design:mail-outlined'" size="18" />
            {{ t('tb.setting.tabs.mail') }}
          </template>
          <MailSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="80">
          <template #tab>
            <Icon :icon="'ant-design:message-outlined'" size="18" />
            {{ t('tb.setting.tabs.sms') }}
          </template>
          <SmsSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="100">
          <template #tab>
            <Icon :icon="'ant-design:branches-outlined'" size="18" />
            {{ t('tb.setting.tabs.queue') }}
          </template>
          <QueueList />
        </Tabs.TabPane>
        <Tabs.TabPane key="120">
          <template #tab>
            <Icon :icon="'ant-design:safety-outlined'" size="18" />
            {{ t('tb.setting.tabs.security') }}
          </template>
          <SecuritySetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="160">
          <template #tab>
            <Icon :icon="'ant-design:trophy-outlined'" size="18" />
            {{ t('tb.setting.tabs.jwt') }}
          </template>
          <JwtSetting />
        </Tabs.TabPane>
        <Tabs.TabPane key="200">
          <template #tab>
            <Icon :icon="'ant-design:verified-outlined'" size="18" />
            {{ t('tb.setting.tabs.twoFactorAuth') }}
          </template>
          {{ t('tb.setting.tabs.twoFactorAuth') }}
        </Tabs.TabPane>
        <Tabs.TabPane key="240">
          <template #tab>
            <Icon :icon="'ant-design:contacts-outlined'" size="18" />
            {{ t('tb.setting.tabs.oauth2') }}
          </template>
          {{ t('tb.setting.tabs.oauth2') }}
        </Tabs.TabPane>
      </Tabs>
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup name="ViewsTbSettingIndex">
  import { useI18n } from '/@/hooks/web/useI18n';
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

  const { t } = useI18n('tb');
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
      .tbv3-basic-table {
        padding: 0;
      }
    }
  }
</style>
