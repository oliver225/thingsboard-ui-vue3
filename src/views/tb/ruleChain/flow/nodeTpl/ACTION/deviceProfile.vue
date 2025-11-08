<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-solid border-neutral-300 rounded-md px-4 py-2">
      <Alert :message="t('tb.ruleChain.nodeAction.device_profile.tip')" type="success" :banner="true" />

      <Form.Item name="fetchAlarmRulesStateOnStart">
        <Checkbox
          v-model:checked="formState.fetchAlarmRulesStateOnStart"
          @change="handleFetchAlarmRulesStateOnStartChange"
        >
          {{ t('tb.ruleChain.nodeAction.fetchAlarmRulesStateOnStart') }}
        </Checkbox>
      </Form.Item>
      <Form.Item name="persistAlarmRulesState">
        <Checkbox v-model:checked="formState.persistAlarmRulesState" :disabled="persistAlarmRulesStateDisables">
          {{ t('tb.ruleChain.nodeAction.persistAlarmRulesState') }}
        </Checkbox>
      </Form.Item>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'device-profile',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive, computed } from 'vue';
  import { Form, Checkbox, Alert } from 'ant-design-vue';
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

  const persistAlarmRulesStateDisables = computed(() => !formState.fetchAlarmRulesStateOnStart);

  function handleFetchAlarmRulesStateOnStartChange(event: { target: { checked: boolean } }) {
    const checked = event.target.checked;
    if (!checked) {
      formState.persistAlarmRulesState = false;
    }
  }

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
