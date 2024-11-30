<template>
  <BasicDrawer
    v-bind="$attrs"
    :showFooter="false"
    @register="registerDrawer"
    width="60%"
    :rootClassName="'tb-detail-wrapper'"
  >
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 tb-detail-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">设备详情</span>
        </div>
      </div>
    </template>
    <Tabs v-model:activeKey="tabActiveKey" class="tb-detail-menu">
      <TabPane key="DETAIL">
        <template #tab
          ><span> <Icon :icon="'ant-design:appstore-outlined'" /> 详情 </span>
        </template>
        <div class="space-x-4">
          <a-button
            type="primary"
            @click="handleAssignToPublic"
            v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
          >
            <Icon :icon="'ant-design:share-alt-outlined'" />设为公开
          </a-button>
          <a-button
            type="primary"
            @click="handleAssignCustomer"
            v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
          >
            <Icon :icon="'ant-design:contacts-outlined'" />分配客户
          </a-button>
          <a-button
            type="primary"
            @click="handleUnAssignFromCustomer"
            v-if="hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle"
          >
            <Icon :icon="'ant-design:rollback-outlined'" />取消分配客户
          </a-button>
          <a-button type="primary" @click="handleCredentials">
            <Icon :icon="'ant-design:safety-outlined'" />管理凭证
          </a-button>
          <a-button
            type="primary success"
            @click="handleEditDevice"
            v-if="hasPermission(Authority.TENANT_ADMIN)"
          >
            <Icon :icon="'i-clarity:note-edit-line'" />编辑设备
          </a-button>
          <a-button
            type="primary"
            danger
            @click="handleDeleteDevice"
            v-if="hasPermission(Authority.TENANT_ADMIN)"
          >
            <Icon :icon="'ant-design:delete-outlined'" />删除设备
          </a-button>
        </div>
        <div class="space-x-4 my-4">
          <a-button @click="handleCopyDeviceId">
            <Icon :icon="'ant-design:copy-filled'" />
            复制设备ID
          </a-button>
          <a-button
            @click="handleCopyAccessToken"
            v-if="credentials.credentialsType == CredentialsType.ACCESS_TOKEN"
          >
            <Icon :icon="'ant-design:safety-outlined'" />
            复制访问令牌
          </a-button>
          <a-button
            @click="handleCopyMqttValue"
            v-if="credentials.credentialsType == CredentialsType.MQTT_BASIC"
          >
            <Icon :icon="'ant-design:safety-outlined'" />
            复制MQTT 凭证
          </a-button>
        </div>
        <Description @register="register" size="default">
          <template #gateway="{ data }">
            <Checkbox :checked="data.additionalInfo?.gateway || false" /> 是否网关
          </template>
        </Description>
      </TabPane>
      <TabPane key="TELEMETRY">
        <template #tab
          ><span> <Icon :icon="'ant-design:line-chart-outlined'" /> 数据 </span>
        </template>
        <Telemetry
          v-if="tabActiveKey == 'TELEMETRY'"
          :entityType="EntityType.DEVICE"
          :entityId="record?.id?.id"
        />
      </TabPane>
      <TabPane key="TGINGMODEL">
        <template #tab>
          <span> <Icon :icon="'ant-design:project-outlined'" /> 物模型 </span>
        </template>
        <ThingModelList
          ref="thingsModelFrom"
          :deviceProfileId="record.deviceProfileId?.id"
          :readOnly="true"
        />
      </TabPane>
      <TabPane key="TOPIC">
        <template #tab
          ><span> <Icon :icon="'ant-design:api-outlined'" /> 连接API </span>
        </template>
        <DeviceAPI :entityType="EntityType.DEVICE" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="ALARM">
        <template #tab
          ><span> <Icon :icon="'ant-design:alert-outlined'" /> 报警 </span>
        </template>
        <Alarm :entityType="EntityType.DEVICE" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="EVENT">
        <template #tab
          ><span> <Icon :icon="'ant-design:info-circle-outlined'" /> 事件 </span>
        </template>
        <Event :entityType="EntityType.DEVICE" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="RELATION">
        <template #tab
          ><span> <Icon :icon="'ant-design:radar-chart-outlined'" /> 关联 </span>
        </template>
        <Relation :entityType="EntityType.DEVICE" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="AUDIT_LOG" v-if="hasPermission(Authority.TENANT_ADMIN)">
        <template #tab
          ><span> <Icon :icon="'ant-design:bars-outlined'" /> 审计日志 </span>
        </template>
        <AuditLog :entityType="EntityType.DEVICE" :entityId="record?.id?.id" />
      </TabPane>
    </Tabs>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbDeviceDetail">
  import { ref, unref, computed, watch, nextTick } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import {
    DeviceInfo,
    getDeviceInfoById,
    DeviceCredentials,
    getDeviceCredentialsByDeviceId,
  } from '/@/api/tb/device';
  import { Tabs, TabPane, Checkbox } from 'ant-design-vue';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import { CredentialsType } from '/@/enums/deviceEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import Alarm from '/@/views/tb/alarm/list.vue';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import Relation from '/@/views/tb/relation/list.vue';
  import Event from '/@/views/tb/event/index.vue';
  import DeviceAPI from '/@/views/tb/device/deviceApi.vue';
  import ThingModelList from '/@/views/tb/product/thingModel/thingModelList.vue';


  const userStore = useUserStore();
  const { hasPermission } = usePermission();

  const emit = defineEmits([
    'edit',
    'delete',
    'credentials',
    'assignToPublic',
    'assignToCustomer',
    'unAssignFromCustomer',
    'register',
  ]);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const thingsModelFrom = ref<any>(null);
  const record = ref<DeviceInfo>({} as DeviceInfo);
  const credentials = ref<DeviceCredentials>({} as DeviceCredentials);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref('DETAIL');

  const descSchema: DescItem[] = [
    {
      label: t('设备名称'),
      field: 'name',
      span: 2,
    },
    {
      label: t('标签'),
      field: 'label',
      span: 2,
    },
    {
      label: t('设备配置'),
      field: 'deviceProfileName',
      span: 2,
    },
    {
      label: t('网关'),
      field: 'additionalInfo.gateway',
      span: 2,
      slot: 'gateway',
    },
    {
      label: t('分配的客户'),
      field: 'customerTitle',
      span: 4,
      show: () => hasPermission(Authority.TENANT_ADMIN),
    },

    {
      label: t('描述信息'),
      field: 'additionalInfo.description',
      span: 4,
    },
  ];
  const [register, { setDescProps }] = useDescription({
    schema: descSchema,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await getDeviceInfoById(data.id.id);
      credentials.value = await getDeviceCredentialsByDeviceId(data.id.id);
      setDescProps({ data: record.value });
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  async function clear() {
    tabActiveKey.value = 'DETAIL';
    record.value = {} as DeviceInfo;
    credentials.value = {} as DeviceCredentials;
    setDescProps({ data: {} });
  }

  function handleCopyDeviceId() {
    copyToClipboard(record.value.id.id, '复制设备ID成功！');
  }

  function handleDeleteDevice() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditDevice() {
    emit('edit', record.value);
    closeDrawer();
  }

  function handleCredentials() {
    emit('credentials', record.value);
    closeDrawer();
  }

  function handleAssignToPublic() {
    emit('assignToPublic', record.value);
    closeDrawer();
  }

  function handleAssignCustomer() {
    emit('assignToCustomer', record.value);
    closeDrawer();
  }

  function handleUnAssignFromCustomer() {
    emit('unAssignFromCustomer', record.value);
    closeDrawer();
  }

  function handleCopyAccessToken() {
    copyToClipboard(credentials.value.credentialsId, '复制访问令牌成功！');
  }

  function handleCopyMqttValue() {
    copyToClipboard(credentials.value.credentialsValue, '复制MQTT访问凭证成功！');
  }
</script>

<style lang="less"></style>
