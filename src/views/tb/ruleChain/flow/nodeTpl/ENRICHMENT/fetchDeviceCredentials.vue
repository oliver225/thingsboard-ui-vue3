<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item name="fetchTo">
            <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
                <span>将凭据提取到</span>
                <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
                    <Radio.Button value="DATA">Message</Radio.Button>
                    <Radio.Button value="METADATA">Metadata</Radio.Button>
                </Radio.Group>
            </div>

        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "fetch-device-credentials",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Radio } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    fetchTo: 'METADATA' | 'DATA'
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
    fetchTo: 'DATA',
});

watch(
    () => props.configuration,
    () => {
        formState.fetchTo = props.configuration.fetchTo;
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
