<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="规则链" name="ruleChainId" :rules="[{ required: true, message: '请选择规则链!' }]">
            <Select v-model:value="formState.ruleChainId" placeholder="请选择规则链">
                <Select.Option v-for="(option, index) in ruleChainOptions" :key="index" :value="option.value">
                    {{ option.label }}
                </Select.Option>
            </Select>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "rule-chain",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive, onMounted } from 'vue';
import { Form, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { ruleChainList } from '/@/api/tb/ruleChain';

interface Configuration {
    ruleChainId: string
}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const ruleChainOptions = ref<any[]>([]);


const formRef = ref<FormInstance>();

const formState = reactive<any>({
    ruleChainId: undefined,
});

watch(
    () => props.configuration,
    () => { formState.ruleChainId = props.configuration.ruleChainId },
    { immediate: true }
)

onMounted(async () => {
    await fetchRuleChainList();
})

async function fetchRuleChainList() {
    const ruleChainListResult = await ruleChainList({ pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' }, 'CORE');
    ruleChainOptions.value = ruleChainListResult.data.filter(item => item.id.id != props.ruleChainId).map(item => {
        return {
            value: item.id.id,
            label: item.name,
        }
    })
    //TODO : 过滤规则本规则链的 id   使用Inject

}

async function getConfiguration() {
    try {
        return await formRef.value?.validate();
    } catch (error: any) {
        throw error;
    }
}

defineExpose({ getConfiguration })

</script>
