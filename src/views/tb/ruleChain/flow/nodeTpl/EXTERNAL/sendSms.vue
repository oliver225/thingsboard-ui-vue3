<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="手机号码模板" name="numbersToTemplate" :rules="[{ required: true, message: '请输入手机号码模板!' }]"
            help="逗号分隔的电话号码，使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值">
            <Input v-model:value="formState.numbersToTemplate" />
        </Form.Item>
        <Form.Item label="短信消息模板" name="smsMessageTemplate" :rules="[{ required: true, message: '请输入短信消息模板!' }]"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
            <Textarea v-model:value="formState.smsMessageTemplate" :rows="5" />
        </Form.Item>
        <Form.Item name="useSystemSmsSettings">
            <Checkbox v-model:checked="formState.useSystemSmsSettings">
                使用系统短信提供商设置
            </Checkbox>
        </Form.Item>
        <!--TODO: 使用其他的供应商配置-->

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "send-sms",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Textarea, Checkbox } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    numbersToTemplate: string,
    smsMessageTemplate: string,
    useSystemSmsSettings: boolean,
    smsProviderConfiguration: Recordable,
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
    numbersToTemplate: "${userPhone}",
    smsMessageTemplate: "Device ${deviceName} has high temperature ${temp}",
    smsProviderConfiguration: null,
    useSystemSmsSettings: true,
});

watch(
    () => props.configuration,
    () => {
        formState.numbersToTemplate = props.configuration.numbersToTemplate;
        formState.smsMessageTemplate = props.configuration.smsMessageTemplate;
        formState.smsProviderConfiguration = props.configuration.smsProviderConfiguration;
        formState.useSystemSmsSettings = props.configuration.useSystemSmsSettings;
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
