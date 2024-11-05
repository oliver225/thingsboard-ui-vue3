<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item label="函数" name="operation" :rules="[{ required: true, message: '函数类型必选!' }]">
            <Select v-model:value="formState.operation" @change="onOperationChange">
                <Select.Option value="CUSTOM">
                    <p> CUSTOM | 自定义函数</p>
                    <p class="text-sm">使用此函数可以指定复杂的数学表达式</p>
                </Select.Option>
                <Select.Option value="ADD">
                    <p> ADD | 相加</p>
                    <p class="text-sm">x + y</p>
                </Select.Option>
                <Select.Option value="SUB">
                    <p> SUB | 相减</p>
                    <p class="text-sm">x - y</p>
                </Select.Option>
                <Select.Option value="MULT">
                    <p> MULT | 相乘</p>
                    <p class="text-sm">x * y</p>
                </Select.Option>
                <Select.Option value="DIV">
                    <p> DIV | 相除</p>
                    <p class="text-sm">x / y</p>
                </Select.Option>
            </Select>
        </Form.Item>
        <div class="border  border-neutral-400 p-2 rounded mt-3">
            <p class="text-base font-bold">参数</p>
            <div class="p-4">
                <Row :gutter="20" v-for="(argument, index) in formState.arguments" :key="index"
                    class="border  border-neutral-400 p-2 mb-3 rounded">
                    <Col :span="2">
                    <div class="h-full place-content-center">
                        <span class="text-base font-bold">= {{ argument.name }}</span>
                    </div>
                    </Col>
                    <Col :span="20">
                    <Row :gutter="20">
                        <Col :span="24">
                        <Form.Item :name="['arguments', index, 'type']" :rules="[{ required: true }]">
                            <Select v-model:value="formState.arguments[index].type">
                                <Select.Option value="MESSAGE_BODY"> 从 Message 获取参数</Select.Option>
                                <Select.Option value="MESSAGE_METADATA"> 从 Message Metadata 获取参数 </Select.Option>
                                <Select.Option value="ATTRIBUTE">从 实体的属性 获取参数</Select.Option>
                                <Select.Option value="TIME_SERIES">从 实体的遥测数据 获取参数</Select.Option>
                                <Select.Option value="CONSTANT">定义常量值</Select.Option>
                            </Select>
                        </Form.Item>
                        </Col>
                        <Col :span="12">
                        <Form.Item label="值" :name="['arguments', index, 'key']" :rules="[{ required: true }]">
                            <Input v-model:value="formState.arguments[index].key" />
                        </Form.Item>
                        </Col>
                        <Col :span="12">
                        <Form.Item label="默认值" :name="['arguments', index, 'defaultValue']">
                            <InputNumber v-model:value="formState.arguments[index].defaultValue"
                                :style="{ width: '100%' }" />
                        </Form.Item>
                        </Col>
                    </Row>
                    </Col>
                    <Col :span="2">
                    <div class="h-full place-content-center" v-show="formState.operation == 'CUSTOM'">
                        <Tooltip title="删除" class="pl-4">
                            <Icon :icon="'ant-design:delete-outlined'" :size="20" color="red" class="cursor-pointer"
                                @click="handleDeleteArgument(index)" />
                        </Tooltip>
                    </div>

                    </Col>
                </Row>
                <Button block type="primary" :disabled="formState.operation != 'CUSTOM'"
                    @click="handleAddArguments">添加</Button>
            </div>
        </div>
        <div class="border  border-neutral-400 p-2 rounded mt-3" v-if="formState.operation == 'CUSTOM'">
            <p class="text-base font-bold">数学表达式</p>
            <div class="p-2">
                <Form.Item name="customFunction" help="指定要计算的数学表达式。默认表达式演示如何将华氏温度转换为摄氏温度" :rules="[{ required: true }]">
                    <Input v-model:value="formState.customFunction" default-value="(x - 32) / 1.8" />
                </Form.Item>
            </div>
        </div>
        <div class="border  border-neutral-400 p-2 rounded mt-3">
            <p class="text-base font-bold">结果</p>
            <div class="p-2">
                <Form.Item label="类型" :name="['result', 'type']" :rules="[{ required: true, }]">
                    <Select v-model:value="formState.result.type">
                        <Select.Option value="MESSAGE_BODY"> 结果输出到 Message </Select.Option>
                        <Select.Option value="MESSAGE_METADATA"> 结果输出到 Message Metadata </Select.Option>
                        <Select.Option value="ATTRIBUTE">结果存储到实体的 属性</Select.Option>
                        <Select.Option value="TIME_SERIES">结果存储到实体的 遥测数据</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item label="key" :name="['result', 'key']" :rules="[{ required: true, }]">
                    <Input v-model:value="formState.result.key">
                    </Input>
                </Form.Item>
                <Form.Item label="浮点后的位数" :name="['result', 'resultValuePrecision']" :rules="[{ required: true, }]"
                    help="使用0将结果转换为整数">
                    <InputNumber v-model:value="formState.result.resultValuePrecision" :min="0"
                        :style="{ width: '100%' }" />
                </Form.Item>
            </div>
        </div>



    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "math-function",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Form, Select, Input, InputNumber, Row, Col, Button, Tooltip } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Arguments {
    name: string,
    type: 'MESSAGE_BODY' | 'MESSAGE_METADATA' | 'ATTRIBUTE' | 'TIME_SERIES' | 'CONSTANT',
    key: string,
    defaultValue: number,
    attributeScope: 'SHARED_SCOPE' | 'SERVER_SCOPE',
    resultValuePrecision: number,

}

interface Configuration {
    arguments: Array<Arguments>,
    customFunction: string,
    operation: string,
    result: Arguments,
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
    arguments: [],
    customFunction: '(x - 32) / 1.8',
    operation: 'CUSTOM',
});

watch(
    () => props.configuration,
    () => {
        formState.arguments = props.configuration.arguments;
        formState.customFunction = props.configuration.customFunction;
        formState.operation = props.configuration.operation;
        formState.result = props.configuration.result;
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

function onOperationChange(operate) {
    if (operate == 'CUSTOM') {
        formState.customFunction = '(x - 32) / 1.8';
        formState.arguments = [{ name: 'x', type: 'MESSAGE_BODY', key: '', defaultValue: undefined }];
    } else {
        formState.customFunction = undefined;
        formState.arguments = [
            { name: 'x', type: 'MESSAGE_BODY', key: '', defaultValue: undefined },
            { name: 'y', type: 'MESSAGE_BODY', key: '', defaultValue: undefined }
        ];
    }
}

function handleAddArguments() {
    if (formState.arguments.length) {
        formState.arguments.push({ name: generateName(), type: 'MESSAGE_BODY', key: '', defaultValue: undefined, });
    } else {
        formState.arguments = [{ name: 'x', type: 'MESSAGE_BODY', key: '', defaultValue: undefined, }]
    }

}
function handleDeleteArgument(index: number) {
    formState.arguments.splice(index, 1)
}

function generateName() {
    if (!formState.arguments.length) {
        return 'x';
    }
    const last = formState.arguments.length - 1;
    const lastName = formState.arguments[last].name;
    if (lastName == 'x') {
        return 'y';
    } else if (lastName == 'y') {
        return 'z';
    } else if (lastName == 'z') {
        return 'a'
    } else {
        const asciiCode = lastName.charCodeAt(0);
        return String.fromCharCode(asciiCode + 1);
    }
}

defineExpose({ getConfiguration })

</script>
