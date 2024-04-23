<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="消息类型" name="messageTypes" :rules="[{ required: true, message: '请选择消息类型!' }]">
            <Select v-model:value="formState.messageTypes" :options="messageTypeOptions" mode="multiple">
            </Select>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "message-type-filter",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    messageTypes: Array<string>;
}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const messageTypeOptions = [
    { value: "POST_ATTRIBUTES_REQUEST", label: "Post Attributes" },
    { value: "POST_TELEMETRY_REQUEST", label: "Post Telemetry" },
    { value: "TO_SERVER_RPC_REQUEST", label: "PRC Request to Device" },
    { value: "RPC_CALL_FROM_SERVER_TO_DEVICE", label: "PRC Request from Device" },
    { value: "RPC_QUEUED", label: "RPC Queued" },
    { value: "RPC_SENT", label: "RPC Sent" },
    { value: "RPC_DELIVERED", label: "RPC Delivered" },
    { value: "RPC_SUCCESSFUL", label: "RPC Successful" },
    { value: "RPC_TIMEOUT", label: "RPC Timeout" },
    { value: "RPC_EXPIRED", label: "RPC Expired" },
    { value: "RPC_FAILED", label: "RPC Failed" },
    { value: "RPC_DELETED", label: "RPC Deleted" },
    { value: "ACTIVITY_EVENT", label: "Activity Event" },
    { value: "INACTIVITY_EVENT", label: "InActivity Event" },
    { value: "CONNECT_EVENT", label: "Connect Event" },
    { value: "DISCONNECT_EVENT", label: "Disconnect Event" },
    { value: "ENTITY_CREATED", label: "Entity Created" },
    { value: "ENTITY_UPDATED", label: "Entity Updated" },
    { value: "ENTITY_DELETED", label: "Entity Deleted" },
    { value: "ENTITY_ASSIGNED", label: "Entity Assigned" },
    { value: "ENTITY_UNASSIGNED", label: "Entity UnAssigned" },
    { value: "ATTRIBUTES_UPDATED", label: "Attributes Updated" },
    { value: "ATTRIBUTES_DELETED", label: "Attributes Deleted" },
    { value: "ALARM_ACKNOWLEDGED", label: "Alarm Acknowledged" },
    { value: "ALARM_CLEARED", label: "Alarm Cleared" },
    { value: "ALARM_ASSIGNED", label: "Alarm Assigned" },
    { value: "ALARM_UNASSIGNED", label: "Alarm UnAssigned" },
    { value: "COMMENT_CREATED", label: "Comment Created" },
    { value: "COMMENT_UPDATED", label: "Comment Updated" },
    { value: "ENTITY_ASSIGNED_FROM_TENANT", label: "Entity assigned from Tenant" },
    { value: "ENTITY_ASSIGNED_TO_TENANT", label: "Entity Assigned to Tenant" },
    { value: "TIMESERIES_UPDATED", label: "Timeseries Updated" },
    { value: "TIMESERIES_DELETED", label: "Timeseries Deleted" }
]




const formRef = ref<FormInstance>();

const formState = reactive<any>({
    messageTypes: ['POST_ATTRIBUTES_REQUEST'],
});

watch(
    () => props.configuration,
    () => { formState.messageTypes = props.configuration.messageTypes },
    { immediate: true }
)

async function getConfiguration() {
    try {
        return await formRef.value?.validate();
    } catch (error: any) {
        throw error;
    }
}

defineExpose({ getConfiguration })

</script>
