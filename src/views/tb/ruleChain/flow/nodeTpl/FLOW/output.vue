<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="version" v-show="false">
      <Input v-model:value="formState.version" />
    </Form.Item>
    <Alert>
      <template #message>
        {{ t('tb.ruleChain.nodeAction.outputNodeHelp') }}
      </template>
    </Alert>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'output',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Alert } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { FormInstance } from 'ant-design-vue/lib/form';

  interface Configuration {
    version: number;
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
    version: 0,
  });

  watch(
    () => props.configuration,
    () => {
      formState.version = props.configuration.version;
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
