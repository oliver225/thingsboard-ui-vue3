<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="event">
      <Input v-model:value="formState.event" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'device-state',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';

  interface Configuration {
    event: string;
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
    event: 'ACTIVITY_EVENT',
  });

  watch(
    () => props.configuration,
    () => {
      formState.event = props.configuration.event;
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
