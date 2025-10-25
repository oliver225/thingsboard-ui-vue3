<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :label="t('tb.ruleChain.nodeAction.messageType')" name="messageTypes" :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.messageTypeRequired') }]">
      <Select v-model:value="formState.messageTypes" :options="messageTypeOptions" mode="multiple" />
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'message-type-filter',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    messageTypes: Array<string>;
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const messageTypeOptions = [
    { value: 'POST_ATTRIBUTES_REQUEST', label: t('tb.ruleChain.nodeAction.postAttributes') },
    { value: 'POST_TELEMETRY_REQUEST', label: t('tb.ruleChain.nodeAction.postTelemetry') },
    { value: 'TO_SERVER_RPC_REQUEST', label: t('tb.ruleChain.nodeAction.rpcRequestToDevice') },
    { value: 'RPC_CALL_FROM_SERVER_TO_DEVICE', label: t('tb.ruleChain.nodeAction.rpcRequestFromDevice') },
    { value: 'RPC_QUEUED', label: t('tb.ruleChain.nodeAction.rpcQueued') },
    { value: 'RPC_SENT', label: t('tb.ruleChain.nodeAction.rpcSent') },
    { value: 'RPC_DELIVERED', label: t('tb.ruleChain.nodeAction.rpcDelivered') },
    { value: 'RPC_SUCCESSFUL', label: t('tb.ruleChain.nodeAction.rpcSuccessful') },
    { value: 'RPC_TIMEOUT', label: t('tb.ruleChain.nodeAction.rpcTimeout') },
    { value: 'RPC_EXPIRED', label: t('tb.ruleChain.nodeAction.rpcExpired') },
    { value: 'RPC_FAILED', label: t('tb.ruleChain.nodeAction.rpcFailed') },
    { value: 'RPC_DELETED', label: t('tb.ruleChain.nodeAction.rpcDeleted') },
    { value: 'ACTIVITY_EVENT', label: t('tb.ruleChain.nodeAction.activityEvent') },
    { value: 'INACTIVITY_EVENT', label: t('tb.ruleChain.nodeAction.inactivityEvent') },
    { value: 'CONNECT_EVENT', label: t('tb.ruleChain.nodeAction.connectEvent') },
    { value: 'DISCONNECT_EVENT', label: t('tb.ruleChain.nodeAction.disconnectEvent') },
    { value: 'ENTITY_CREATED', label: t('tb.ruleChain.nodeAction.entityCreated') },
    { value: 'ENTITY_UPDATED', label: t('tb.ruleChain.nodeAction.entityUpdated') },
    { value: 'ENTITY_DELETED', label: t('tb.ruleChain.nodeAction.entityDeleted') },
    { value: 'ENTITY_ASSIGNED', label: t('tb.ruleChain.nodeAction.entityAssigned') },
    { value: 'ENTITY_UNASSIGNED', label: t('tb.ruleChain.nodeAction.entityUnassigned') },
    { value: 'ATTRIBUTES_UPDATED', label: t('tb.ruleChain.nodeAction.attributesUpdated') },
    { value: 'ATTRIBUTES_DELETED', label: t('tb.ruleChain.nodeAction.attributesDeleted') },
    { value: 'ALARM_ACKNOWLEDGED', label: t('tb.ruleChain.nodeAction.alarmAcknowledged') },
    { value: 'ALARM_CLEARED', label: t('tb.ruleChain.nodeAction.alarmCleared') },
    { value: 'ALARM_ASSIGNED', label: t('tb.ruleChain.nodeAction.alarmAssigned') },
    { value: 'ALARM_UNASSIGNED', label: t('tb.ruleChain.nodeAction.alarmUnassigned') },
    { value: 'COMMENT_CREATED', label: t('tb.ruleChain.nodeAction.commentCreated') },
    { value: 'COMMENT_UPDATED', label: t('tb.ruleChain.nodeAction.commentUpdated') },
    { value: 'ENTITY_ASSIGNED_FROM_TENANT', label: t('tb.ruleChain.nodeAction.entityAssignedFromTenant') },
    { value: 'ENTITY_ASSIGNED_TO_TENANT', label: t('tb.ruleChain.nodeAction.entityAssignedToTenant') },
    { value: 'TIMESERIES_UPDATED', label: t('tb.ruleChain.nodeAction.timeseriesUpdated') },
    { value: 'TIMESERIES_DELETED', label: t('tb.ruleChain.nodeAction.timeseriesDeleted') },
  ];

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    messageTypes: ['POST_ATTRIBUTES_REQUEST'],
  });

  watch(
    () => props.configuration,
    () => {
      formState.messageTypes = props.configuration.messageTypes;
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
