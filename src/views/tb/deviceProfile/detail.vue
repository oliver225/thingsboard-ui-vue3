<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">
            {{ getTitle.value || '· · · ·' }}
            <Tag class="text-base font-normal" color="success" v-if="record.default == true">{{
              t('tb.deviceProfile.detail.defaultTag')
            }}</Tag>
          </span>
          <span class="text-sm">{{ t('tb.deviceProfile.detail.detail') }}</span>
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
          @click="handleSetDefault"
          v-if="!(record.name == 'TbServiceQueue' || record.default == true)"
        >
          <Icon :icon="'ant-design:flag-outlined'" />{{ t('tb.deviceProfile.action.setDefault') }}
        </a-button>
        <a-button type="primary success" @click="handleEditDeviceProfile">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.deviceProfile.action.edit') }}
        </a-button>
        <a-button
          type="primary"
          danger
          @click="handleDeleteDeviceProfile"
          v-if="!(record.name == 'TbServiceQueue' || record.default == true)"
        >
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.deviceProfile.action.delete') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyDeviceProfileId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.deviceProfile.action.copyId') }}
        </a-button>
      </div>
      <Description @register="register" size="default">
        <template #defaultRuleChain="{ data }">
          {{ data?.defaultRuleChain?.name }}
        </template>
        <template #defaultDashboard="{ data }">
          {{ data?.defaultDashboard?.title }}
        </template>
        <template #defaultEdgeRuleChain="{ data }">
          {{ data?.defaultEdgeRuleChain?.name }}
        </template>
        <template #image="{ data }">
          <ImageUrlInput class="m--4" v-if="data.image" v-model:value="data.image" :disabled="true" />
        </template>
      </Description>
    </div>

    <div v-if="tabActiveKey == 'TRANSPORT'" class="border border-solid border-neutral-300 p-4">
      <TransportForm class="pointer-events-none" ref="transportFrom" />
    </div>

    <div v-if="tabActiveKey == DetailTabItemEnum.ALARM.key" class="border border-solid border-neutral-300 p-4">
      <AlarmForm class="pointer-events-none" ref="alarmFrom" />
    </div>

    <div v-if="tabActiveKey == 'PROVISION'" class="border border-solid border-neutral-300 p-4">
      <ProvisionForm class="pointer-events-none" ref="provisionFrom" />
    </div>

    <AuditLog
      v-if="tabActiveKey == DetailTabItemEnum.AUDIT_LOG.key"
      :entityType="EntityType.DEVICE_PROFILE"
      :entityId="record?.id?.id"
    />

    <CalculatedField
      v-if="tabActiveKey == DetailTabItemEnum.CALCULATED.key"
      :entityType="EntityType.DEVICE_PROFILE"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbDeviceProfileDetail">
  import { ref, computed, unref, watch, nextTick } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { copyToClipboard } from '/@/utils';
  import { Tabs, TabPane, Image, Tag } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { getRuleChainById } from '/@/api/tb/ruleChain';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { getDashboardInfoById } from '/@/api/tb/dashboard';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { getDeviceProfileById, DeviceProfile } from '/@/api/tb/deviceProfile';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { router } from '/@/router';
  import TransportForm from './transport/transportForm.vue';
  import AlarmForm from './alarm/alarmForm.vue';
  import ProvisionForm from './provisionForm.vue';
  import CalculatedField from '/@/views/tb/calculatedField/list.vue';
  import { ProvisionType, TransportType } from '/@/enums/deviceEnum';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';
  import ImageUrlInput from '/@/views/tb/images/ImageUrlInput.vue';

  const userStore = useUserStore();

  const emit = defineEmits(['edit', 'delete', 'default', 'register']);
  const { hasPermission } = usePermission();

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<DeviceProfile>({} as DeviceProfile);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = hasPermission(Authority.TENANT_ADMIN)
    ? [
        DetailTabItemEnum.DETAIL,
        { key: 'TRANSPORT', label: t('tb.deviceProfile.steps.transport'), icon: 'ant-design:cloud-upload-outlined' },
        DetailTabItemEnum.CALCULATED,
        {
          ...DetailTabItemEnum.ALARM,
          label: `${t('tb.deviceProfile.steps.alarm')}(${record.value.profileData?.alarms?.length || 0})`,
        },
        { key: 'PROVISION', label: t('tb.deviceProfile.steps.provision'), icon: 'ant-design:file-protect-outlined' },
        DetailTabItemEnum.AUDIT_LOG,
      ]
    : [
        DetailTabItemEnum.DETAIL,
        { key: 'TRANSPORT', label: t('tb.deviceProfile.steps.transport'), icon: 'ant-design:cloud-upload-outlined' },
        {
          ...DetailTabItemEnum.ALARM,
          label: `${t('tb.deviceProfile.steps.alarm')}(${record.value.profileData?.alarms?.length || 0})`,
        },
        { key: 'PROVISION', label: t('tb.deviceProfile.steps.provision'), icon: 'ant-design:file-protect-outlined' },
      ];

  const transportFrom = ref<any>(null);
  const alarmFrom = ref<any>(null);
  const provisionFrom = ref<any>(null);

  const descSchema: DescItem[] = [
    {
      label: t('tb.deviceProfile.form.name'),
      field: 'name',
      span: 4,
    },
    {
      label: t('tb.deviceProfile.form.defaultRuleChain'),
      field: 'defaultRuleChain',
      slot: 'defaultRuleChain',
      span: 4,
    },
    {
      label: t('tb.deviceProfile.form.mobileDashboard'),
      field: 'defaultDashboard',
      slot: 'defaultDashboard',
      span: 4,
    },
    {
      label: t('tb.deviceProfile.form.queue'),
      field: 'defaultQueueName',
      span: 4,
    },
    {
      label: t('tb.deviceProfile.form.edgeRuleChain'),
      field: 'defaultEdgeRuleChain',
      slot: 'defaultEdgeRuleChain',
      span: 4,
    },
    {
      label: t('tb.deviceProfile.detail.image'),
      field: 'image',
      slot: 'image',
      span: 4,
    },
    {
      label: t('tb.deviceProfile.form.description'),
      field: 'description',
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
      record.value = await getDeviceProfileById(data.id.id);
      if (record.value.defaultRuleChainId?.id) {
        record.value.defaultRuleChain = await getRuleChainById(record.value.defaultRuleChainId.id);
      }
      if (record.value.defaultDashboardId?.id) {
        record.value.defaultDashboard = await getDashboardInfoById(record.value.defaultDashboardId.id);
      }
      if (record.value.defaultEdgeRuleChainId?.id) {
        record.value.defaultEdgeRuleChain = await getRuleChainById(record.value.defaultEdgeRuleChainId.id);
      }
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

  watch(
    () => tabActiveKey.value,
    () => {
      if (tabActiveKey.value == 'ALARM') {
        nextTick(() => {
          if (alarmFrom.value != null) {
            alarmFrom.value.setFieldsValue(record.value?.profileData?.alarms || []);
          }
        });
      } else if (tabActiveKey.value == 'TRANSPORT') {
        nextTick(() => {
          if (transportFrom.value != null) {
            transportFrom.value.setFieldsValue(
              record.value?.profileData?.transportConfiguration || { type: TransportType.DEFAULT },
            );
          }
        });
      } else if (tabActiveKey.value == 'PROVISION') {
        nextTick(() => {
          if (provisionFrom.value != null) {
            const provisionConfig = record.value?.profileData?.provisionConfiguration;
            provisionFrom.value.setFieldsValue(
              provisionConfig
                ? {
                    ...provisionConfig,
                    provisionDeviceKey: record.value?.provisionDeviceKey,
                  }
                : { type: ProvisionType.DISABLED, provisionDeviceKey: null },
            );
          }
        });
      }
    },
  );

  async function clear() {
    record.value = {} as DeviceProfile;
    tabActiveKey.value = 'DETAIL';
    setDescProps({ data: {} });
  }

  function handleCopyDeviceProfileId() {
    copyToClipboard(record.value.id.id, t('tb.deviceProfile.action.copyIdSuccess'));
  }

  function handleDeleteDeviceProfile() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditDeviceProfile() {
    emit('edit', record.value);
    closeDrawer();
  }

  function handleSetDefault() {
    emit('default', record.value);
    closeDrawer();
  }
</script>
<style lang="less"></style>
