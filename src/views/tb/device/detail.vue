<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ t('tb.device.detail.detail') }}</span>
        </div>
      </div>
    </template>
    <template #prependContent>
      <Tabs v-model:active-key="tabActiveKey" class="tb-detail-menu">
        <TabPane v-for="tab in tabList" :key="tab.key">
          <template #tab>
            <Icon :icon="tab.icon" :size="16" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>
    <div v-show="tabActiveKey == DetailTabItemEnum.DETAIL.key">
      <div class="space-x-4">
        <a-button
          type="primary"
          @click="handleAssignToPublic"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
        >
          <Icon :icon="'ant-design:share-alt-outlined'" />{{ t('tb.device.detail.setPublic') }}
        </a-button>
        <a-button
          type="primary"
          @click="handleAssignCustomer"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
        >
          <Icon :icon="'ant-design:contacts-outlined'" />{{ t('tb.device.detail.assignCustomer') }}
        </a-button>
        <a-button
          type="primary"
          @click="handleUnAssignFromCustomer"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle"
        >
          <Icon :icon="'ant-design:rollback-outlined'" />{{ t('tb.device.detail.unassignCustomer') }}
        </a-button>
        <a-button type="primary" @click="handleCredentials">
          <Icon :icon="'ant-design:safety-outlined'" />{{ t('tb.device.detail.manageCredentials') }}
        </a-button>
        <a-button type="primary success" @click="handleEditDevice" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.device.detail.editDevice') }}
        </a-button>
        <a-button type="primary" danger @click="handleDeleteDevice" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.device.detail.deleteDevice') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyDeviceId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.device.detail.copyDeviceId') }}
        </a-button>
        <a-button @click="handleCopyAccessToken" v-if="credentials.credentialsType == CredentialsType.ACCESS_TOKEN">
          <Icon :icon="'ant-design:safety-outlined'" />
          {{ t('tb.device.detail.copyAccessToken') }}
        </a-button>
        <a-button @click="handleCopyMqttValue" v-if="credentials.credentialsType == CredentialsType.MQTT_BASIC">
          <Icon :icon="'ant-design:safety-outlined'" />
          {{ t('tb.device.detail.copyMqttCredentials') }}
        </a-button>
      </div>
      <Description @register="register" size="default">
        <template #gateway="{ data }">
          <Checkbox :checked="data.additionalInfo?.gateway || false" /> {{ t('tb.device.detail.isGateway') }}
        </template>
      </Description>
    </div>
    <DeviceAPI
      v-if="tabActiveKey == DetailTabItemEnum.TOPIC.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />

    <Telemetry
      v-if="tabActiveKey == DetailTabItemEnum.TELEMETRY.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />

    <CalculatedField
      v-if="tabActiveKey == DetailTabItemEnum.CALCULATED.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />
    <RPC v-if="tabActiveKey == DetailTabItemEnum.RPC.key" :entityType="EntityType.DEVICE" :entityId="record?.id?.id" />

    <Alarm
      v-if="tabActiveKey == DetailTabItemEnum.ALARM.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />

    <Event
      v-if="tabActiveKey == DetailTabItemEnum.EVENT.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />
    <Relation
      v-if="tabActiveKey == DetailTabItemEnum.RELATION.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />

    <AuditLog
      v-if="tabActiveKey == DetailTabItemEnum.AUDIT_LOG.key"
      :entityType="EntityType.DEVICE"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbDeviceDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { DeviceInfo, getDeviceInfoById, DeviceCredentials, getDeviceCredentialsByDeviceId } from '/@/api/tb/device';
  import { Tabs, TabPane, Checkbox } from 'ant-design-vue';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import { CredentialsType } from '/@/enums/deviceEnum';
  import Alarm from '/@/views/tb/alarm/list.vue';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import Relation from '/@/views/tb/relation/list.vue';
  import Event from '/@/views/tb/event/index.vue';
  import DeviceAPI from '/@/views/tb/device/deviceApi.vue';
  import CalculatedField from '/@/views/tb/calculatedField/list.vue';
  import RPC from '/@/views/tb/device/rpcSend.vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';

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
  const record = ref<DeviceInfo>({} as DeviceInfo);
  const credentials = ref<DeviceCredentials>({} as DeviceCredentials);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = hasPermission(Authority.TENANT_ADMIN)
    ? [
        DetailTabItemEnum.DETAIL,
        DetailTabItemEnum.TELEMETRY,
        DetailTabItemEnum.TOPIC,
        DetailTabItemEnum.RPC,
        DetailTabItemEnum.CALCULATED,
        DetailTabItemEnum.EVENT,
        DetailTabItemEnum.RELATION,
        DetailTabItemEnum.AUDIT_LOG,
      ]
    : [
        DetailTabItemEnum.DETAIL,
        DetailTabItemEnum.TELEMETRY,
        DetailTabItemEnum.TOPIC,
        DetailTabItemEnum.RPC,
        DetailTabItemEnum.ALARM,
        DetailTabItemEnum.EVENT,
        DetailTabItemEnum.RELATION,
      ];
  const descSchema: DescItem[] = [
    {
      label: t('tb.device.table.name'),
      field: 'name',
      span: 2,
    },
    {
      label: t('tb.device.table.label'),
      field: 'label',
      span: 2,
    },
    {
      label: t('tb.device.form.deviceProfile'),
      field: 'deviceProfileName',
      span: 2,
    },
    {
      label: t('tb.device.form.isGateway'),
      field: 'additionalInfo.gateway',
      span: 2,
      slot: 'gateway',
    },
    {
      label: t('tb.device.form.assignCustomer'),
      field: 'customerTitle',
      span: 4,
      show: () => hasPermission(Authority.TENANT_ADMIN),
    },

    {
      label: t('tb.device.form.description'),
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
    copyToClipboard(record.value.id.id, t('tb.device.action.copyDeviceIdSuccess'));
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
    copyToClipboard(credentials.value.credentialsId, t('tb.device.action.copyAccessTokenSuccess'));
  }

  function handleCopyMqttValue() {
    // 使用 action 下的 MQTT 凭证成功复制提示
    copyToClipboard(credentials.value.credentialsValue, t('tb.device.action.copyMqttCredentialsSuccess'));
  }
</script>

<style lang="less"></style>
