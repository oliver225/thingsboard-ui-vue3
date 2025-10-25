<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item name="fetchAlarmRulesStateOnStart">
      <Checkbox v-model:value="formState.fetchAlarmRulesStateOnStart">
        {{ t('tb.ruleChain.nodeAction.fetchAlarmRulesStateOnStart') }}
      </Checkbox>
    </Form.Item>
    <Form.Item name="persistAlarmRulesState">
      <Checkbox v-model:value="formState.persistAlarmRulesState">
        {{ t('tb.ruleChain.nodeAction.persistAlarmRulesState') }}
      </Checkbox>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'device-profile',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Checkbox } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    fetchAlarmRulesStateOnStart: boolean;
    persistAlarmRulesState: boolean;
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
    fetchAlarmRulesStateOnStart: false,
    persistAlarmRulesState: false,
  });

  watch(
    () => props.configuration,
    () => {
      formState.fetchAlarmRulesStateOnStart = props.configuration.fetchAlarmRulesStateOnStart;
      formState.persistAlarmRulesState = props.configuration.persistAlarmRulesState;
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
