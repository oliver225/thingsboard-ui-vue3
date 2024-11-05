<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="匹配客户名称" name="customerNamePattern" :rules="[{ required: true, message: '客户名称必填!' }]"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
            <Input v-model:value="formState.customerNamePattern">
            </Input>
        </Form.Item>
        <Form.Item label="客户缓存过期时间" name="customerCacheExpiration" :rules="[{ required: true, message: '客户缓存过期时间必填!' }]"
            help="指定存储找到的客户记录所允许的最大时间间隔。0值表示记录永远不会过期。">
            <InputNumber v-model:value="formState.customerCacheExpiration" :addon-after="'秒'" :style="{ width: '100%' }">
            </InputNumber>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "unassign-from-customer",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, InputNumber } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    customerCacheExpiration: number,
    customerNamePattern: string,
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
    customerCacheExpiration: 300,
    customerNamePattern: undefined,
});

watch(
    () => props.configuration,
    () => {
        formState.customerCacheExpiration = props.configuration.customerCacheExpiration;
        formState.customerNamePattern = props.configuration.customerNamePattern;
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
