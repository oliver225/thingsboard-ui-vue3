<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.alarmStatus')"
      name="alarmStatusList"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.alarmStatusRequired') }]"
    >
      <Checkbox.Group v-model:value="formState.alarmStatusList" :options="ALARM_SHOW_STATUS_OPTIONS" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'check-alarm-status',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Checkbox } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ALARM_SHOW_STATUS_OPTIONS } from '/@/enums/alarmEnum';

  interface Configuration {
    alarmStatusList: Array<string>;
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
    alarmStatusList: ['ACTIVE_ACK', 'ACTIVE_UNACK'],
  });

  watch(
    () => props.configuration,
    () => {
      formState.alarmStatusList = props.configuration.alarmStatusList;
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
