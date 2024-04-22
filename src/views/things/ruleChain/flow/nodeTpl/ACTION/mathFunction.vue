<template>
    <Form ref="formRef" :model="formState" layout="vertical">



    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "math-function",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    arguments: Array<any>,
    customFunction: string,
    operation: string,
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
    arguments: [],
    customFunction: '(x - 32) / 1.8',
    operation: 'CUSTOM',
});

watch(
    () => props.configuration,
    () => {
        formState.arguments = props.configuration.arguments;
        formState.customFunction = props.configuration.customFunction;
        formState.operation = props.configuration.operation;
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
