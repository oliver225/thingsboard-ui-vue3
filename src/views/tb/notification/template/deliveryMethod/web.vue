<template>
  <div class="delivery-method-web">
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
        <Input.TextArea v-model:value="formState.body" />
      </Form.Item>
      <CollapseContainer
        class="border border-solid border-neutral-300 mb-4"
        :canExpan="formState.additionalConfig.icon.enabled"
        :expand="formState.additionalConfig.icon.enabled"
      >
        <template #title>
          <Form.Item :name="['additionalConfig', 'icon', 'enabled']">
            <div class="mt-5">
              <Switch v-model:checked="formState.additionalConfig.icon.enabled" @change="handleIconEnableChange" />
              <span class="ml-4">显示图标</span>
            </div>
          </Form.Item>
        </template>
        <Row :gutter="12">
          <Col :span="12">
            <Form.Item label="选择图标" :name="['additionalConfig', 'icon', 'icon']">
              <IconPicker v-model:value="formState.additionalConfig.icon.icon" :copy="true" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="选择颜色" :name="['additionalConfig', 'icon', 'color']">
              <ColorPicker v-model:value="formState.additionalConfig.icon.color" />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
      <CollapseContainer
        class="border border-solid border-neutral-300 mb-4"
        :canExpan="formState.additionalConfig.actionButtonConfig.enabled"
        :expand="formState.additionalConfig.actionButtonConfig.enabled"
      >
        <template #title>
          <Form.Item :name="['additionalConfig', 'actionButtonConfig', 'enabled']">
            <div class="mt-5">
              <Switch
                v-model:checked="formState.additionalConfig.actionButtonConfig.enabled"
                @change="handleActionButtonEnableChange"
              />
              <span class="ml-4">操作按钮</span>
            </div>
          </Form.Item>
        </template>
        <Form.Item
          label="按钮文本"
          :name="['additionalConfig', 'actionButtonConfig', 'text']"
          :rules="[{ required: true }]"
          v-if="formState.additionalConfig.actionButtonConfig.enabled == true"
        >
          <Input v-model:value="formState.additionalConfig.actionButtonConfig.text" />
        </Form.Item>
        <Row :gutter="12">
          <Col :span="8">
            <Form.Item
              label="操作类型"
              :name="['additionalConfig', 'actionButtonConfig', 'linkType']"
              :rules="[{ required: true }]"
              v-if="formState.additionalConfig.actionButtonConfig.enabled == true"
            >
              <Select
                v-model:value="formState.additionalConfig.actionButtonConfig.linkType"
                @change="handleActionButtonLinkTypeChange"
              >
                <Select.Option value="LINK">连接地址</Select.Option>
                <Select.Option value="DASHBOARD">仪表盘</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="16">
            <Form.Item
              label="连接地址"
              :name="['additionalConfig', 'actionButtonConfig', 'link']"
              :rules="[{ required: true }]"
              v-if="formState.additionalConfig.actionButtonConfig.enabled == true"
            >
              <Input v-model:value="formState.additionalConfig.actionButtonConfig.link" />
            </Form.Item>
          </Col>
        </Row>
      </CollapseContainer>
    </Form>
  </div>
</template>
<script lang="ts" setup name="DeliveryMethodWebForm">
  import { ref, reactive } from 'vue';
  // import { currentTenantDashboardList } from '/@/api/tb/dashboard';
  // import { Authority } from '/@/enums/authorityEnum';
  import { CollapseContainer } from '/@/components/Container';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Checkbox, Select, Switch, Form, Input, Col, Row } from 'ant-design-vue';
  import { IconPicker } from '/@/components/Icon';
  import { ColorPicker } from '/@/components/ColorPicker';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    method: 'WEB',
    enabled: true,
    subject: '',
    body: '',
    additionalConfig: {
      icon: {
        enabled: false,
        icon: '',
        color: '',
      },
      actionButtonConfig: {
        enabled: false,
        text: '',
        linkType: 'LINK',
        link: '',
        dashboardId: '',
        dashboardState: '',
        setEntityIdInState: false,
      },
    },
  });

  function handleIconEnableChange(iconEnabled: any) {
    formState.additionalConfig = {
      ...formState.additionalConfig,
      icon: {
        enabled: iconEnabled,
        icon: '',
        color: '',
      },
    };
  }

  function handleActionButtonEnableChange(actionButtonEnabled: any) {
    formState.additionalConfig = {
      ...formState.additionalConfig,
      actionButtonConfig: {
        enabled: actionButtonEnabled,
        text: '',
        linkType: 'LINK',
        link: '',
        dashboardId: '',
        dashboardState: '',
        setEntityIdInState: false,
      },
    };
  }

  function handleActionButtonLinkTypeChange(linkType: any) {
    const linkEnabled = linkType == 'LINK';
  }

  async function setConfigFieldsValue(values: any) {
    clear();
    Object.keys(values).forEach((key) => {
      formState[key] = values[key];
    });
  }

  function clear() {
    formState.method = 'WEB';
    formState.enabled = true;
    formState.subject = '';
    formState.body = '';
    formState.additionalConfig = {
      icon: {
        enabled: false,
        icon: '',
        color: '',
      },
      actionButtonConfig: {
        enabled: false,
        text: '',
        linkType: 'LINK',
        link: '',
        dashboardId: '',
        dashboardState: '',
        setEntityIdInState: false,
      },
    };
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
  .delivery-method-web {
  }
</style>
