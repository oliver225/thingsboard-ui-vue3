<template>
  <BasicModal v-bind="$attrs" @register="registerModal" @ok="handleSubmit" width="40%">
    <template #title>
      <span>
        {{ getTitle.value }}
      </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item label="键名" name="key" :rules="[{ required: true, message: '请输入键名!' }]">
        <Input v-model:value="formState.key" placeholder="输入键名" />
      </Form.Item>
      <Row :gutter="20">
        <Col :span="12">
          <Form.Item label="值类型" name="type" :rules="[{ required: true, message: '请选择值类型!' }]">
            <Select v-model:value="formState.type" :default-value="'STRING'" :options="typeOptions" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="typeOptions.find((type) => type.value == formState.type)?.label + '值'"
            name="value"
            :rules="[{ required: true, message: '请输入数值!' }, { validator: validatorValue }]"
          >
            <Input v-if="formState.type == 'STRING'" v-model:value="formState.value" placeholder="请输入字符串值" />
            <InputNumber
              v-if="formState.type == 'NUMERIC'"
              :precision="0"
              :step="1"
              v-model:value="formState.value"
              :style="{ width: '100%' }"
              placeholder="请输入数值"
            />
            <InputNumber
              v-if="formState.type == 'DOUBLE'"
              :precision="2"
              :step="0.01"
              v-model:value="formState.value"
              :style="{ width: '100%' }"
              placeholder="请输入小数值"
            />
            <Radio.Group v-if="formState.type == 'BOOLEAN'" v-model:value="formState.value">
              <Radio :value="true">真</Radio>
              <Radio :value="false">假</Radio>
            </Radio.Group>
            <CodeEditor
              v-if="formState.type == 'JSON'"
              v-model:value="formState.value"
              class="border border-solid border-gray-400"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </BasicModal>
</template>
<script lang="ts" setup name="AttributeFrom">
  import { ref, computed, reactive } from 'vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Form, Input, Radio, InputNumber, Row, Col, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { saveEntityAttributesV1, saveEntityTelemetry } from '/@/api/tb/telemetry';
  import { Scope, SCOPE_OPTIONS } from '/@/enums/telemetryEnum';
  import { CodeEditor } from '/@/components/CodeEditor';
  import { EntityId } from '/#/store';
  import { isBoolean, isEmpty, isNumber, isString } from 'lodash-es';
  const LATEST_TELEMETRY = 'LATEST_TELEMETRY';

  const emit = defineEmits(['success', 'register']);

  const { showMessage } = useMessage();

  const getTitle = computed(() => ({
    value:
      (record.value?.key ? '修改' : '添加') + SCOPE_OPTIONS.find((item) => item.value == scope.value)?.label || '属性',
  }));

  const formRef = ref<FormInstance>();

  const record = ref<any>();

  const entityId = ref<EntityId<any>>();
  const scope = ref<Scope>(Scope.SERVER_SCOPE);

  const formState = reactive<any>({
    key: '',
    value: undefined,
    type: '',
  });

  const typeOptions = [
    { value: 'STRING', label: '字符串' },
    { value: 'NUMERIC', label: '整数' },
    { value: 'DOUBLE', label: '小数' },
    { value: 'BOOLEAN', label: '布尔' },
    { value: 'JSON', label: 'JSON' },
  ];

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    clear();
    console.log(data);
    entityId.value = { entityType: data.entityType, id: data.entityId };
    scope.value = data.scope || Scope.SERVER_SCOPE;
    record.value = data.attribute;
    if (!isEmpty(record.value)) {
      formState.key = record.value.key;
      formState.value = record.value.value;
      formState.type = valueType(record.value.value);
    }
    setModalProps({ loading: false });
  });

  function clear() {
    entityId.value = undefined;
    scope.value = Scope.SERVER_SCOPE;
    formState.key = '';
    formState.value = undefined;
    formState.type = 'STRING';
  }

  function valueType(value: any) {
    if (isBoolean(value)) {
      return 'BOOLEAN';
    } else if (isNumber(value)) {
      if (/^-?\d+(\.\d+)?$/.test(value + '')) {
        return 'DOUBLE';
      }
      return 'NUMERIC';
    } else if (isString(value)) {
      return 'STRING';
    } else {
      return 'JSON';
    }
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        let result = {};
        result[data.key] = data.value;
        setModalProps({ confirmLoading: true });
        if (scope.value + '' == LATEST_TELEMETRY) {
          const res = await saveEntityTelemetry(entityId.value, result);
        } else {
          const res = await saveEntityAttributesV1(entityId.value, scope.value, result);
        }
        showMessage(`添加属性成功！`);
        setTimeout(closeModal);
        emit('success', data);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }

  function validatorValue(_rule: any, value: any) {
    if (formState.type == 'JSON') {
      try {
        formState.value = JSON.parse(value);
      } catch (e) {
        return Promise.reject('请输入JSON格式数据');
      }
    }
    return Promise.resolve();
  }
</script>
