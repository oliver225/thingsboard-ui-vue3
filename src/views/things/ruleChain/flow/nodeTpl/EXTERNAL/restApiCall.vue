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

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "rest-api-call",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, Select } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

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
