<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <p class="text-base font-bold">Email 发送人</p>
            <div class="p-2">
                <Form.Item label="来自" name="fromTemplate" :rules="[{ required: true, message: '请输入来自那个邮件' }]"
                    help="使用$[messageKey]从消息中提取值，使用${metadataKey}从元数据中提取值。">
                    <Input v-model:value="formState.fromTemplate" />
                </Form.Item>
            </div>

        </div>

        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <p class="text-base font-bold">收件人</p>
            <div class="p-2">
                <Alert message="逗号分隔的地址列表。所有输入字段都支持模板化。使用$[messageKey]从消息中提取值，使用${metadataKey}从元数据中提取值。" />
                <Row :gutter="20">
                    <Col :span="8">
                    <Form.Item label="邮箱" name="toTemplate" :rules="[{ required: true, message: '请输入收件人邮箱' }]">
                        <Input v-model:value="formState.toTemplate" />
                    </Form.Item>
                    </Col>
                    <Col :span="8">
                    <Form.Item label="抄送" name="ccTemplate">
                        <Input v-model:value="formState.ccTemplate" />
                    </Form.Item>
                    </Col>
                    <Col :span="8">
                    <Form.Item label="密件抄送" name="bccTemplate">
                        <Input v-model:value="formState.bccTemplate" />
                    </Form.Item>
                    </Col>
                </Row>
            </div>

        </div>
        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <p class="text-base font-bold">主题/内容</p>
            <div class="p-2">
                <Alert message="所有输入字段都支持模板化。使用$[messageKey]从消息中提取值，使用${metadataKey}从元数据中提取值。" />
                <Form.Item label="主题" name="subjectTemplate" :rules="[{ required: true, message: '请输入主题' }]">
                    <Input v-model:value="formState.subjectTemplate" />
                </Form.Item>
                <Form.Item label="邮件类型" name="mailBodyType">
                    <Select v-model:value="formState.mailBodyType">
                        <Select.Option value="false">
                            <p> Plain Text</p>
                            <p class="text-sm">简单、无格式的文本，没有特殊的样式或格式。</p>
                        </Select.Option>
                        <Select.Option value="true">
                            <p> HTML</p>
                            <p class="text-sm">允许您使用HTML标记在您的mai主体中进行格式化、链接和图像。</p>
                        </Select.Option>
                        <Select.Option value="dynamic">
                            <p> Use body type template</p>
                            <p class="text-sm">允许基于模板化功能动态使用纯文本或HTML正文类型</p>
                        </Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item label="内容模版" name="isHtmlTemplate" v-if="formState.mailBodyType == 'dynamic'">
                    <Input v-model:value="formState.isHtmlTemplate" />
                </Form.Item>
                <Form.Item label="内容" name="bodyTemplate" :rules="[{ required: true, message: '请输入内容' }]">
                    <Input v-model:value="formState.bodyTemplate" />
                </Form.Item>
            </div>
        </div>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "to-email",
    components: { Alert }
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Alert, Form, Input, Select, Row, Col } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    bccTemplate: string,
    bodyTemplate: string,
    ccTemplate: string,
    fromTemplate: string,
    isHtmlTemplate: string,
    mailBodyType: string,
    subjectTemplate: string,
    toTemplate: string,
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
    bccTemplate: undefined,
    bodyTemplate: 'Device ${deviceName} has high temperature $[temperature]',
    ccTemplate: undefined,
    fromTemplate: 'info@testmail.org',
    isHtmlTemplate: undefined,
    mailBodyType: 'false',
    subjectTemplate: 'Device ${deviceType} temperature high',
    toTemplate: '${userEmail}',
});

watch(
    () => props.configuration,
    () => {
        formState.bccTemplate = props.configuration.bccTemplate;
        formState.bodyTemplate = props.configuration.bodyTemplate;
        formState.ccTemplate = props.configuration.ccTemplate;
        formState.fromTemplate = props.configuration.fromTemplate;
        formState.isHtmlTemplate = props.configuration.isHtmlTemplate;
        formState.mailBodyType = props.configuration.mailBodyType;
        formState.subjectTemplate = props.configuration.subjectTemplate;
        formState.toTemplate = props.configuration.toTemplate;
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
