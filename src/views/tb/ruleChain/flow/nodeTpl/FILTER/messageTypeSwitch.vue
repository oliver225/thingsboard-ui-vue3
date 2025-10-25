<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="version" v-show="false">
      <Input v-model:value="formState.version" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'message-type-switch',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';

  interface Configuration {
    version: number;
  }

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
