<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="copyFrom">
      <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
        <span>{{ t('tb.ruleChain.nodeAction.copyKeys') }}</span>
        <Radio.Group v-model:value="formState.copyFrom" button-style="solid">
          <Radio.Button value="DATA">{{ t('tb.ruleChain.nodeAction.fromMessageToMetadata') }}</Radio.Button>
          <Radio.Button value="METADATA">{{ t('tb.ruleChain.nodeAction.fromMetadataToMessage') }}</Radio.Button>
        </Radio.Group>
      </div>
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.keys')"
      name="Keys"
      :rules="[
        { required: true, validator: validatorKeys, message: t('tb.ruleChain.nodeAction.keysRequiredValidator') },
      ]"
    >
      <Select v-model:value="formState.keys" mode="tags" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'copy-key-value-pairs',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Radio } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { isEmpty } from 'lodash-es';

  interface Configuration {
    copyFrom: string;
    keys: [];
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
    copyFrom: 'DATA',
    keys: [],
  });

  watch(
    () => props.configuration,
    () => {
      formState.copyFrom = props.configuration.copyFrom;
      formState.keys = props.configuration.keys;
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

  function validatorKeys() {
    if (!isEmpty(formState.keys)) {
      return Promise.resolve();
    } else {
      return Promise.reject(t('tb.ruleChain.nodeAction.keysRequiredOne'));
    }
  }

  defineExpose({ getConfiguration });
</script>
