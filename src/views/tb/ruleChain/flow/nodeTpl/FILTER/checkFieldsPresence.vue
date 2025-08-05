<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <div class="border  border-neutral-400 p-2 rounded">
            <p class="text-base font-bold">检查字段</p>
            <div class="p-2">
                <Form.Item label="消息字段" name="messageNames" :rules="[{ validator: validatorFieldName }]">
                    <Select v-model:value="formState.messageNames" mode="tags">
                    </Select>
                </Form.Item>
                <Form.Item label="元数据字段" name="metadataNames" :rules="[{ validator: validatorFieldName }]">
                    <Select v-model:value="formState.metadataNames" mode="tags">
                    </Select>
                </Form.Item>
            </div>

        </div>

        <Form.Item name="checkAllKeys">
            <Checkbox v-model:checked="formState.checkAllKeys">
                检查是否存在所有指定的字段
            </Checkbox>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "check-fields-presence",
});
</script>
<script lang="ts" setup >
import { Checkbox, Form, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';
import { defineComponent, reactive, ref, watch } from 'vue';


interface Configuration {
    checkAllKeys: boolean,
    messageNames: Array<string>,
    metadataNames: Array<string>,
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
    messageNames: [],
    metadataNames: [],
    checkAllKeys: true,
});

watch(
    () => props.configuration,
    () => {
        formState.checkAllKeys = props.configuration.checkAllKeys;
        formState.messageNames = props.configuration.messageNames;
        formState.metadataNames = props.configuration.metadataNames;
    },
    { immediate: true }
)

function validatorFieldName() {
    if (!isEmpty(formState.messageNames) || !isEmpty(formState.metadataNames)) {
        return Promise.resolve();
    } else {
        return Promise.reject('检查字段必填！');
    }
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
