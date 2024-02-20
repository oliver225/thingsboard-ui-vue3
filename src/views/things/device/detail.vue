<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">设备详情</span>
        </div>
      </div>
      <Tabs v-model:activeKey="tabActiveKey" class="drawer-title-tabs">
        <TabPane key="DETAIL">
          <template #tab><span>
              <Icon :icon="'ant-design:appstore-outlined'" /> 详情
            </span> </template>
        </TabPane>
        <TabPane key="TELEMETRY">
          <template #tab><span>
              <Icon :icon="'ant-design:line-chart-outlined'" /> 数据
            </span> </template>
        </TabPane>
        <TabPane key="ALARM">
          <template #tab><span>
              <Icon :icon="'ant-design:alert-outlined'" /> 报警
            </span> </template>
        </TabPane>
        <TabPane key="EVENT">
          <template #tab><span>
              <Icon :icon="'ant-design:info-circle-outlined'" /> 事件
            </span> </template>
        </TabPane>
        <TabPane key="RELATION">
          <template #tab><span>
              <Icon :icon="'ant-design:radar-chart-outlined'" /> 关联
            </span> </template>
        </TabPane>
        <TabPane key="AUDIT_LOG" v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
          <template #tab><span>
              <Icon :icon="'ant-design:bars-outlined'" /> 审计日志
            </span> </template>
        </TabPane>
      </Tabs>
    </template>
    <div class="detail-info-card">
      <Relation :entityType="EntityType.DEVICE" :entityId="record?.id?.id" v-if="tabActiveKey == 'RELATION'" />
    </div>
    <div class="detail-info-card">
      <Alarm :entityType="EntityType.DEVICE" :entityId="record?.id?.id" v-if="tabActiveKey == 'ALARM'" />
    </div>
    <div class="detail-info-card">
      <AuditLog :entityType="EntityType.DEVICE" :entityId="record?.id?.id" v-if="tabActiveKey == 'AUDIT_LOG'" />
    </div>
    <div class="telemetry-card">
      <Telemetry :entityType="EntityType.DEVICE" :entityId="record?.id?.id" v-if="tabActiveKey == 'TELEMETRY'" />
    </div>
    <div class="-translate-x-6" v-show="tabActiveKey == 'DETAIL'">
      <Space size="middle" class="mb-3">

        <a-button type="primary" @click="handleAssignToPublic"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN && !!!record.customerTitle">
          <Icon :icon="'ant-design:share-alt-outlined'" />设为公开
        </a-button>
        <a-button type="primary" @click="handleAssignCustomer"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN && !!!record.customerTitle">
          <Icon :icon="'ant-design:contacts-outlined'" />分配客户
        </a-button>
        <a-button type="primary" @click="handleUnAssignFromCustomer"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN && !!record.customerTitle">
          <Icon :icon="'ant-design:rollback-outlined'" />取消分配客户
        </a-button>
        <a-button type="primary" @click="handleCredentials">
          <Icon :icon="'ant-design:safety-outlined'" />管理凭证
        </a-button>
        <a-button type="primary success" @click="handleEditDevice"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
          <Icon :icon="'clarity:note-edit-line'" />编辑设备
        </a-button>
        <a-button type="primary" danger @click="handleDeleteDevice"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
          <Icon :icon="'ant-design:delete-outlined'" />删除设备
        </a-button>
      </Space>
      <br />
      <Space size="middle" class="mb-3">
        <a-button @click="handleCopyDeviceId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制设备ID
        </a-button>
        <a-button @click="handleCopyAccessToken" v-if="credentials.credentialsType == CredentialsType.ACCESS_TOKEN">
          <Icon :icon="'ant-design:safety-outlined'" />
          复制访问令牌
        </a-button>
        <a-button @click="handleCopyMqttValue" v-if="credentials.credentialsType == CredentialsType.MQTT_BASIC">
          <Icon :icon="'ant-design:safety-outlined'" />
          复制MQTT 凭证
        </a-button>
      </Space>
      <Description @register="register" size="default">
        <template #gateway="{ data }">
          <Checkbox :checked="data.additionalInfo?.gateway || false" /> 是否网关
        </template>
      </Description>
    </div>

  </BasicDrawer>
</template>
<script lang="ts" setup name="DeviceDetail">
import { ref, unref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { DeviceInfo, getDeviceInfoById, DeviceCredentials, getDeviceCredentialsByDeviceId } from '/@/api/things/device';
import { Tabs, TabPane, Space, Checkbox } from 'ant-design-vue';
import { DescItem, Description, useDescription } from '/@/components/Description';
import { useUserStore } from '/@/store/modules/user';
import { Authority } from '/@/enums/authorityEnum';
import { CredentialsType } from '/@/enums/deviceEnum';
import Telemetry from '/@/views/things/telemetry/index.vue';
import AuditLog from '/@/views/things/auditLog/list.vue';
import Alarm from '/@/views/things/alarm/list.vue';
import Relation from '/@/views/things/relation/list.vue';

import { EntityType } from '/@/enums/entityTypeEnum';


const userStore = useUserStore();

const emit = defineEmits(['edit', 'delete', 'credentials', 'assignToPublic', 'assignToCustomer', 'unAssignFromCustomer', 'register',]);

const { t } = useI18n('things');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
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
    slot: 'gateway'
  },
  {
    label: t('分配的客户'),
    field: 'customerTitle',
    span: 4,
    show: () => userStore.getAuthority == Authority.TENANT_ADMIN
  },

  {
    label: t('描述信息'),
    field: 'additionalInfo.description',
    span: 4,
  },
];
const [register, { setDescProps }] = useDescription({
  schema: descSchema,
})



const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  try {
    setDrawerProps({ loading: true });
    await clear();
    record.value = await getDeviceInfoById(data.id.id);
    credentials.value = await getDeviceCredentialsByDeviceId(data.id.id);
    setDescProps({ data: record.value });
  } catch (error: any) {
    if (error.message) {
      showMessage(error.message, 'error')
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
  copyToClipboard(record.value.id.id, '复制设备ID成功！')
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
  copyToClipboard(credentials.value.credentialsId, '复制访问令牌成功！')
}

function handleCopyMqttValue() {
  copyToClipboard(credentials.value.credentialsValue, '复制MQTT访问凭证成功！')

}


</script>

<style lang="less">
.telemetry-card {
  .jeesite-basic-table {
    padding: 0;

    .jeesite-basic-table-header__header-top {
      margin-top: 0;
    }
  }
}

.detail-info-card {
  .jeesite-basic-table {
    padding: 0;

    .jeesite-basic-table-header__header-top {
      display: none;
    }
  }
}
</style>
