<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item label="消息计数" name="msgCount" :rules="[{ required: true, message: '消息计数必填!' }]">
      <InputNumber v-model:value="formState.msgCount" :min="0" :style="{ width: '100%' }"> </InputNumber>
    </Form.Item>
    <Form.Item label="周期（秒）" name="periodInSeconds" :rules="[{ required: true, message: '周期必填!' }]">
      <InputNumber v-model:value="formState.periodInSeconds" :min="0" :style="{ width: '100%' }"> </InputNumber>
    </Form.Item>
    <Row :gutter="20">
      <Col :span="8">
        <Form.Item label="发起" name="originatorType" :rules="[{ required: true }]">
          <Select v-model:value="formState.originatorType" :options="entityTypeOptions" @change="onEntityTypeChange">
          </Select>
        </Form.Item>
      </Col>
      <Col :span="16">
        <Form.Item label=" " name="originatorId" :rules="[{ required: true }]">
          <Select v-model:value="formState.originatorId" :options="entityIdOptions"> </Select>
        </Form.Item>
      </Col>
    </Row>
    <Form.Item label="队列" name="queueName">
      <Select v-model:value="formState.queueName">
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
    <Form.Item name="scriptLang">
      <div class="flex justify-center mb-2">
        <Radio.Group v-model:value="formState.scriptLang" button-style="solid">
          <Radio.Button value="JS">JavaScript</Radio.Button>
          <Radio.Button value="TBEL">&nbsp;&nbsp;&nbsp;TBEL&nbsp;&nbsp;&nbsp;</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <Form.Item :name="formState.scriptLang == 'JS' ? 'jsScript' : 'tbelScript'">
      <div>
        <div class="flex justify-between">
          <p class="text-gray-500">function Generate(prevMsg, prevMetadata, prevMsgType) {</p>
          <Space>
            <Tooltip title="格式化">
              <Icon class="cursor-pointer" @click="handleFormatScript" :icon="'ant-design:format-painter-filled'" />
            </Tooltip>
            <Tooltip title="测试脚本功能">
              <Icon class="cursor-pointer" @click="handleTestScript" :icon="'ant-design:bug-outlined'" />
            </Tooltip>
            <Tooltip title="全屏">
              <Icon class="cursor-pointer" @click="handleFullScreen" :icon="'ant-design:fullscreen-outlined'" />
            </Tooltip>
          </Space>
        </div>
        <div class="py-2">
          <CodeEditor
            v-if="formState.scriptLang == 'JS'"
            v-model:value="formState.jsScript"
            :mode="'javascript'"
            class="border border-solid border-gray-400"
          />
          <CodeEditor
            v-if="formState.scriptLang == 'TBEL'"
            v-model:value="formState.tbelScript"
            :mode="'javascript'"
            class="border border-solid border-gray-400"
          />
        </div>
        <div class="text-gray-500">}</div>
      </div>

      <Button class="mt-2" type="primary" @click="handleTestScript">测试generate函数</Button>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'generator',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive, onMounted } from 'vue';
  import { Form, InputNumber, Select, Tag, Row, Col, Radio, Space, Tooltip, Button } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { CodeEditor } from '/@/components/CodeEditor';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';
  import { queueList } from '/@/api/tb/queue';
  import { getTenantDeviceInfoList } from '/@/api/tb/device';
  import { getTenantAssetInfoList } from '/@/api/tb/asset';
  import { getTenantEntityViewInfos } from '/@/api/tb/entityView';
  import { tenantById } from '/@/api/tb/tenant';
  import { customerList } from '/@/api/tb/customer';
  import { userList } from '/@/api/tb/user';
  import { currentTenantDashboardList } from '/@/api/tb/dashboard';

  interface Configuration {
    msgCount: number;
    originatorId: string;
    originatorType: string;
    periodInSeconds: number;
    scriptLang: 'JS' | 'TBEL';
    queueName: string;
    tbelScript: string;
    jsScript: string;
  }
  const userStore = useUserStore();

  const queueOptions = ref<any[]>([]);

  const entityIdOptions = ref<any[]>([]);

  const entityTypeOptions = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.DEVICE ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.TENANT ||
      item.value == EntityType.CUSTOMER ||
      item.value == EntityType.USER ||
      item.value == EntityType.DASHBOARD ||
      item.value == EntityType.EDGE
    );
  });

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    msgCount: 0,
    originatorId: undefined,
    originatorType: undefined,
    queueName: undefined,
    periodInSeconds: 1,
    scriptLang: 'TBEL',
    tbelScript: '',
    jsScript: '',
  });

  watch(
    () => props.configuration,
    () => {
      formState.msgCount = props.configuration.msgCount;
      formState.queueName = props.configuration.queueName;
      formState.originatorId = props.configuration.originatorId;
      formState.originatorType = props.configuration.originatorType;
      formState.periodInSeconds = props.configuration.periodInSeconds;
      formState.scriptLang = props.configuration.scriptLang;
      formState.tbelScript = props.configuration.tbelScript;
      formState.jsScript = props.configuration.jsScript;
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  onMounted(async () => {
    await fetchQueueList();
  });

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

  async function onEntityTypeChange(entityType: EntityType) {
    switch (entityType) {
      case EntityType.DEVICE:
        const deviceListResult = await getTenantDeviceInfoList({
          pageSize: 50,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = deviceListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.ASSET:
        const assetListResult = await getTenantAssetInfoList({
          pageSize: 50,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = assetListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.ENTITY_VIEW:
        const entityViewListResult = await getTenantEntityViewInfos({
          pageSize: 50,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = entityViewListResult.data.map((device) => ({
          label: device.name,
          value: device.id.id,
        }));
        break;
      case EntityType.TENANT:
        const tenantResult = await tenantById(userStore.getUserInfo?.tenantId.id);
        entityIdOptions.value = [{ label: tenantResult.title, id: tenantResult.id.id }];
        break;
      case EntityType.CUSTOMER:
        const customerListResult = await customerList({
          pageSize: 50,
          page: 0,
          sortProperty: 'title',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = customerListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.USER:
        const userListResult = await userList({ pageSize: 50, page: 0, sortProperty: 'email', sortOrder: 'ASC' });
        entityIdOptions.value = userListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.DASHBOARD:
        const dashboardListResult = await currentTenantDashboardList({
          pageSize: 50,
          page: 0,
          sortProperty: 'title',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = dashboardListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      default:
        entityIdOptions.value = [];
    }
  }

  function handleFormatScript() {}

  function handleTestScript() {}

  function handleFullScreen() {}

  defineExpose({ getConfiguration });
</script>
