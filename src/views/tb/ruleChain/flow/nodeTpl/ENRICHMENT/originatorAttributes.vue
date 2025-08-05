<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <p class="text-base font-bold">原始属性</p>
            <div class="p-2">
                <Form.Item label="客户端属性" name="clientAttributeNames" :rules="[{ validator: validatorAttributeNames }]">
                    <Select v-model:value="formState.clientAttributeNames" mode="tags">
                    </Select>
                </Form.Item>
                <Form.Item label="共享属性" name="sharedAttributeNames" :rules="[{ validator: validatorAttributeNames }]">
                    <Select v-model:value="formState.sharedAttributeNames" mode="tags">
                    </Select>
                </Form.Item>
                <Form.Item label="服务端属性" name="serverAttributeNames" :rules="[{ validator: validatorAttributeNames }]">
                    <Select v-model:value="formState.serverAttributeNames" mode="tags">
                    </Select>
                </Form.Item>
                <Form.Item label="遥测数据" name="latestTsKeyNames" :rules="[{ validator: validatorAttributeNames }]">
                    <Select v-model:value="formState.latestTsKeyNames" mode="tags">
                    </Select>
                </Form.Item>
                <Form.Item name="getLatestValueWithTs" v-show="formState.latestTsKeyNames.length > 0">
                    <Checkbox v-model:checked="formState.getLatestValueWithTs">
                        获取带有时间戳的最后一条数据
                    </Checkbox>
                </Form.Item>
            </div>
        </div>
        <Form.Item name="fetchTo">
            <div class="flex justify-between items-center border border-solid border-neutral-300 rounded-md py-2 px-4">
                <span>将原始属性添加到</span>
                <Radio.Group v-model:value="formState.fetchTo" button-style="solid">
                    <Radio.Button value="DATA">Message</Radio.Button>
                    <Radio.Button value="METADATA">Metadata</Radio.Button>
                </Radio.Group>
            </div>

        </Form.Item>
        <Form.Item name="tellFailureIfAbsent" help="如果至少有一个选定的密钥不存在，则出消息将报告“Failure”">
            <div class="border border-solid border-neutral-300 rounded-md  px-4 py-2">
                <Checkbox v-model:checked="formState.tellFailureIfAbsent">
                    如果缺少任何属性，则告知失败
                </Checkbox>
            </div>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "originator-attributes",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Radio, Select, Checkbox } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    clientAttributeNames: [],
    latestTsKeyNames: [],
    serverAttributeNames: [],
    sharedAttributeNames: [],
    getLatestValueWithTs: boolean,
    tellFailureIfAbsent: boolean,
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
    clientAttributeNames: [],
    latestTsKeyNames: [],
    serverAttributeNames: [],
    sharedAttributeNames: [],
    getLatestValueWithTs: false,
    tellFailureIfAbsent: true,
    fetchTo: 'DATA',
});

watch(
    () => props.configuration,
    () => {
        formState.clientAttributeNames = props.configuration.clientAttributeNames;
        formState.latestTsKeyNames = props.configuration.latestTsKeyNames;
        formState.serverAttributeNames = props.configuration.serverAttributeNames;
        formState.sharedAttributeNames = props.configuration.sharedAttributeNames;
        formState.getLatestValueWithTs = props.configuration.getLatestValueWithTs;
        formState.tellFailureIfAbsent = props.configuration.tellFailureIfAbsent;
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

function validatorAttributeNames() {
    if (!isEmpty(formState.clientAttributeNames) || !isEmpty(formState.serverAttributeNames) || !isEmpty(formState.sharedAttributeNames) || !isEmpty(formState.latestTsKeyNames)) {
        return Promise.resolve();
    } else {
        return Promise.reject('原始属性必须填写一项！');
    }
}



defineExpose({ getConfiguration })

</script>
