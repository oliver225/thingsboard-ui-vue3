<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="队列" name="queueName" :rules="[{ required: true, message: '请选择队列!' }]">
            <Select v-model:value="formState.queueName" placeholder="请选择队列">
                <Select.Option v-for="(option, index) in queueOptions" :key="index" :value="option.value">
                    {{ option.label }}
                    <p>
                        <Tag>
                            <small>提交策略:</small>
                            {{ SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === option.submitStrategy)?.label ||
                                option.submitStrategy }}
                        </Tag>
                        <Tag>
                            <small>处理策略:</small>
                            {{ PROCESSING_STRATEGY_OPTIONS.find((item) => item.value === option.processingStrategy)?.label
                                ||
                                option.processingStrategy }}
                        </Tag>
                    </p>
                </Select.Option>
            </Select>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "checkpoint",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive, onMounted } from 'vue';
import { Form, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
import { queueList } from '/@/api/tb/queue';

interface Configuration {
    queueName: string
}

const queueOptions = ref<any[]>([]);


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    queueName: undefined,
});

watch(
    () => props.configuration,
    () => { formState.queueName = props.configuration.queueName },
    { immediate: true }
)

async function getConfiguration() {
    try {
        return await formRef.value?.validate();
    } catch (error: any) {
        throw error;
    }
}

onMounted(async () => {
    await fetchQueueList();
})

async function fetchQueueList() {
    const queueListResult = await queueList({ pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' }, 'TB_RULE_ENGINE');
    queueOptions.value = queueListResult.data.map(item => {
        return {
            value: item.name,
            label: item.name,
            submitStrategy: item.submitStrategy?.type,
            processingStrategy: item.processingStrategy?.type
        }
    })

}

defineExpose({ getConfiguration })

</script>
