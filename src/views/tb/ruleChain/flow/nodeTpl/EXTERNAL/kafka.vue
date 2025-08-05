<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item label="Topic Pattern" name="topicPattern" :rules="[{ required: true, message: '请输入Topic pattern!' }]"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
            <Input v-model:value="formState.topicPattern" />
        </Form.Item>
        <Form.Item label="Key Pattern" name="keyPattern"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。
                                                                    可选择的如果指定了有效的分区号，则在发送记录时将使用该分区号。如果没有指定分区，则将使用密钥。如果两者都未指定，则将以循环方式分配分区。">
            <Input v-model:value="formState.keyPattern" />
        </Form.Item>
        <Form.Item label="Bootstrap servers" name="bootstrapServers"
            :rules="[{ required: true, message: '请输入Bootstrap servers!' }]">
            <Input v-model:value="formState.bootstrapServers" />
        </Form.Item>
        <Form.Item label="Automatically retry times if fails" name="retries">
            <InputNumber v-model:value="formState.retries" :min="0" :style="{ width: '100%' }" />
        </Form.Item>
        <Form.Item label="Produces batch size in bytes" name="batchSize">
            <InputNumber v-model:value="formState.batchSize" :min="0" :style="{ width: '100%' }" />
        </Form.Item>
        <Form.Item label="Time to buffer locally" name="linger">
            <InputNumber v-model:value="formState.linger" :min="0" addon-after="毫秒" :style="{ width: '100%' }" />
        </Form.Item>
        <Form.Item label="Client buffer max size in bytes" name="bufferMemory">
            <InputNumber v-model:value="formState.bufferMemory" :min="0" :style="{ width: '100%' }" />
        </Form.Item>
        <Form.Item label="Number of acknowledgements" name="acks"
            :rules="[{ required: true, message: '请选择acknowledgements 数量' }]">
            <Select v-model:value="formState.acks" :min="0" :style="{ width: '100%' }">
                <Select.Option value="all">all</Select.Option>
                <Select.Option value="-1">-1</Select.Option>
                <Select.Option value="0">0</Select.Option>
                <Select.Option value="1">1</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item label="key serializer" name="keySerializer" :rules="[{ required: true, message: '请输入 key serializer' }]">
            <Input v-model:value="formState.keySerializer" />
        </Form.Item>
        <Form.Item label="value serializer" name="valueSerializer"
            :rules="[{ required: true, message: '请输入 value serializer' }]">
            <Input v-model:value="formState.valueSerializer" />
        </Form.Item>
        <Form.Item label="Other Properties" name="otherProperties" :rules="[{ validator: validatorOtherProperties }]">

            <Table class="properties-table">
                <tr class="header">
                    <th>Key</th>
                    <th>Value</th>
                </tr>
                <tr class="content" v-for="(property, index) in otherPropertyList" :key="index">
                    <td class="py-2 px-4"> <Input v-model:value="property.key" placeholder="输入Key" />
                    </td>
                    <td> <Input v-model:value="property.value" placeholder="输入Value" />
                    </td>
                    <td>
                        <Tooltip title="删除" class="pl-4">
                            <Icon :icon="'ant-design:delete-outlined'" :size="20" color="red" class="cursor-pointer"
                                @click="handleDeleteProperty(index)" />
                        </Tooltip>
                    </td>
                </tr>
            </Table>
            <Button class="my-4" type="primary" @click="handleAddProperty">添加</Button>
        </Form.Item>
        <Form.Item name="addMetadataKeyValuesAsKafkaHeaders" help="如果选中，消息元数据中的键值对将作为具有预定义字符集编码的字节数组添加到传出记录头中。">
            <Checkbox v-model:checked="formState.addMetadataKeyValuesAsKafkaHeaders">
                向Kafka记录头添加消息元数据键值对
            </Checkbox>
        </Form.Item>
        <Form.Item label="charset encoding" name="kafkaHeadersCharset"
            v-if="formState.addMetadataKeyValuesAsKafkaHeaders == true">
            <Select v-model:value="formState.kafkaHeadersCharset">
                <Select.Option value="US-ASCII">US-ASCII</Select.Option>
                <Select.Option value="ISO-8859-1">ISO-8859-1</Select.Option>
                <Select.Option value="UTF-8">UTF-8</Select.Option>
                <Select.Option value="UTF-16BE">UTF-16BE</Select.Option>
                <Select.Option value="UTF-16LE">UTF-16LE</Select.Option>
                <Select.Option value="UTF-16">UTF-16</Select.Option>
            </Select>

        </Form.Item>
    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "kafka",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Form, Input, Button, Tooltip, InputNumber, Checkbox, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    acks: string,
    addMetadataKeyValuesAsKafkaHeaders: boolean,
    batchSize: number,
    bootstrapServers: string,
    bufferMemory: number,
    kafkaHeadersCharset: string,
    keyPattern: string,
    keySerializer: string,
    linger: number,
    otherProperties: Recordable,
    retries: number,
    topicPattern: string,
    valueSerializer: string,
}

