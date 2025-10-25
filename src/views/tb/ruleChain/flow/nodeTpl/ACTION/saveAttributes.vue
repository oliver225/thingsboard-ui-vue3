<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.scope')"
      name="scope"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.scopeRequired') }]"
    >
      <Select v-model:value="formState.scope" :options="SCOPE_OPTIONS_SIMPLE" />
    </Form.Item>
    <Form.Item name="updateAttributesOnlyOnValueChange">
      <div class="border border-neutral-300 rounded-md px-4 py-3">
        <Switch size="small" v-model:checked="formState.updateAttributesOnlyOnValueChange" />
        <span class="ml-2">{{ t('tb.ruleChain.nodeAction.saveAttributesOnlyOnValueChange') }}</span>
      </div>
    </Form.Item>
    <Form.Item name="sendAttributesUpdatedNotification" v-if="formState.scope != Scope.CLIENT_SCOPE">
      <div class="border border-neutral-300 rounded-md px-4 py-3">
        <Switch size="small" v-model:checked="formState.sendAttributesUpdatedNotification" />
        <span class="ml-2">{{ t('tb.ruleChain.nodeAction.sendAttributesUpdatedNotification') }}</span>
      </div>
    </Form.Item>

    <Form.Item name="notifyDevice" v-if="formState.scope == Scope.SHARED_SCOPE">
      <div class="border border-neutral-300 rounded-md px-4 py-3">
        <Switch size="small" v-model:checked="formState.notifyDevice" />
        <span class="ml-2">{{ t('tb.ruleChain.nodeAction.notifyDevice') }}</span>
      </div>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'save-attributes',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Switch } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { SCOPE_OPTIONS_SIMPLE, Scope } from '/@/enums/telemetryEnum';

  interface Configuration {
    scope: string;
    notifyDevice: boolean;
    sendAttributesUpdatedNotification: boolean;
    updateAttributesOnlyOnValueChange: boolean;
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
    notifyDevice: false,
    sendAttributesUpdatedNotification: false,
    updateAttributesOnlyOnValueChange: false,
  });

  watch(
    () => props.configuration,
    () => {
      formState.scope = props.configuration.scope;
      formState.notifyDevice = props.configuration.notifyDevice;
      formState.sendAttributesUpdatedNotification = props.configuration.sendAttributesUpdatedNotification;
      formState.updateAttributesOnlyOnValueChange = props.configuration.updateAttributesOnlyOnValueChange;
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
