<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <Row :gutter="20">
            <Col :span="12">
            <Form.Item label="输入值" name="inputValueKey" :rules="[{ required: true, message: '输入值不能为空!' }]">
                <Input v-model:value="formState.inputValueKey">
                </Input>
            </Form.Item>

            </Col>
            <Col :span="12">
            <Form.Item label="输出值" name="outputValueKey" :rules="[{ required: true, message: '输出值不能为空!' }]">
                <Input v-model:value="formState.outputValueKey">
                </Input>
            </Form.Item>
            </Col>
        </Row>
        <Form.Item label="小数点位数" name="round">
            <InputNumber v-model:value="formState.round" style="width: 100%;">
            </InputNumber>
        </Form.Item>
        <Form.Item name="tellFailureIfDeltaIsNegative" help="若deltavalue为负数，则规则节点强制消息处理失败。">
            <div class="border border-solid border-neutral-300 rounded-md  px-4 py-2">
                <Checkbox v-model:checked="formState.tellFailureIfDeltaIsNegative">
                    如果delta为负数，则Failure
                </Checkbox>
            </div>
        </Form.Item>
        <Form.Item name="useCache">
            <div class="border  border-neutral-300 rounded-md  px-4 py-2"
                help="规则节点将缓存传入消息中的“pulseCounter”值，以提高性能。请注意，如果您在其他地方修改“脉冲计数器值”，则不会更新缓存">
                <Checkbox v-model:checked="formState.useCache">
                    使用缓存
                </Checkbox>
            </div>

        </Form.Item>
        <Form.Item name="addPeriodBetweenMsgs" help="如果启用，则规则节点会将“periodInMs”添加到输出消息中。">
            <div class="border  border-neutral-300 rounded-md  px-4 py-2">
                <Checkbox v-model:checked="formState.addPeriodBetweenMsgs">
                    加上“pulseCounter”读数之间的时间差
                </Checkbox>
            </div>
        </Form.Item>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "calculate-delta",
    components: { Checkbox }
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Row, Col, InputNumber, Checkbox } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    inputValueKey: string,
    outputValueKey: string,
    periodValueKey: string,
    round: number,
    useCache: boolean,
    addPeriodBetweenMsgs: boolean,
    tellFailureIfDeltaIsNegative: boolean,
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
    inputValueKey: 'pulseCounter',
    outputValueKey: 'delta',
    round: undefined,
    tellFailureIfDeltaIsNegative: true,
    useCache: true,
    addPeriodBetweenMsgs: false,
    periodValueKey: 'periodInMs',

});

watch(
    () => props.configuration,
    () => {
        formState.inputValueKey = props.configuration.inputValueKey;
        formState.outputValueKey = props.configuration.outputValueKey;
        formState.periodValueKey = props.configuration.periodValueKey;
        formState.round = props.configuration.round;
        formState.useCache = props.configuration.useCache;
        formState.addPeriodBetweenMsgs = props.configuration.addPeriodBetweenMsgs;
        formState.tellFailureIfDeltaIsNegative = props.configuration.tellFailureIfDeltaIsNegative;
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