const otherPropertyList = ref<Array<any>>([]);

const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    acks: "-1",
    addMetadataKeyValuesAsKafkaHeaders: false,
    batchSize: 16384,
    bootstrapServers: "localhost:9092",
    bufferMemory: 33554432,
    kafkaHeadersCharset: "UTF-8",
    keyPattern: undefined,
    keySerializer: "org.apache.kafka.common.serialization.StringSerializer",
    linger: 0,
    otherProperties: {},
    retries: 0,
    topicPattern: "my-topic",
    valueSerializer: "org.apache.kafka.common.serialization.StringSerializer",
});

watch(
    () => props.configuration,
    () => {
        formState.acks = props.configuration.acks;
        formState.addMetadataKeyValuesAsKafkaHeaders = props.configuration.addMetadataKeyValuesAsKafkaHeaders;
        formState.batchSize = props.configuration.batchSize;
        formState.bootstrapServers = props.configuration.bootstrapServers;
        formState.bufferMemory = props.configuration.bufferMemory;
        formState.kafkaHeadersCharset = props.configuration.kafkaHeadersCharset;
        formState.keyPattern = props.configuration.keyPattern;
        formState.keySerializer = props.configuration.keySerializer;
        formState.linger = props.configuration.linger;
        formState.otherProperties = props.configuration.otherProperties;
        formState.retries = props.configuration.retries;
        formState.topicPattern = props.configuration.topicPattern;
        formState.valueSerializer = props.configuration.valueSerializer;
        Object.keys(formState.otherProperties).forEach(key => {
            otherPropertyList.value.push({ key: key, value: formState.otherProperties[key] })
        })
    },
    { immediate: true }
)

async function getConfiguration() {
    try {
        const data = await formRef.value?.validate();
        if (data) {
            otherPropertyList.value.forEach(property => {
                data.otherProperties[property.key] = property.value;
            })
        }
        return data;
    } catch (error: any) {
        throw error;
    }
}

function validatorOtherProperties() {
    let validateTag = true;
    otherPropertyList.value.forEach(property => {
        if (isEmpty(property.key) || isEmpty(property.value)) {
            validateTag = false;
        }
    })
    if (!validateTag) {
        return Promise.reject('Other Property不能存在空值！');
    } else {
        return Promise.resolve();
    }



}

function handleDeleteProperty(index: number) {
    otherPropertyList.value.splice(index, 1)

}

function handleAddProperty() {
    otherPropertyList.value.push({ key: '', value: '' })
}

defineExpose({ getConfiguration })

</script>
<style lang="less">
.ant-form-item-has-error {
    .properties-table {
        border: 1px solid #ff4d4f;
    }
}

.properties-table {
    width: 100%;
    align: "center";
    border: 1px solid @border-color-base;
    border-radius: 4px;

    .header {
        border-bottom: 1px solid @border-color-base;
    }

    th {
        padding: 10px 8px;
        text-align: left;
        color: @border-color-base;
    }

    .td {
        padding: 2px 2px;
    }
}
</style>
