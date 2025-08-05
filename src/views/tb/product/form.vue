<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @ok="handleSubmit"
    @register="registerModal"
    width="60%"
    class="product-form"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>

    <Tabs v-model:activeKey="tabActiveKey" tabPosition="left">
      <Tabs.TabPane key="DETAIL" :forceRender="true">
        <template #tab>
          <span> 产品详情 </span>
        </template>
        <Form ref="formRef" :model="formState" :labelCol="{ style: { width: '120px' } }" :wrapperCol="{ span: 18 }">
          <Form.Item label="产品名称" name="name" :rules="[{ required: true, message: '请输入产品名称!' }]">
            <Input v-model:value="formState.name" placeholder="请输入配置名称" />
          </Form.Item>
          <Form.Item label="默认规则链" :name="['defaultRuleChainId', 'id']">
            <Select
              v-model:value="formState.defaultRuleChainId.id"
              :options="ruleChainOptions"
              :allow-clear="true"
              placeholder="请选择默认规则链"
            />
          </Form.Item>
          <Form.Item label="移动端仪表盘" :name="['defaultDashboardId', 'id']">
            <Select
              v-model:value="formState.defaultDashboardId.id"
              :options="ruleChainOptions"
              :allow-clear="true"
              placeholder="请选择移动端仪表盘"
            />
          </Form.Item>
          <Form.Item label="队列" name="defaultQueueName">
            <Select v-model:value="formState.defaultQueueName" :allow-clear="true" placeholder="请选择队列">
              <Select.Option v-for="(option, index) in queueOptions" :key="index" :value="option.value">
                {{ option.label }}
                <p>
                  <Tag>
                    <small>提交策略:</small>
                    {{
                      SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === option.submitStrategy)?.label ||
                      option.submitStrategy
                    }}
                  </Tag>
                  <Tag>
                    <small>处理策略:</small>
                    {{
                      PROCESSING_STRATEGY_OPTIONS.find((item) => item.value === option.processingStrategy)?.label ||
                      option.processingStrategy
                    }}
                  </Tag>
                </p>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="默认边缘规则链" :name="['defaultEdgeRuleChainId', 'id']">
            <Select
              v-model:value="formState.defaultEdgeRuleChainId.id"
              :options="edgeRuleChainOptions"
              :allow-clear="true"
              placeholder="请选择默认边缘规则链"
            />
          </Form.Item>
          <Form.Item label="选择图片" name="image" :rules="[{ required: true, message: '请输入产品图片!' }]">
            <ImageUrlInput v-model:value="formState.image" />
          </Form.Item>
          <Form.Item label="描述信息" name="description">
            <Input.TextArea v-model:value="formState.description" placeholder="请输入描述信息" />
          </Form.Item>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="TRANSPORT" :forceRender="true">
        <template #tab>
          <span> 传输配置 </span>
        </template>
        <div class="profile-container" :style="{ maxHeight: maxHeight + 'px' }">
          <TransportForm ref="transportFrom" />
        </div>
      </Tabs.TabPane>
      <!-- <Tabs.TabPane key="THINGMODEL" :forceRender="true">
        <template #tab>
          <span> 物模型 </span>
        </template>
        <div class="profile-container" :style="{ maxHeight: maxHeight + 'px' }">
          <ThingModelForm ref="thingModelFrom" />
        </div>
      </Tabs.TabPane> -->
      <Tabs.TabPane key="ALARM" :forceRender="true">
        <template #tab>
          <span> 报警规则 </span>
        </template>
        <div class="profile-container" :style="{ maxHeight: maxHeight + 'px' }">
          <AlarmForm ref="alarmFrom" />
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane key="PROVISION" :forceRender="true">
        <template #tab>
          <span> 设备预配置 </span>
        </template>
        <div class="profile-container" :style="{ maxHeight: maxHeight + 'px' }">
          <ProvisionForm ref="provisionFrom" />
        </div>
      </Tabs.TabPane>
    </Tabs>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbProductForm">
  import { ref, unref, reactive, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { Select, Tag, Input, Tabs, Form } from 'ant-design-vue';

  import TransportForm from './transport/transportForm.vue';
  import AlarmForm from './alarm/alarmForm.vue';
  import ProvisionForm from './provisionForm.vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { currentTenantDashboardList } from '/@/api/tb/dashboard';
  import { queueList } from '/@/api/tb/queue';
  import { ruleChainList } from '/@/api/tb/ruleChain';
  import { TransportType, ProvisionType } from '/@/enums/deviceEnum';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
  import { saveDeviceProfile, getDeviceProfileById, DeviceProfile } from '/@/api/tb/deviceProfile';
  import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
  import { isEmpty } from '/@/utils/is';
  import ImageUrlInput from '/@/views/tb/images/ImageUrlInput.vue';
import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const { meta } = unref(router.currentRoute);

  const maxHeight = ref(500);

  const userStore = useUserStore();

  const record = ref<DeviceProfile>({} as DeviceProfile);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑产品') : t('新增产品'),
  }));

  const tabActiveKey = ref('DETAIL');

  const formRef = ref<FormInstance>();
  const transportFrom = ref<any>(null);
  const alarmFrom = ref<any>(null);
  const provisionFrom = ref<any>(null);

  const formState = reactive<any>({
    tenantId: userStore.getUserInfo.tenantId,
    type: 'DEFAULT',
    name: '',
    defaultRuleChainId: { id: '' },
    defaultDashboardId: { id: '' },
    defaultQueueName: '',
    defaultEdgeRuleChainId: { id: '' },
    image: '',
    description: '',
    transportType: TransportType.DEFAULT,
    provisionType: ProvisionType.DISABLED,
    provisionDeviceKey: '',
    profileData: {},
  });

  const queueOptions = ref<any[]>([]);
  const ruleChainOptions = ref<any[]>([]);
  const edgeRuleChainOptions = ref<any[]>([]);
  const dashboardOptions = ref<any[]>([]);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    tabActiveKey.value = 'DETAIL';
    record.value = { ...data } as DeviceProfile;
    if (data?.id?.id) {
      const res = await getDeviceProfileById(data.id.id);
      record.value = (res || {}) as DeviceProfile;
    }
    await fetchQueueList();
    await fetchRuleChainList();
    await fetchDashboardList();

    Object.keys(record.value).forEach((key) => {
      formState[key] = record.value[key];
    });

    formState.defaultRuleChainId = formState.defaultRuleChainId || { id: '' };
    formState.defaultEdgeRuleChainId = formState.defaultEdgeRuleChainId || { id: '' };
    formState.defaultDashboardId = formState.defaultDashboardId || { id: '' };

    transportFrom.value.setFieldsValue(
      record.value?.profileData?.transportConfiguration || { type: TransportType.DEFAULT },
    );
    provisionFrom.value.setFieldsValue(
      {
        ...record.value?.profileData?.provisionConfiguration,
        provisionDeviceKey: record.value?.provisionDeviceKey,
      } || { type: ProvisionType.DISABLED, provisionDeviceKey: null },
    );
    alarmFrom.value.setFieldsValue(record.value?.profileData?.alarms || []);

    setModalProps({ loading: false });
  });

  async function handleProfileData() {
    const profileData = {
      configuration: { type: 'DEFAULT' },
      transportConfiguration: { type: TransportType.DEFAULT },
      provisionConfiguration: { type: ProvisionType.DISABLED, provisionDeviceKey: null },
      alarms: null,
    };
    try {
      profileData.transportConfiguration = await transportFrom.value.validate();
      try {
        profileData.provisionConfiguration = await provisionFrom.value.validate();
        try {
          profileData.alarms = await alarmFrom.value.validate();
          return profileData;
        } catch (error: any) {
          tabActiveKey.value = 'ALARM';
          showMessage(t('common.validateError'));
        }
      } catch (error: any) {
        tabActiveKey.value = 'PROVISION';
        showMessage(t('common.validateError'));
      }
    } catch (error: any) {
      tabActiveKey.value = 'TRANSPORT';
      showMessage(t('common.validateError'));
    }
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        data.profileData = await handleProfileData();
      }
      setModalProps({ confirmLoading: true });
      if (data) {
        data.defaultRuleChainId = isEmpty(data.defaultRuleChainId.id)
          ? null
          : { entityType: EntityType.RULE_CHAIN, id: data.defaultRuleChainId.id };
        data.defaultDashboardId = isEmpty(data.defaultDashboardId.id)
          ? null
          : { entityType: EntityType.DASHBOARD, id: data.defaultDashboardId.id };
        data.defaultEdgeRuleChainId = isEmpty(data.defaultEdgeRuleChainId.id)
          ? null
          : { entityType: EntityType.RULE_CHAIN, id: data.defaultEdgeRuleChainId.id };
        data.transportType = data.profileData.transportConfiguration.type;
        data.provisionType = data.profileData.provisionConfiguration.type;
        data.provisionDeviceKey = data.profileData.provisionConfiguration.provisionDeviceKey;
      }

      // console.log('submit', data, record);
      const res = await saveDeviceProfile({
        ...data,
        id: record.value.id,
        tenantId: userStore.getUserInfo.tenantId,
        type: 'DEFAULT',
      });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}产品成功！`);
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        tabActiveKey.value = 'DETAIL';
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }

  async function fetchQueueList() {
    const queueListResult = await queueList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      'TB_RULE_ENGINE',
    );
    queueOptions.value = queueListResult.data.map((item) => {
      return {
        value: item.name,
        label: item.name,
        submitStrategy: item.submitStrategy?.type,
        processingStrategy: item.processingStrategy?.type,
      };
    });
  }

  async function fetchRuleChainList() {
    const ruleChainResult = await ruleChainList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      'CORE',
    );
    const edgeRuleChainResult = await ruleChainList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      'EDGE',
    );
    ruleChainOptions.value = ruleChainResult.data.map((item) => {
      return { value: item.id.id, label: item.name };
    });

    edgeRuleChainOptions.value = edgeRuleChainResult.data.map((item) => {
      return { value: item.id.id, label: item.name };
    });
  }
  async function fetchDashboardList() {
    const dasbhoardResult = await currentTenantDashboardList({
      pageSize: 50,
      page: 0,
      sortProperty: 'title',
      sortOrder: 'ASC',
    });
    dashboardOptions.value = dasbhoardResult.data.map((item) => {
      return {
        value: item.id.id,
        label: item.title,
      };
    });
  }

  useWindowSizeFn(computerHeight, 280, { immediate: true });

  function computerHeight() {
    maxHeight.value = document.body.clientHeight - 160;
  }
  function close() {
    closeModal();
  }
</script>
<style lang="less">
  .product-form {
  }
  .profile-container {
    min-height: 400px;
    overflow-y: auto;
  }
  .resource-image-select {
    border: 1px solid @border-color-light;
    border-radius: @border-radius-base;
    padding: 2px 4px;
    height: 90px;
    display: flex;
    .resource-image {
      width: 90px;
      height: 100%;
      border: 1px solid @border-color-light;
      justify-items: center;
      align-content: center;
      image {
        width: 90px;
      }
    }
    .resource-info {
      flex: 1;
      display: flex;
      .resource-image-btn {
        border: 1px solid @border-color-light;
        margin: 6px;
        padding: 8px;
        justify-items: center;
        align-self: center;
        color: @primary-color;
        cursor: pointer;
        flex: 1;
      }
      .resource-image-btn:hover {
        background-color: fade(@primary-color, 10);
        border-color: @primary-color;
      }
    }
  }
</style>
