<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.scope')"
      name="scope"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.scopeRequired') }]"
    >
      <Select v-model:value="formState.scope" :options="SCOPE_OPTIONS_SIMPLE" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.keys')"
      name="keys"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.keysRequired') }]"
    >
      <Select v-model:value="formState.keys" mode="tags" />
    </Form.Item>
    <Form.Item
      name="sendAttributesDeletedNotification"
      :help="t('tb.ruleChain.nodeAction.sendAttributesDeletedNotificationHelp')"
    >
      <Checkbox v-model:checked="formState.sendAttributesDeletedNotification">{{
        t('tb.ruleChain.nodeAction.sendAttributesDeletedNotification')
      }}</Checkbox>
    </Form.Item>
    <Form.Item
      name="notifyDevice"
      v-if="formState.scope == Scope.SHARED_SCOPE"
      :help="t('tb.ruleChain.nodeAction.notifyDeviceHelp')"
    >
      <Checkbox v-model:checked="formState.notifyDevice">{{ t('tb.ruleChain.nodeAction.notifyDevice') }}</Checkbox>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'delete-attribute',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Checkbox, Form, Select } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { SCOPE_OPTIONS_SIMPLE, Scope } from '/@/enums/telemetryEnum';

  interface Configuration {
    keys: [];
    notifyDevice: boolean;
    scope: string;
    sendAttributesDeletedNotification: boolean;
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
    keys: [],
    notifyDevice: false,
    scope: Scope.SERVER_SCOPE,
    sendAttributesDeletedNotification: false,
  });

  watch(
    () => props.configuration,
    () => {
      formState.keys = props.configuration.keys;
      formState.notifyDevice = props.configuration.notifyDevice;
      formState.scope = props.configuration.scope;
      formState.sendAttributesDeletedNotification = props.configuration.sendAttributesDeletedNotification;
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
