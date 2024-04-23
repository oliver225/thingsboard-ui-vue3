<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item name="version" v-show="false">
            <Input v-model:value="formState.version">
            </Input>
        </Form.Item>
        <Alert>
            <template #message>
                规则节点名称对应于输出消息的关系类型，用于转发消息发送到调用方规则链中的其他规则节点。
            </template>
        </Alert>
    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "output",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Alert } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    version: number
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
    version: 0,
});

watch(
    () => props.configuration,
    () => { formState.version = props.configuration.version },
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
