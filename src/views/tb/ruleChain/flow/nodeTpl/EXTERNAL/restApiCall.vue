<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="Endpoint URL pattern" name="restEndpointUrlPattern"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。"
            :rules="[{ required: true, message: 'Endpoint URL 必填!' }]">
            <Input v-model:value="formState.restEndpointUrlPattern">
            </Input>
        </Form.Item>
        <Form.Item label="Request method" name="requestMethod" :rules="[{ required: true, message: 'Request method 必选!' }]">
            <Select v-model:value="formState.requestMethod">
                <Select.Option value="POST">POST</Select.Option>
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="PUT">PUT</Select.Option>
                <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item name="enableProxy">
            <Checkbox v-model:checked="formState.enableProxy">允许代理</Checkbox>
        </Form.Item>
        <Form.Item name="useSimpleClientHttpFactory" v-if="formState.enableProxy == false">
            <Checkbox v-model:checked="formState.useSimpleClientHttpFactory">使用SimpleClientHttpFactory</Checkbox>
        </Form.Item>
        <Form.Item name="parseToPlainText" help="如果选中，请求正文消息负载将从JSON字符串转换为纯文本，例如msg=“Hello，\t\t”world\“”将解析为Hello，”world“">
            <Checkbox v-model:checked="formState.parseToPlainText">解析为纯文本</Checkbox>
        </Form.Item>
        <Form.Item name="ignoreRequestBody">
            <Checkbox v-model:checked="formState.ignoreRequestBody">忽略 Request Body</Checkbox>
        </Form.Item>

        <Form.Item label="超时时间" name="readTimeoutMs" v-if="formState.useSimpleClientHttpFactory == false">
            <InputNumber v-model:value="formState.readTimeoutMs" :min="0" :step="1" :precision="0"
                :style="{ width: '100%' }" :addonAfter="'毫秒'" />
        </Form.Item>
        <Form.Item label="最大并行请求数量" name="maxParallelRequestsCount">
            <InputNumber v-model:value="formState.maxParallelRequestsCount" :min="0" :step="1" :precision="0"
                :style="{ width: '100%' }" />
        </Form.Item>
        <template v-if="formState.enableProxy == true">
            <Form.Item name="useSystemProxyProperties">
                <Checkbox v-model:checked="formState.useSystemProxyProperties">使用系统代理属性</Checkbox>
            </Form.Item>
            <Row :gutter="20" v-if="formState.useSystemProxyProperties == false">
                <Col :span="6">
                <Form.Item label="代理协议" name="proxyScheme">
                    <Select v-model:value="formState.proxyScheme" :style="{ width: '100%' }">
                        <Select.Option value="http">http</Select.Option>
                        <Select.Option value="https">https</Select.Option>
                    </Select>
                </Form.Item>
                </Col>
                <Col :span="12">
                <Form.Item label="代理地址" name="proxyHost">
                    <Input v-model:value="formState.proxyHost" />
                </Form.Item>
                </Col>
                <Col :span="6">
                <Form.Item label="代理端口" name="proxyPort">
                    <InputNumber v-model:value="formState.proxyPort" :min="1" :step="1" :precision="0"
                        :style="{ width: '100%' }" />
                </Form.Item>
                </Col>
                <Col :span="12">
                <Form.Item label="代理用户" name="proxyUser">
                    <Input v-model:value="formState.proxyUser" />
                </Form.Item>
                </Col>
                <Col :span="12">
                <Form.Item label="代理密码" name="proxyPassword">
                    <Input v-model:value="formState.proxyPassword" />
                </Form.Item>
                </Col>
            </Row>
        </template>
        <Form.Item label="Http请求头" name="headers" :rules="[{ validator: validatorHeader }]">
            <Alert type="success" message="使用${metadataKey}表示元数据中的值，$[messageKey]表示头/值字段中消息正文中的值" />

            <Table class="header-table">
                <tr class="header">
                    <th>Header</th>
                    <th>Value</th>
                </tr>
                <tr class="content" v-for="(header, index) in headerList" :key="index">
                    <td class="py-2 px-4"> <Input v-model:value="header.key" placeholder="输入Header" />
                    </td>
                    <td> <Input v-model:value="header.value" placeholder="输入Value" />
                    </td>
                    <td>
                        <Tooltip title="删除" class="pl-4">
                            <Icon :icon="'ant-design:delete-outlined'" :size="20" color="red" class="cursor-pointer"
                                @click="handleDeleteHeader(index)" />
                        </Tooltip>
                    </td>
                </tr>
            </Table>
            <Button class="my-4" type="primary" @click="handleAddHeader">添加</Button>
        </Form.Item>
        <Form.Item name="useRedisQueueForMsgPersistence">
            <Checkbox v-model:checked="formState.useRedisQueueForMsgPersistence">使用redis队列进行消息持久化</Checkbox>
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
    name: "rest-api-call",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Form, Alert, Tooltip, Button, Input, Select, Checkbox, Collapse, Row, Col, InputNumber, InputPassword } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { isEmpty } from 'lodash-es';

