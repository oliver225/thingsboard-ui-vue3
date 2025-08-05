<template>
  <div class="delivery-method-sms">
    <Alert type="info" show-icon>
      <template #message>
        <p>输入字段支持模板化。 <a href="https://thingsboard.io/" target="_blank">查看文档</a></p>
      </template>
    </Alert>
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item name="method" :hidden="true">
        <Input v-model:value="formState.method" />
      </Form.Item>
      <Form.Item name="enabled" :hidden="true">
        <Checkbox v-model:checked="formState.enabled" />
      </Form.Item>
      <Form.Item label="主题" name="subject" :rules="[{ required: true }]">
        <Input v-model:value="formState.subject" />
      </Form.Item>
      <Form.Item label="消息" name="body" :rules="[{ required: true }]">
        <WangEditor v-model:value="formState.body" />
      </Form.Item>
    </Form>
  </div>
</template>
<script lang="ts" setup name="DeliveryMethodEmailForm">
  import { ref, reactive } from 'vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { Checkbox, Form, Input } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { WangEditor } from '/@/components/WangEditor';
  import { Alert } from 'ant-design-vue';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    method: 'EMAIL',
    enabled: true,
    subject: '',
    body: '',
  });

  async function setConfigFieldsValue(values: any) {
    clear();
    Object.keys(values).forEach((key) => {
      formState[key] = values[key];
    });
  }

  function clear() {
    formState.method = 'EMAIL';
    formState.enabled = true;
    formState.subject = '';
    formState.body = '';
  }

  async function validate() {
    return await formRef.value?.validate();
  }

  async function resetFields() {
    return formRef.value?.resetFields();
  }

  async function getFieldsValue() {
    const data = await formRef.value?.validate();
    return data;
  }

  defineExpose({ getFieldsValue, validate, resetFields, setFieldsValue: setConfigFieldsValue });
</script>
<style lang="less">
  .delivery-method-sms {
  }
</style>
