<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.emailSender') }}</p>
      <div class="p-2">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.from')"
          name="fromTemplate"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.fromRequired') }]"
          :help="t('tb.ruleChain.nodeAction.customerNamePatternHelp')"
        >
          <Input v-model:value="formState.fromTemplate" />
        </Form.Item>
      </div>
    </div>

    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.recipients') }}</p>
      <div class="p-2">
        <Alert :message="t('tb.ruleChain.nodeAction.recipientsHelp')" />
        <Row :gutter="20">
          <Col :span="8">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.to')"
              name="toTemplate"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.toRequired') }]"
            >
              <Input v-model:value="formState.toTemplate" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item :label="t('tb.ruleChain.nodeAction.cc')" name="ccTemplate">
              <Input v-model:value="formState.ccTemplate" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item :label="t('tb.ruleChain.nodeAction.bcc')" name="bccTemplate">
              <Input v-model:value="formState.bccTemplate" />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
    <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.subjectBody') }}</p>
      <div class="p-2">
        <Alert :message="t('tb.ruleChain.nodeAction.customerNamePatternHelp')" />
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.subject')"
          name="subjectTemplate"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.subjectRequired') }]"
        >
          <Input v-model:value="formState.subjectTemplate" />
        </Form.Item>
        <Form.Item :label="t('tb.ruleChain.nodeAction.mailBodyType')" name="mailBodyType">
          <Select v-model:value="formState.mailBodyType">
            <Select.Option value="false">
              <p>{{ t('tb.ruleChain.nodeAction.plainText') }}</p>
              <p class="text-sm">{{ t('tb.ruleChain.nodeAction.plainTextHelp') }}</p>
            </Select.Option>
            <Select.Option value="true">
              <p>{{ t('tb.ruleChain.nodeAction.html') }}</p>
              <p class="text-sm">{{ t('tb.ruleChain.nodeAction.htmlHelp') }}</p>
            </Select.Option>
            <Select.Option value="dynamic">
              <p>{{ t('tb.ruleChain.nodeAction.useBodyTypeTemplate') }}</p>
              <p class="text-sm">{{ t('tb.ruleChain.nodeAction.useBodyTypeTemplateHelp') }}</p>
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.bodyTemplate')"
          name="isHtmlTemplate"
          v-if="formState.mailBodyType == 'dynamic'"
        >
          <Input v-model:value="formState.isHtmlTemplate" />
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.body')"
          name="bodyTemplate"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.bodyRequired') }]"
        >
          <Input v-model:value="formState.bodyTemplate" />
        </Form.Item>
      </div>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'to-email',
    components: { Alert },
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Alert, Form, Input, Select, Row, Col } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    bccTemplate: string;
    bodyTemplate: string;
    ccTemplate: string;
    fromTemplate: string;
    isHtmlTemplate: string;
    mailBodyType: string;
    subjectTemplate: string;
    toTemplate: string;
  }

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
    bccTemplate: undefined,
    bodyTemplate: 'Device ${deviceName} has high temperature $[temperature]',
    ccTemplate: undefined,
    fromTemplate: 'info@testmail.org',
    isHtmlTemplate: undefined,
    mailBodyType: 'false',
    subjectTemplate: 'Device ${deviceType} temperature high',
    toTemplate: '${userEmail}',
  });

  watch(
    () => props.configuration,
    () => {
      formState.bccTemplate = props.configuration.bccTemplate;
      formState.bodyTemplate = props.configuration.bodyTemplate;
      formState.ccTemplate = props.configuration.ccTemplate;
      formState.fromTemplate = props.configuration.fromTemplate;
      formState.isHtmlTemplate = props.configuration.isHtmlTemplate;
      formState.mailBodyType = props.configuration.mailBodyType;
      formState.subjectTemplate = props.configuration.subjectTemplate;
      formState.toTemplate = props.configuration.toTemplate;
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

  defineExpose({ getConfiguration });
</script>
