<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="间隔" name="interval" :rules="[{ required: true, }]">
            <InputNumber v-model:value="formState.interval" addon-after="秒" :style="{ width: '100%' }">
            </InputNumber>
        </Form.Item>
        <Form.Item label="输出遥测数据Key前缀" name="telemetryPrefix" :rules="[{ required: true, message: '输出遥测数据Key前缀必填' }]">
            <Input v-model:value="formState.telemetryPrefix">
            </Input>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "message-count",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, InputNumber } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    interval: number,
    telemetryPrefix: string,
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
    interval: 1,
    telemetryPrefix: 'messageCount',
});

watch(
    () => props.configuration,
    () => {
        formState.interval = props.configuration.interval;
        formState.telemetryPrefix = props.configuration.telemetryPrefix;
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
