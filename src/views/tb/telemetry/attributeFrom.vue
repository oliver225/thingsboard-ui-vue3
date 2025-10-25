<template>
  <BasicModal v-bind="$attrs" @register="registerModal" @ok="handleSubmit" width="40%">
    <template #title>
      <span>
        {{ getTitle.value }}
      </span>
    </template>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item
        :label="t('tb.telemetry.attrForm.key')"
        name="key"
        :rules="[{ required: true, message: t('tb.telemetry.attrForm.keyRequired') }]"
      >
        <Input v-model:value="formState.key" :placeholder="t('tb.telemetry.attrForm.stringPlaceholder')" />
      </Form.Item>
      <Row :gutter="20">
        <Col :span="12">
          <Form.Item
            :label="t('tb.telemetry.attrForm.type')"
            name="type"
            :rules="[{ required: true, message: t('tb.telemetry.attrForm.typeRequired') }]"
          >
            <Select v-model:value="formState.type" :default-value="'STRING'" :options="typeOptions" />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item
            :label="
              typeOptions.find((type) => type.value == formState.type)?.label +
              t('tb.telemetry.attrForm.valueLabelSuffix')
            "
            name="value"
            :rules="[
              { required: true, message: t('tb.telemetry.attrForm.numberPlaceholder') },
              { validator: validatorValue },
            ]"
          >
            <Input
              v-if="formState.type == 'STRING'"
              v-model:value="formState.value"
              :placeholder="t('tb.telemetry.attrForm.stringPlaceholder')"
            />
            <InputNumber
              v-if="formState.type == 'NUMERIC'"
              :precision="0"
              :step="1"
              v-model:value="formState.value"
              :style="{ width: '100%' }"
              :placeholder="t('tb.telemetry.attrForm.numberPlaceholder')"
            />
            <InputNumber
              v-if="formState.type == 'DOUBLE'"
              :precision="2"
              :step="0.01"
              v-model:value="formState.value"
              :style="{ width: '100%' }"
              :placeholder="t('tb.telemetry.attrForm.doublePlaceholder')"
            />
            <Radio.Group v-if="formState.type == 'BOOLEAN'" v-model:value="formState.value">
              <Radio :value="true">{{ t('tb.telemetry.attrForm.booleanTrue') }}</Radio>
              <Radio :value="false">{{ t('tb.telemetry.attrForm.booleanFalse') }}</Radio>
            </Radio.Group>
            <div class="border border-solid border-neutral-300 h-40" v-if="formState.type == 'JSON'">
              <CodeEditor :mode="MODE.JSON" v-model:value="formState.value" />
            </div>
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
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { isBoolean, isEmpty, isNumber, isString } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';
  const LATEST_TELEMETRY = 'LATEST_TELEMETRY';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const getTitle = computed(() => ({
    value:
      (record.value?.key ? t('tb.telemetry.attrForm.titleEdit') : t('tb.telemetry.attrForm.titleAdd')) +
      (SCOPE_OPTIONS.find((item) => item.value == scope.value)?.label || ''),
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
    { value: 'STRING', label: t('tb.telemetry.attrForm.typeString') },
    { value: 'NUMERIC', label: t('tb.telemetry.attrForm.typeNumber') },
    { value: 'DOUBLE', label: t('tb.telemetry.attrForm.typeDouble') },
    { value: 'BOOLEAN', label: t('tb.telemetry.attrForm.typeBoolean') },
    { value: 'JSON', label: t('tb.telemetry.attrForm.typeJson') },
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
        if (!entityId.value) {
          return;
        }
        if (scope.value + '' == LATEST_TELEMETRY) {
          const res = await saveEntityTelemetry(entityId.value, result);
        } else {
          const res = await saveEntityAttributesV1(entityId.value, scope.value, result);
        }
        showMessage(t('tb.telemetry.attrForm.addSuccess'));
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
        return Promise.reject(t('tb.telemetry.attrForm.jsonInvalid'));
      }
    }
    return Promise.resolve();
  }
</script>
