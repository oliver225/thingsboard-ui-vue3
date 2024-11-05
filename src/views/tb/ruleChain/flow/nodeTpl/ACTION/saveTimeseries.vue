<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="默认TTL(秒)" name="defaultTTL" :rules="[{ required: true, message: '默认TTL(秒)必填!' }]">
            <InputNumber v-model:value="formState.defaultTTL" :style="{ width: '100%' }">
            </InputNumber>
        </Form.Item>
        <Form.Item name="skipLatestPersistence">
            <Checkbox v-model:checked="formState.skipLatestPersistence">Skip latest persistence</Checkbox>
        </Form.Item>
        <Form.Item name="useServerTs" help="启用此设置可使用消息处理的时间戳，而不是消息的时间戳。如果合并来自多个来源（设备、资产等）的消息，则可用于各种顺序处理。">
            <Checkbox v-model:checked="formState.useServerTs">使用服务端时间戳</Checkbox>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "save-timeseries",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, InputNumber, Checkbox } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    defaultTTL: number,
    skipLatestPersistence: boolean,
    useServerTs: boolean,
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
    defaultTTL: 0,
    skipLatestPersistence: false,
    useServerTs: false,

});

watch(
    () => props.configuration,
    () => {
        formState.defaultTTL = props.configuration.defaultTTL;
        formState.skipLatestPersistence = props.configuration.skipLatestPersistence;
        formState.useServerTs = props.configuration.useServerTs;
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
