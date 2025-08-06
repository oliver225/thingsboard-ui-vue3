<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @cancel="handleCancel"
    @ok="handleSubmit"
    width="40%"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} - {{ descriptor?.name }} </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Row :gutter="16">
        <Col :span="18">
          <Form.Item label="节点名称" name="name" :rules="[{ required: true, message: '请输入节点名称!' }]">
            <Input v-model:value="formState.name" placeholder="请输入节点名称" />
          </Form.Item>
        </Col>
        <Col :span="6">
          <Form.Item label="&nbsp;" name="debugMode">
            <Switch v-model:checked="formState.debugMode" size="small" /><span class="ml-2">调试模式</span>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="singletonMode" v-show="singletonModeShow">
        <Switch v-model:checked="formState.singletonMode" size="small" /><span class="ml-2">单节点模式</span>
      </Form.Item>

      <component
        ref="compRef"
        :is="ruleChainTypes[formState.type]"
        :configuration="formState.configuration"
        :ruleChainId="formState.ruleChainId?.id"
      />

      <Form.Item label="描述信息" :name="['additionalInfo', 'description']">
        <Textarea v-model:value="formState.additionalInfo.description" placeholder="输入节点描述信息" :rows="3" />
      </Form.Item>

      <Form.Item name="type" v-show="false">
        <Input v-model:value="formState.type" />
      </Form.Item>
      <Form.Item :name="['additionalInfo', 'layoutX']" v-show="false">
        <InputNumber v-model:value="formState.additionalInfo.layoutX" />
      </Form.Item>
      <Form.Item :name="['additionalInfo', 'layoutY']" v-show="false">
        <InputNumber v-model:value="formState.additionalInfo.layoutY" />
      </Form.Item>
      <Form.Item name="configurationVersion" v-show="false">
        <InputNumber v-model:value="formState.configurationVersion" />
      </Form.Item>
    </Form>
  </BasicModal>
</template>

<script lang="ts">
  export default defineComponent({
    name: 'RuleChainNodeDataForm',
  });
</script>

<script lang="ts" setup>
  import { ref, unref, computed, defineComponent, reactive, getCurrentInstance } from 'vue';
  import { isEmpty } from 'lodash-es';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { RuleNode } from '/@/api/tb/ruleChain';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { ComponentDescriptor } from '/@/api/tb/componentDescriptor';
  import { Form, Row, Col, Textarea, Input, Switch, InputNumber } from 'ant-design-vue';
  import ruleChainTypes from './nodeTpl/rule-chain-types.json';
  import { EntityType } from '/@/enums/entityTypeEnum';
  const nodeTemplates = import.meta.glob('./nodeTpl/**/*.vue', { eager: true });

  const instance = getCurrentInstance();

  Object.keys(nodeTemplates).forEach((fileName) => {
    const comp = nodeTemplates[fileName];
    if (instance && comp.default && comp.default.name) {
      instance.appContext.components[comp.default.name] = comp.default;
    }
  });

  const emit = defineEmits(['success', 'cancel', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);

  const compRef = ref<any>();
  const formRef = ref<FormInstance>();

  const nodeId = ref('');
  const descriptor = ref<ComponentDescriptor>();
  const record = ref<RuleNode>();

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value?.id?.id ? t('编辑规则节点') : t('添加规则节点'),
  }));

  const singletonModeShow = computed(() => {
    return descriptor.value?.name == 'mqtt';
  });

  const formState = reactive<RuleNode>({
    id: { entityType: EntityType.RULE_NODE, id: '' },
    ruleChainId: { entityType: EntityType.RULE_CHAIN, id: '' },
    name: '',
    debugMode: false,
    singletonMode: false,
    type: descriptor.value?.clazz || '',
    configuration: descriptor.value?.configurationDescriptor.nodeDefinition.defaultConfiguration || {},
    configurationVersion: 0,
    additionalInfo: { description: '', layoutX: 0, layoutY: 0 },
  } as RuleNode);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    descriptor.value = data.descriptor;
    record.value = data.data || {};
    nodeId.value = data.nodeId || '';
    formState.ruleChainId = data.ruleChainId;
    Object.keys(record.value as any).forEach((key) => {
      formState[key] = record.value[key];
    });
    if (isEmpty(formState.id?.id)) {
      formState.type = descriptor.value?.clazz || '';
      formState.configuration = descriptor.value?.configurationDescriptor.nodeDefinition.defaultConfiguration || {};
      formState.configurationVersion = descriptor.value?.configurationVersion || 0;
    }
    formState.singletonMode = descriptor.value?.name == 'mqtt';
    console.log(descriptor.value);

    setModalProps({ loading: false });
  });

  function clear() {
    formState.id = { entityType: EntityType.RULE_NODE, id: '' };
    formState.ruleChainId = { entityType: EntityType.RULE_CHAIN, id: '' };
    formState.name = '';
    formState.debugMode = false;
    formState.singletonMode = false;
    formState.type = descriptor.value?.clazz || '';
    formState.configuration = descriptor.value?.configurationDescriptor.nodeDefinition.defaultConfiguration || {};
    formState.additionalInfo = { description: '', layoutX: 0, layoutY: 0 };
  }

  async function handleSubmit() {
    try {
      setModalProps({ confirmLoading: true });
      const data = await formRef.value?.validate();

      const configuration = await compRef.value.getConfiguration();

      // console.log('submit', params, data, record);
      setTimeout(closeModal);
      const ruleNode = {
        ...data,
        configuration: configuration,
        id: record.value?.id,
        ruleChainId: formState.ruleChainId,
      };
      emit('success', { nodeId: nodeId.value, data: ruleNode });
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }

  function handleCancel() {
    setTimeout(closeModal);
    if (record.value?.id?.id) {
      emit('success', { nodeId: nodeId.value, data: { ...record.value } });
    } else {
      emit('cancel', { nodeId: nodeId.value });
    }
  }
</script>
