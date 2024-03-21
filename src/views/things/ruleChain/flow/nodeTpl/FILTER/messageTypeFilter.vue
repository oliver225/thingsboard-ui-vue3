<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="消息类型" name="messageTypes" :rules="[{ required: true, message: '请选择消息类型!' }]">
            <Select v-model:value="formState.messageTypes" :options="[]" mode="multiple">
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

});




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
