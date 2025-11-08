<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="event">
      <Select v-model:value="formState.event" :options="deviceConnectivityOptions" />
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
  import { Form, Select } from 'ant-design-vue';
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

  const deviceConnectivityOptions = [
    { label: 'Connect Event', value: 'CONNECT_EVENT' },
    { label: 'Activity Event', value: 'ACTIVITY_EVENT' },
    { label: 'Disconnect Event', value: 'DISCONNECT_EVENT' },
    { label: 'Inactivity Event', value: 'INACTIVITY_EVENT' },
  ];

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
