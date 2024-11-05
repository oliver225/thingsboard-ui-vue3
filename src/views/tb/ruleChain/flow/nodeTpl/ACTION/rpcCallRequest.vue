<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="超时时间" name="timeoutInSeconds" :rules="[{ required: true, message: '超时时间必填!' }]">
            <InputNumber v-model:value="formState.timeoutInSeconds" :addon-after="'秒'" :style="{ width: '100%' }">
            </InputNumber>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "rpc-call-request",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, InputNumber } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    timeoutInSeconds: number
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
    timeoutInSeconds: 60,
});

watch(
    () => props.configuration,
    () => { formState.timeoutInSeconds = props.configuration.timeoutInSeconds },
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
