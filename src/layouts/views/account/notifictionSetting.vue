<template>
  <CollapseContainer :title="t('通知设置')" :canExpan="false">
    <div v-if="record?.prefs" class="notifiction-container">
      <div class="notifiction-header">
        <div class="notifiction-item notifiction-title"> <Checkbox> 类型 </Checkbox></div>
        <div class="notifiction-item notifiction-delivery"><Checkbox> Web </Checkbox> </div>
        <div class="notifiction-item notifiction-delivery"><Checkbox> Email </Checkbox> </div>
        <div class="notifiction-item notifiction-delivery"><Checkbox> 短信 </Checkbox> </div>
      </div>

      <div v-for="(prefs, type) in record.prefs" :key="type" class="notifiction-row">
        <div class="notifiction-item notifiction-title">
          <Checkbox v-model="prefs.enabled">
            {{ NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == type.toString())?.label || type }}
          </Checkbox>
        </div>
        <div class="notifiction-item notifiction-delivery">
          <Checkbox v-model="prefs.enabledDeliveryMethods['WEB']"> WEB </Checkbox>
        </div>
        <div class="notifiction-item notifiction-delivery">
          <Checkbox v-model="prefs.enabledDeliveryMethods['EMAIL']"> EMAIL </Checkbox>
        </div>
        <div class="notifiction-item notifiction-delivery">
          <Checkbox v-model="prefs.enabledDeliveryMethods['SMS']"> SMS </Checkbox>
        </div>
      </div>
    </div>
  </CollapseContainer>
</template>
<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { Checkbox } from 'ant-design-vue';
  import { CollapseContainer, ScrollContainer } from '/@/components/Container';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { getUserNotificationSettings, NotificationSettings } from '/@/api/tb/notification';
  import { NOTIFICATION_TYPE_OPTIONS } from '/@/enums/notificationEnum';
  const { t } = useI18n();

  const record = ref<NotificationSettings>();

  async function fetch() {
    record.value = await getUserNotificationSettings();
  }

  onMounted(async () => {
    await fetch();
  });
</script>
<style lang="less">
  .notifiction-container {
    padding-left: 30px;
    padding-right: 30px;

    .notifiction-header {
      width: 100%;
      border: 1px solid @border-color-base;
      background-color: @border-color-dark;
      .notifiction-item {
        font-weight: bold;
        display: inline-block;
        height: 40px;
        font-size: 14px;
        align-content: center;
        padding-left: 16px;
      }
      .notifiction-title {
        width: 40%;
      }
      .notifiction-delivery {
        width: 20%;
      }
    }
    .notifiction-row {
      width: 100%;
      border: 1px solid @border-color-base;

      .notifiction-item {
        display: inline-block;
        height: 40px;
        font-size: 14px;
        align-content: center;
        padding-left: 16px;
      }
      .notifiction-title {
        width: 40%;
      }
      .notifiction-delivery {
        width: 20%;
      }
    }
  }
</style>
