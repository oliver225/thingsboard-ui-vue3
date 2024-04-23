<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="设备属性范围" name="scope" :rules="[{ required: true, message: '设备属性范围必填!' }]">
            <Select v-model:value="formState.scope" :options="SCOPE_OPTIONS_SIMPLE">
            </Select>
        </Form.Item>
        <Form.Item label="属性值" name="keys" :rules="[{ required: true, message: '属性值必填!' }]">
            <Select v-model:value="formState.keys" mode="tags">
            </Select>
        </Form.Item>
        <Form.Item name="sendAttributesDeletedNotification" help="将有关已删除属性的通知作为单独的消息发送到规则引擎队列。">
            <Checkbox v-model:checked="formState.sendAttributesDeletedNotification">发送属性删除通知</Checkbox>
        </Form.Item>
        <Form.Item name="notifyDevice" v-if="formState.scope == Scope.SHARED_SCOPE"
            help="如果启用，则强制向设备通知有关共享属性删除的信息。如果禁用，则通知行为由传入消息元数据中的“notifyDevice”参数控制。若要打开通知，消息元数据必须包含设置为“true”的“notifyDevice”参数。在任何其他情况下，都不会向设备触发通知。">
            <Checkbox v-model:checked="formState.notifyDevice">强制通知设备</Checkbox>
        </Form.Item>
    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "delete-attribute",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Checkbox, Form, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { SCOPE_OPTIONS_SIMPLE, Scope } from '/@/enums/telemetryEnum';

interface Configuration {
    keys: [],
    notifyDevice: boolean,
    scope: string,
    sendAttributesDeletedNotification: boolean,

}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

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
