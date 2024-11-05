<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <Form.Item name="useMessageAlarmData">
            <Checkbox v-model:checked="formState.useMessageAlarmData">使用消息报警数据</Checkbox>
        </Form.Item>
        <Form.Item name="overwriteAlarmDetails" v-if="formState.useMessageAlarmData == true">
            <Checkbox v-model:checked="formState.overwriteAlarmDetails">覆盖报警详细信息</Checkbox>
        </Form.Item>
        <template v-if="formState.useMessageAlarmData == false">
            <Form.Item name="scriptLang">
                <div class="flex justify-center mb-2">
                    <Radio.Group v-model:value="formState.scriptLang" button-style="solid">
                        <Radio.Button value="JS">JavaScript</Radio.Button>
                        <Radio.Button value="TBEL">&nbsp;&nbsp;&nbsp;TBEL&nbsp;&nbsp;&nbsp;</Radio.Button>
                    </Radio.Group>
                </div>
            </Form.Item>
            <Form.Item :name="formState.scriptLang == 'JS' ? 'jsScript' : 'tbelScript'">
                <div>
                    <div class="flex justify-between">
                        <p class="text-gray-500">function Details(msg, metadata, msgType) {</p>
                        <Space>
                            <Tooltip title="格式化">
                                <Icon class="cursor-pointer" @click="handleFormatScript"
                                    :icon="'ant-design:format-painter-filled'" />
                            </Tooltip>
                            <Tooltip title="测试脚本功能">
                                <Icon class="cursor-pointer" @click="handleTestScript" :icon="'ant-design:bug-outlined'" />
                            </Tooltip>
                            <Tooltip title="全屏">
                                <Icon class="cursor-pointer" @click="handleFullScreen"
                                    :icon="'ant-design:fullscreen-outlined'" />
                            </Tooltip>
                        </Space>
                    </div>
                    <div class="py-2">
                        <CodeEditor v-if="formState.scriptLang == 'JS'" v-model:value="formState.alarmDetailsBuildJs"
                            :mode="'javascript'" class="border border-solid border-gray-400" />
                        <CodeEditor v-if="formState.scriptLang == 'TBEL'" v-model:value="formState.alarmDetailsBuildTbel"
                            :mode="'javascript'" class="border border-solid border-gray-400" />
                    </div>
                    <div class="text-gray-500">}</div>
                </div>

                <Button class="mt-2" type="primary" @click="handleTestScript">测试详情函数</Button>

            </Form.Item>
            <Form.Item label="报警类型" name="alarmType" :rules="[{ required: true, message: '报警类型必填!' }]"
                help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
                <Input v-model:value="formState.alarmType" />
            </Form.Item>
            <Form.Item name="dynamicSeverity">
                <Checkbox v-model:checked="formState.dynamicSeverity">使用警报等级配置</Checkbox>
            </Form.Item>
            <Form.Item label="报警等级" name="severity" v-if="formState.dynamicSeverity == false">
                <Select v-model:value="formState.severity" :options="ALARM_SEVERITY_OPTIONS" />
            </Form.Item>
            <Form.Item label="报警等级配置" name="severity" v-if="formState.dynamicSeverity == true"
                :rules="[{ required: true, message: '报警等级配置必填!' }]"
                help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。警报严重程度应为系统（关键、主要等）">
                <Input v-model:value="formState.severity" />
            </Form.Item>

            <Form.Item name="propagate">
                <Checkbox v-model:checked="formState.propagate">向相关实体传播警报</Checkbox>
            </Form.Item>
            <Form.Item label="要传播的关系类型" name="relationTypes" v-if="formState.propagate == true">
                <Select v-model:value="formState.relationTypes" mode="tags" />
            </Form.Item>

            <Form.Item name="propagateToOwner">
                <Checkbox v-model:checked="formState.propagateToOwner">向实体所有者（客户或租户）传播警报</Checkbox>
            </Form.Item>

            <Form.Item name="propagateToTenant">
                <Checkbox v-model:checked="formState.propagateToTenant">向租户传播警报</Checkbox>
            </Form.Item>
        </template>


    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "create-alarm",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Icon } from '/@/components/Icon';
import { Radio, Select, Checkbox, Space, Tooltip, Form, Button, Input } from 'ant-design-vue';
import { CodeEditor } from '/@/components/CodeEditor';
import { FormInstance } from 'ant-design-vue/lib/form';
import { ALARM_SEVERITY_OPTIONS } from '/@/enums/alarmEnum';

interface Configuration {
    scriptLang: 'JS' | 'TBEL',
    alarmType: string,
    alarmDetailsBuildJs: string,
    alarmDetailsBuildTbel: string,
    severity: string,
    dynamicSeverity: boolean,
    propagate: boolean,
    propagateToOwner: boolean,
    propagateToTenant: boolean,
    relationTypes: [],
    useMessageAlarmData: boolean,
    overwriteAlarmDetails: boolean,
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
    scriptLang: 'TBEL',
    alarmType: 'General Alarm',
    alarmDetailsBuildJs: '',
    alarmDetailsBuildTbel: '',
    dynamicSeverity: false,
    propagate: false,
    propagateToOwner: false,
    propagateToTenant: false,
    severity: 'CRITICAL',
    relationTypes: [],
    useMessageAlarmData: false,
    overwriteAlarmDetails: false,
})

watch(
    () => props.configuration,
    () => {
        formState.scriptLang = props.configuration.scriptLang;
        formState.alarmType = props.configuration.alarmType;
        formState.alarmDetailsBuildJs = props.configuration.alarmDetailsBuildJs;
        formState.alarmDetailsBuildTbel = props.configuration.alarmDetailsBuildTbel;
        formState.dynamicSeverity = props.configuration.dynamicSeverity;
        formState.overwriteAlarmDetails = props.configuration.overwriteAlarmDetails;
        formState.propagate = props.configuration.propagate;
        formState.propagateToOwner = props.configuration.propagateToOwner;
        formState.propagateToTenant = props.configuration.propagateToTenant;
        formState.relationTypes = props.configuration.relationTypes;
        formState.severity = props.configuration.severity;
        formState.useMessageAlarmData = props.configuration.useMessageAlarmData;

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

function handleFormatScript() {

}

function handleTestScript() {

}

function handleFullScreen() {

}

defineExpose({ getConfiguration })

</script>
