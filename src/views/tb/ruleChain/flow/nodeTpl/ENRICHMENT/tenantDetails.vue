<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="选择详情" name="detailsList" :rules="[{ required: true, message: '请选择设备详情!' }]">
            <Select v-model:value="formState.detailsList" :options="detailsOptions" mode="multiple">
            </Select>
        </Form.Item>

        <Form.Item name="fetchTo">
            <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
                <span>添加选中的详情到</span>
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
    name: "tenant-details",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Radio, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    detailsList: [];
    fetchTo: 'DATA' | 'METADATA'
}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const detailsOptions = [
    { value: 'ID', label: 'Id' },
    { value: 'TITLE', label: 'Title' },
    { value: 'COUNTRY', label: 'Country' },
    { value: 'STATE', label: 'State' },
    { value: 'CITY', label: 'City' },
    { value: 'ZIP', label: 'Zip' },
    { value: 'ADDRESS', label: 'Address' },
    { value: 'ADDRESS2', label: 'Address2' },
    { value: 'PHONE', label: 'Phone' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'ADDITIONAL_INFO', label: 'Additional Info' },

];

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    detailsList: [],
    fetchTo: 'DATA',
});

watch(
    () => props.configuration,
    () => {
        formState.detailsList = props.configuration.detailsList;
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
