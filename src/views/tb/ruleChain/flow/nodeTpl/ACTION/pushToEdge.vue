<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.scope')"
      name="scope"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.scopeRequired') }]"
    >
      <Select v-model:value="formState.scope" :options="SCOPE_OPTIONS_SIMPLE" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'push-to-edge',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { SCOPE_OPTIONS_SIMPLE, Scope } from '/@/enums/telemetryEnum';

  interface Configuration {
    scope: string;
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
    scope: Scope.SERVER_SCOPE,
  });

  watch(
    () => props.configuration,
    () => {
      formState.scope = props.configuration.scope;
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
