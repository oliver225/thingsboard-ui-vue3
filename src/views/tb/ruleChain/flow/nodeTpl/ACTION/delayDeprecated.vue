<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item name="useMetadataPeriodInSecondsPatterns" help="如果选中，则规则节点使用消息元数据或数据中的以秒为单位的时间间隔模式，假设时间间隔为秒。">
            <Checkbox v-model:checked="formState.useMetadataPeriodInSecondsPatterns">使用匹配周期（秒）</Checkbox>
        </Form.Item>
        <Form.Item label="匹配周期(秒)" name="periodInSecondsPattern" v-if="formState.useMetadataPeriodInSecondsPatterns == true"
            :rules="[{ required: true, message: '匹配周期必填!' }]" help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
            <Input v-model:value="formState.periodInSecondsPattern" />
        </Form.Item>
        <Form.Item label="周期" name="periodInSeconds" v-if="formState.useMetadataPeriodInSecondsPatterns == false"
            :rules="[{ required: true, message: '周期必填!' }]">
            <InputNumber v-model:value="formState.periodInSeconds" addon-after="秒" :style="{ width: '100%' }" />
        </Form.Item>
        <Form.Item label="最大等待消息数" name="maxPendingMsgs" :rules="[{ required: true, message: '最大等待消息数必填!' }]">
            <InputNumber v-model:value="formState.maxPendingMsgs" :style="{ width: '100%' }" />
        </Form.Item>
    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "delay-deprecated",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Checkbox, Input, InputNumber } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    maxPendingMsgs: number,
    periodInSeconds: number,
    periodInSecondsPattern: string,
    useMetadataPeriodInSecondsPatterns: boolean,
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
    maxPendingMsgs: 1000,
    periodInSeconds: 60,
    periodInSecondsPattern: undefined,
    useMetadataPeriodInSecondsPatterns: false,
});

watch(
    () => props.configuration,
    () => {
        formState.maxPendingMsgs = props.configuration.maxPendingMsgs;
        formState.periodInSeconds = props.configuration.periodInSeconds;
        formState.periodInSecondsPattern = props.configuration.periodInSecondsPattern;
        formState.useMetadataPeriodInSecondsPatterns = props.configuration.useMetadataPeriodInSecondsPatterns;
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
