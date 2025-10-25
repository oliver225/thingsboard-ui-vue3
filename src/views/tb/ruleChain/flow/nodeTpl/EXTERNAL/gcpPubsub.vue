<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.gcpProjectId')"
      name="projectId"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.gcpProjectIdRequired') }]"
    >
      <Input v-model:value="formState.projectId" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.topicName')"
      name="topicName"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.topicNameRequired') }]"
    >
      <Input v-model:value="formState.topicName" />
    </Form.Item>

    <Form.Item
      :label="t('tb.ruleChain.nodeAction.gcpServiceAccountKeyFile')"
      name="serviceAccountKey"
      :rules="[{ validator: validatorServiceAccountKey }]"
    >
      <Upload.Dragger v-model:fileList="fileList" :before-upload="beforeUpload">
        <p class="ant-upload-drag-icon">
          <Icon :icon="'ant-design:upload-outlined'" />
        </p>
        <p class="ant-upload-text">{{ t('tb.ruleChain.nodeAction.uploadFileHint') }}</p>
      </Upload.Dragger>
    </Form.Item>

    <Form.Item
      :label="t('tb.ruleChain.nodeAction.messageAttribute')"
      name="messageAttributes"
      :rules="[{ validator: validatorMessageAttributes }]"
    >
      <Alert type="success" :message="t('tb.ruleChain.nodeAction.messageAttributeHelp')" />

      <Table class="message-attribute-table">
        <tr class="header">
          <th>{{ t('tb.ruleChain.nodeAction.key') }}</th>
          <th>{{ t('tb.ruleChain.nodeAction.value') }}</th>
        </tr>
        <tr class="content" v-for="(attribute, index) in messageAttributeList" :key="index">
          <td class="py-2 px-4">
            <Input v-model:value="attribute.key" :placeholder="t('tb.ruleChain.nodeAction.keyPlaceholder')" />
          </td>
          <td>
            <Input v-model:value="attribute.value" :placeholder="t('tb.ruleChain.nodeAction.valuePlaceholder')" />
          </td>
          <td>
            <Tooltip :title="t('tb.ruleChain.nodeAction.delete')" class="pl-4">
              <Icon
                :icon="'ant-design:delete-outlined'"
                :size="20"
                color="red"
                class="cursor-pointer"
                @click="handleDeleteAttribute(index)"
              />
            </Tooltip>
          </td>
        </tr>
      </Table>
      <Button class="my-4" type="primary" @click="handleAddAttribute">{{
        t('tb.ruleChain.nodeAction.addAttribute')
      }}</Button>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'gcp-pubsub',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Icon } from '/@/components/Icon';
  import { Form, Input, Button, Tooltip, Alert, Upload } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    messageAttributes: Recordable;
    projectId: string;
    serviceAccountKey: string;
    serviceAccountKeyFileName: string;
    topicName: string;
  }
  const fileList = ref<Array<any>>([]);

  const messageAttributeList = ref<Array<any>>([]);

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    messageAttributes: {},
    projectId: 'my-google-cloud-project-id',
    serviceAccountKey: undefined,
    serviceAccountKeyFileName: undefined,
    topicName: 'my-pubsub-topic-name',
  });

  watch(
    () => props.configuration,
    () => {
      fileList.value = [];
      formState.messageAttributes = props.configuration.messageAttributes;
      formState.projectId = props.configuration.projectId;
      formState.serviceAccountKey = props.configuration.serviceAccountKey;
      formState.serviceAccountKeyFileName = props.configuration.serviceAccountKeyFileName;
      formState.topicName = props.configuration.topicName;
      Object.keys(formState.messageAttributes).forEach((key) => {
        messageAttributeList.value.push({ key: key, value: formState.messageAttributes[key] });
      });
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      const data = await formRef.value?.validate();
      if (data) {
        messageAttributeList.value.forEach((attribute) => {
          data.messageAttributes[attribute.key] = attribute.value;
        });
        data.serviceAccountKeyFileName = fileList.value[0].name;
        //TODO: 文件转化
        data.serviceAccountKey = fileList.value[0].originFileObj;
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  function validatorMessageAttributes() {
    let validateTag = true;
    messageAttributeList.value.forEach((attribute) => {
      if (isEmpty(attribute.key) || isEmpty(attribute.value)) {
        validateTag = false;
      }
    });
    if (!validateTag) {
      return Promise.reject(t('tb.ruleChain.nodeAction.messageAttributeNotEmpty'));
    } else {
      return Promise.resolve();
    }
  }

  function beforeUpload(file: any) {
    fileList.value = [file];

    return false;
  }

  function validatorServiceAccountKey() {
    if (fileList.value.length < 1) {
      return Promise.reject(t('tb.ruleChain.nodeAction.uploadServiceAccountKeyFileRequired'));
    } else {
      return Promise.resolve();
    }
  }

  function handleDeleteAttribute(index: number) {
    messageAttributeList.value.splice(index, 1);
  }

  function handleAddAttribute() {
    messageAttributeList.value.push({ key: '', value: '' });
  }

  defineExpose({ getConfiguration });
</script>
<style lang="less">
  .ant-form-item-has-error {
    .message-attribute-table {
      border: 1px solid #ff4d4f;
    }
  }

  .message-attribute-table {
    width: 100%;
    align: 'center';
    border: 1px solid @border-color-base;
    border-radius: 4px;

    .header {
      border-bottom: 1px solid @border-color-base;
    }

    th {
      padding: 10px 8px;
      text-align: left;
      color: @border-color-base;
    }

    .td {
      padding: 2px 2px;
    }
  }
</style>
