<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="Topic pattern" name="topicPattern" :rules="[{ required: true, message: '请输入Topic pattern!' }]"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
            <Input v-model:value="formState.topicPattern" />
        </Form.Item>
        <Row :gutter="20">
            <Col :span="8">
            <Form.Item label="地址" name="host" :rules="[{ required: true, message: '请输入地址!' }]">
                <Input v-model:value="formState.host" />
            </Form.Item>
            </Col>
            <Col :span="8">
            <Form.Item label="端口" name="port" :rules="[{ required: true, message: '请输入端口!' }]">
                <InputNumber v-model:value="formState.port" :min="1" :step="65535" :precision="0"
                    :style="{ width: '100%' }" />
            </Form.Item>
            </Col>
            <Col :span="8">
            <Form.Item label="连接超时" name="connectTimeoutSec" :rules="[{ required: true, message: '请输入超时时间!' }]">
                <InputNumber v-model:value="formState.connectTimeoutSec" :min="0" :precision="0" :style="{ width: '100%' }"
                    addonAfter="秒" />
            </Form.Item>
            </Col>
        </Row>
        <Form.Item label="Client ID" name="clientId" :rules="[{ required: true, message: '请输入Client Id!' }]"
            help="可选择的为自动生成的客户端ID保留为空。指定客户端ID时要小心。大多数MQTT代理不允许使用相同客户端ID进行多个连接。要连接到此类代理，您的MQTT客户端ID必须是唯一的。当平台以微服务模式运行时，每个微服务中都会启动规则节点的副本。这将自动导致多个mqtt客户端具有相同的ID，并可能导致规则节点出现故障。为了避免此类故障，请启用下面的“将服务ID作为后缀添加到客户端ID”选项。">
            <Input v-model:value="formState.clientId" />
        </Form.Item>
        <Form.Item name="appendClientIdSuffix" help="可选择的当明确指定“Client ID”时应用。如果选中，则Server ID将作为后缀添加到Client ID中。有助于避免平台在微服务模式下运行时出现故障。">
            <Checkbox v-model:checked="formState.appendClientIdSuffix">
                将Server ID 作为后缀添加到Client ID
            </Checkbox>
        </Form.Item>
        <Form.Item name="cleanSession">
            <Checkbox v-model:checked="formState.cleanSession">
                Clean Session
            </Checkbox>
        </Form.Item>
        <Form.Item name="retainedMessage">
            <Checkbox v-model:checked="formState.retainedMessage">
                Retained
            </Checkbox>
        </Form.Item>
        <Form.Item name="ssl">
            <Checkbox v-model:checked="formState.ssl">
                Enable SSL
            </Checkbox>
        </Form.Item>
        <Collapse expand-icon-position="end">
            <Collapse.Panel :header="'Credentials：' + '              ' + formState.credentials.type">
                <Form.Item label="Credentials类型" :name="['credentials', 'type']"
                    :rules="[{ required: true, message: 'Credentials类型不能为空!' }]">
                    <Select v-model:value="formState.credentials.type" :style="{ width: '100%' }"
                        @change="handleCredentialsTypeChange">
                        <Select.Option value="anonymous">Anonymous</Select.Option>
                        <Select.Option value="basic">BASIC</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item label="用户" :name="['credentials', 'username']" v-if="formState.credentials.type == 'basic'">
                    <Input v-model:value="formState.credentials.username" />
                </Form.Item>
                <Form.Item label="密码" :name="['credentials', 'password']" v-if="formState.credentials.type == 'basic'">
                    <InputPassword v-model:value="formState.credentials.password" />
                </Form.Item>
            </Collapse.Panel>
        </Collapse>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "mqtt",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Row, Col, InputNumber, InputPassword, Collapse, Checkbox, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    appendClientIdSuffix: boolean,
    cleanSession: boolean,
    clientId: string,
    connectTimeoutSec: number,
    credentials: {
        type: 'anonymous' | 'basic',
    },
    host: string,
    port: number,
    retainedMessage: boolean,
    ssl: boolean,
    topicPattern: string,
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
    appendClientIdSuffix: false,
    cleanSession: true,
    clientId: undefined,
    connectTimeoutSec: 10,
    credentials: { type: 'anonymous' },
    host: undefined,
    port: 1883,
    retainedMessage: false,
    ssl: false,
    topicPattern: 'my-topic',
});

watch(
    () => props.configuration,
    () => {
        formState.appendClientIdSuffix = props.configuration.appendClientIdSuffix;
        formState.cleanSession = props.configuration.cleanSession;
        formState.clientId = props.configuration.clientId;
        formState.connectTimeoutSec = props.configuration.connectTimeoutSec;
        formState.credentials = props.configuration.credentials;
        formState.host = props.configuration.host;
        formState.port = props.configuration.port;
        formState.retainedMessage = props.configuration.retainedMessage;
        formState.ssl = props.configuration.ssl;
        formState.topicPattern = props.configuration.topicPattern;
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

function handleCredentialsTypeChange(value) {
    if (value == 'basic') {
        formState.credentials = {
            type: 'basic',
            username: 'sysadmin@thingsboard.org',
            password: 'sysadmin',
        }
    } else if (value == 'anonymous') {
        formState.credentials = {
            type: 'anonymous'
        }
    }
}

defineExpose({ getConfiguration })

</script>
