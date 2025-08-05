<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <Row :gutter="20">
            <Col :span="24">
            <Form.Item label="Exchnage name pattern" name="exchangeNamePattern">
                <Input v-model:value="formState.exchangeNamePattern" />
            </Form.Item>
            </Col>
            <Col :span="24">
            <Form.Item label="Routing key pattern" name="routingKeyPattern">
                <Input v-model:value="formState.routingKeyPattern" />
            </Form.Item>
            </Col>
            <Col :span="24">
            <Form.Item label="Message properties" name="messageProperties">
                <Select v-model:value="formState.messageProperties">
                    <Select.Option :value=null> </Select.Option>
                    <Select.Option value='BASIC'>BASIC</Select.Option>
                    <Select.Option value='TEXT_PLAIN'>TEXT_PLAIN</Select.Option>
                    <Select.Option value='MINIMAL_BASIC'>MINIMAL_BASIC</Select.Option>
                    <Select.Option value='MINIMAL_PERSISTENT_BASIC'>MINIMAL_PERSISTENT_BASIC</Select.Option>
                    <Select.Option value='PERSISTENT_BASIC'>PERSISTENT_BASIC</Select.Option>
                    <Select.Option value='PERSISTENT_TEXT_PLAIN'>PERSISTENT_TEXT_PLAIN</Select.Option>
                </Select>
            </Form.Item>
            </Col>
            <Col :span="14">
            <Form.Item label="地址" name="host">
                <Input v-model:value="formState.host" />
            </Form.Item>
            </Col>
            <Col :span="10">
            <Form.Item label="端口" name="port">
                <InputNumber v-model:value="formState.port" :min="1" :step="1" :precision="0" :style="{ width: '100%' }" />
            </Form.Item>
            </Col>
            <Col :span="24">
            <Form.Item label="Virtual host" name="virtualHost">
                <Input v-model:value="formState.virtualHost" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="Username" name="username">
                <Input v-model:value="formState.username" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="Password" name="password">
                <InputPassword v-model:value="formState.password" />
            </Form.Item>
            </Col>
            <Col :span="24">
            <Form.Item name="automaticRecoveryEnabled">
                <Checkbox v-model:checked="formState.automaticRecoveryEnabled">Automatic recovery</Checkbox>
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="连接超时" name="connectionTimeout">
                <InputNumber v-model:value="formState.connectionTimeout" :min="0" :step="1" :precision="0"
                    :style="{ width: '100%' }" :addonAfter="'毫秒'" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="握手超时" name="handshakeTimeout">
                <InputNumber v-model:value="formState.handshakeTimeout" :min="0" :step="1" :precision="0"
                    :style="{ width: '100%' }" :addonAfter="'毫秒'" />
            </Form.Item>
            </Col>
        </Row>
        <Form.Item label="Client Properties" name="clientProperties" :rules="[{ validator: validatorClientProperties }]">

            <Table class="header-table">
                <tr class="header">
                    <th>Key</th>
                    <th>Value</th>
                </tr>
                <tr class="content" v-for="(property, index) in clientPropertyList" :key="index">
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
    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "rabbitmq",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Form, Input, Button, Tooltip, InputNumber, Checkbox, Select, Row, Col, InputPassword } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    automaticRecoveryEnabled: boolean,
    clientProperties: Recordable,
    exchangeNamePattern: string,
    routingKeyPattern: string,
    messageProperties: string,
    connectionTimeout: number,
    handshakeTimeout: number,
    virtualHost: string,
    host: string,
    username: string,
    password: string,
    port: number,
}

const clientPropertyList = ref<Array<any>>([]);

const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    automaticRecoveryEnabled: false,
    clientProperties: {},
    connectionTimeout: 60000,
    exchangeNamePattern: '',
    handshakeTimeout: 10000,
    host: 'localhost',
    messageProperties: null,
    password: 'guest',
    port: 5672,
    routingKeyPattern: '',
    username: 'guest',
    virtualHost: '/',
});

watch(
    () => props.configuration,
    () => {
        clientPropertyList.value = [];
        formState.automaticRecoveryEnabled = props.configuration.automaticRecoveryEnabled;
        formState.clientProperties = props.configuration.clientProperties;
        formState.connectionTimeout = props.configuration.connectionTimeout;
        formState.exchangeNamePattern = props.configuration.exchangeNamePattern;
        formState.handshakeTimeout = props.configuration.handshakeTimeout;
        formState.host = props.configuration.host;
        formState.messageProperties = props.configuration.messageProperties;
        formState.password = props.configuration.password;
        formState.port = props.configuration.port;
        formState.routingKeyPattern = props.configuration.routingKeyPattern;
        formState.username = props.configuration.username;
        formState.virtualHost = props.configuration.virtualHost;
        Object.keys(formState.clientProperties).forEach(key => {
            clientPropertyList.value.push({ key: key, value: formState.clientProperties[key] })
        })
    },
    { immediate: true }
)

async function getConfiguration() {
    try {
        const data = await formRef.value?.validate();
        if (data) {
            clientPropertyList.value.forEach(property => {
                data.clientProperties[property.key] = property.value;
            })
        }
        return data;
    } catch (error: any) {
        throw error;
    }
}

function validatorClientProperties() {
    let validateTag = true;
    clientPropertyList.value.forEach(property => {
        if (isEmpty(property.key) || isEmpty(property.value)) {
            validateTag = false;
        }
    })
    if (!validateTag) {
        return Promise.reject('Client Property不能存在空值！');
    } else {
        return Promise.resolve();
    }



}

function handleDeleteProperty(index: number) {
    clientPropertyList.value.splice(index, 1)

}

function handleAddProperty() {
    clientPropertyList.value.push({ key: '', value: '' })
}

defineExpose({ getConfiguration })

</script>
