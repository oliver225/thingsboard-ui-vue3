<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="Request Id Metadata attribute name" name="requestIdMetaDataAttribute"
            :rules="[{ required: true, }]">
            <Input v-model:value="formState.requestIdMetaDataAttribute">
            </Input>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "rpc-call-reply",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    requestIdMetaDataAttribute: string,
    serviceIdMetaDataAttribute: string,
    sessionIdMetaDataAttribute: string,

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
    requestIdMetaDataAttribute: 'requestId',
    serviceIdMetaDataAttribute: 'serviceId',
    sessionIdMetaDataAttribute: 'sessionId',
});

watch(
    () => props.configuration,
    () => {
        formState.requestIdMetaDataAttribute = props.configuration.requestIdMetaDataAttribute;
        formState.serviceIdMetaDataAttribute = props.configuration.serviceIdMetaDataAttribute;
        formState.sessionIdMetaDataAttribute = props.configuration.sessionIdMetaDataAttribute;
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
