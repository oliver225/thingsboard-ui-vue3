<template>
  <div class="border border-solid border-neutral-300 p-2 rounded m">
    <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.rest_call_reply.title') }}</p>

    <div class="mb-4 text-sm text-neutral-600 p-2 border-rounded bg-neutral-100">
      {{ t('tb.ruleChain.nodeAction.rest_call_reply.tip') }}
    </div>
    <Form ref="formRef" :model="formState" layout="vertical">
      <div class="grid grid-cols-2 gap-4">
        <Form.Item :label="t('tb.ruleChain.nodeAction.rest_call_reply.serviceId')" name="serviceIdMetaDataAttribute">
          <Input v-model:value="formState.serviceIdMetaDataAttribute" />
        </Form.Item>
        <Form.Item :label="t('tb.ruleChain.nodeAction.rest_call_reply.requestId')" name="requestIdMetaDataAttribute">
          <Input v-model:value="formState.requestIdMetaDataAttribute" />
        </Form.Item>
      </div>
    </Form>
  </div>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'rest-call-reply',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    requestIdMetaDataAttribute: string;
    serviceIdMetaDataAttribute: string;
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
    requestIdMetaDataAttribute: 'requestUUID',
    serviceIdMetaDataAttribute: 'serviceId',
  });

  watch(
    () => props.configuration,
    () => {
      formState.requestIdMetaDataAttribute = props.configuration.requestIdMetaDataAttribute;
      formState.serviceIdMetaDataAttribute = props.configuration.serviceIdMetaDataAttribute;
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