interface Configuration {
    credentials: { type: string },
    enableProxy: boolean,
    headers: Recordable,
    ignoreRequestBody: boolean,
    maxParallelRequestsCount: number,
    parseToPlainText: boolean,
    proxyHost: string,
    proxyPassword: string,
    proxyPort: number,
    proxyScheme: string,
    proxyUser: string,
    readTimeoutMs: number,
    requestMethod: string,
    restEndpointUrlPattern: string,
    useRedisQueueForMsgPersistence: boolean,
    useSimpleClientHttpFactory: boolean,
    useSystemProxyProperties: boolean,
}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const headerList = ref<Array<any>>([]);

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    credentials: { type: 'anonymous' },
    enableProxy: false,
    headers: { 'Content-Type': 'application/json' },
    ignoreRequestBody: false,
    maxParallelRequestsCount: 0,
    parseToPlainText: false,
    proxyHost: null,
    proxyPassword: null,
    proxyPort: 0,
    proxyScheme: null,
    proxyUser: null,
    readTimeoutMs: 0,
    requestMethod: 'POST',
    restEndpointUrlPattern: 'http://localhost/api',
    useRedisQueueForMsgPersistence: false,
    useSimpleClientHttpFactory: false,
    useSystemProxyProperties: false,
});

watch(
    () => props.configuration,
    () => {
        headerList.value = [];
        formState.credentials = props.configuration.credentials;
        formState.enableProxy = props.configuration.enableProxy;
        formState.headers = props.configuration.headers;
        formState.ignoreRequestBody = props.configuration.ignoreRequestBody;
        formState.maxParallelRequestsCount = props.configuration.maxParallelRequestsCount;
        formState.parseToPlainText = props.configuration.parseToPlainText;
        formState.proxyHost = props.configuration.proxyHost;
        formState.proxyPassword = props.configuration.proxyPassword;
        formState.proxyPort = props.configuration.proxyPort;
        formState.proxyScheme = props.configuration.proxyScheme;
        formState.proxyUser = props.configuration.proxyUser;
        formState.readTimeoutMs = props.configuration.readTimeoutMs;
        formState.requestMethod = props.configuration.requestMethod;
        formState.restEndpointUrlPattern = props.configuration.restEndpointUrlPattern;
        formState.useRedisQueueForMsgPersistence = props.configuration.useRedisQueueForMsgPersistence;
        formState.useSimpleClientHttpFactory = props.configuration.useSimpleClientHttpFactory;
        formState.useSystemProxyProperties = props.configuration.useSystemProxyProperties;
        Object.keys(formState.headers).forEach(key => {
            headerList.value.push({ key: key, value: formState.headers[key] })
        })
    },
    { immediate: true }
)

async function getConfiguration() {
    try {
        const data = await formRef.value?.validate();
        if (data) {
            headerList.value.forEach(header => {
                data.headers[header.key] = header.value;
            })
        }
        return data;
    } catch (error: any) {
        throw error;
    }
}

function validatorHeader() {
    if (headerList.value.length < 1) {
        return Promise.reject('Header不能为空！');
    } else {
        let validateTag = true;
        headerList.value.forEach(mapping => {
            if (isEmpty(mapping.key) || isEmpty(mapping.value)) {
                validateTag = false;
            }
        })
        if (!validateTag) {
            return Promise.reject('Header不能存在空值！');
        } else {
            return Promise.resolve();
        }

    }
}

function handleDeleteHeader(index: number) {
    headerList.value.splice(index, 1)
}

function handleAddHeader() {
    headerList.value.push({ key: '', value: '' })
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
<style lang="less">
.ant-form-item-has-error {
    .header-table {
        border: 1px solid #ff4d4f;
    }
}

.header-table {
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
