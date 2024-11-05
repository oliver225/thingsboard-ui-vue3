<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="遥测数据Keys" name="latestTsKeyNames" :rules="[{ required: true, message: '请选择遥测数据Keys!' }]"
            help="使用${metadataKey}表示元数据中的值，$[messageKey]表示消息正文中的值。">
            <Select v-model:value="formState.latestTsKeyNames" mode="tags">
            </Select>
        </Form.Item>
        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <p class="text-base font-bold">提取间隔</p>
            <div class="p-2">
                <Form.Item name="useMetadataIntervalPatterns">
                    <div class="flex items-center">
                        <Switch size="small" v-model:checked="formState.useMetadataIntervalPatterns"
                            @change="handleUseMetadataIntervalChange" />
                        <span class="ml-4">使用动态间隔</span>
                    </div>
                </Form.Item>
                <Row :gutter="20" v-if="formState.useMetadataIntervalPatterns == false">
                    <Col :span="12">
                    <Form.Item label="开始间隔" name="startInterval" :rules="[{ required: true, message: '开始间隔必填!' }]">
                        <InputNumber v-model:value="formState.startInterval" :min="1" :style="{ width: '100%' }" />
                    </Form.Item>
                    </Col>
                    <Col :span="12">
                    <Form.Item label="时间单位" name="startIntervalTimeUnit">
                        <Select v-model:value="formState.startIntervalTimeUnit" :options="TIME_UNIT_OPTIONS" />
                    </Form.Item>
                    </Col>
                    <Col :span="12">
                    <Form.Item label="结束间隔" name="endInterval" :rules="[{ required: true, message: '结束间隔必填!' }]">
                        <InputNumber v-model:value="formState.endInterval" :min="1" :style="{ width: '100%' }" />
                    </Form.Item>
                    </Col>
                    <Col :span="12">
                    <Form.Item label="时间单位" name="endIntervalTimeUnit">
                        <Select v-model:value="formState.endIntervalTimeUnit" :options="TIME_UNIT_OPTIONS" />
                    </Form.Item>
                    </Col>
                </Row>
                <template v-if="formState.useMetadataIntervalPatterns == true">
                    <Form.Item label="开始间隔" name="startIntervalPattern" :rules="[{ required: true, message: '开始间隔必填!' }]">
                        <Input v-model:value="formState.startIntervalPattern" />
                    </Form.Item>
                    <Form.Item label="结束间隔" name="endIntervalPattern" :rules="[{ required: true, message: '结束间隔必填!' }]">
                        <Input v-model:value="formState.endIntervalPattern" />
                    </Form.Item>
                </template>
                <Alert type="success">
                    <template #message>
                        <div v-if="formState.useMetadataIntervalPatterns == false">
                            提取从
                            {{ formState.startInterval }}
                            {{ TIME_UNIT_OPTIONS.find(unit => unit.value == formState.startIntervalTimeUnit)?.label }}
                            前到
                            {{ formState.endInterval }}
                            {{ TIME_UNIT_OPTIONS.find(unit => unit.value == formState.endIntervalTimeUnit)?.label }}
                            前的时间序列。
                        </div>
                        <div v-else>
                            间隔开始和结束输入字段支持模板化。请注意，替换的模板值应以毫秒为单位进行设置。使用$[messageKey]从消息中提取值，使用${metadataKey}从元数据中提取值。
                        </div>

                    </template>
                </Alert>
            </div>
        </div>
        <div class="border border-solid border-neutral-300 rounded-md py-2 px-3 mb-4">
            <p class="text-base font-bold">提取策略</p>
            <div class="p-2">
                <Form.Item name="fetchMode">
                    <Radio.Group v-model:value="formState.fetchMode" button-style="solid" :style="{ display: 'flex' }"
                        class="w-full">
                        <Radio.Button class="flex-1" value="FIRST">First</Radio.Button>
                        <Radio.Button class="flex-1" value="LAST">Last</Radio.Button>
                        <Radio.Button class="flex-1" value="ALL">All</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Alert type="success">
                    <template #message>
                        <span v-if="formState.fetchMode == 'FIRST'"> 如果选择提取策略'First'规则节点将检索到最接近提取间隔开始的遥测数据。</span>
                        <span v-else-if="formState.fetchMode == 'LAST'"> 如果选择了提取模式'Last'规则节点将检索到距离提取间隔结束最近的遥测数据。</span>
                        <span v-else="formState.fetchMode == 'ALL'"> 如果选择了提取模式'All'规则节点将使用可配置的查询参数从提取间隔中检索遥测数据。</span>
                    </template>
                </Alert>
                <template v-if="formState.fetchMode == 'ALL'">
                    <Form.Item label="数据聚合" name="aggregation">
                        <Select v-model:value="formState.aggregation" :options="AGGREGATION_OPTIONS" />
                    </Form.Item>
                    <Form.Item label="时间戳排序" name="orderBy">
                        <Select v-model:value="formState.orderBy">
                            <Select.Option value="ASC">ASC</Select.Option>
                            <Select.Option value="DESC">DESC</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Limit" name="limit" :rules="[{ required: true, message: 'Limit必填!' }]"
                        help="最小限值为2，最大值为1000。如果要提取单个条目，请选择提提取策略'First'或 'Last'。">
                        <InputNumber v-model:value="formState.limit" :min="2" :max="1000" :style="{ width: '100%' }" />
                    </Form.Item>
                </template>

            </div>
        </div>



    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "originator-telemetry",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Switch, Select, Row, Col, Radio, Input, InputNumber, Alert } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { Aggregation, OrderBy, TimeUnit, TIME_UNIT_OPTIONS, AGGREGATION_OPTIONS } from '/@/enums/telemetryEnum';

interface Configuration {
    latestTsKeyNames: [],
    useMetadataIntervalPatterns: boolean,
    startInterval: number,
    startIntervalPattern: string,
    startIntervalTimeUnit: TimeUnit,
    endInterval: number,
    endIntervalPattern: string,
    endIntervalTimeUnit: TimeUnit,
    fetchMode: 'FIRST' | 'LAST' | 'ALL',
    aggregation: Aggregation,
    orderBy: OrderBy,
    limit: 1000,
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
    latestTsKeyNames: [],
    useMetadataIntervalPatterns: false,
    startInterval: 2,
    startIntervalPattern: '',
    startIntervalTimeUnit: TimeUnit.SECONDS,
    endInterval: 1,
    endIntervalPattern: '',
    endIntervalTimeUnit: TimeUnit.SECONDS,
    fetchMode: 'FIRST',
    aggregation: Aggregation.NONE,
    orderBy: OrderBy.ASCENDING,
    limit: 1000,
});

watch(
    () => props.configuration,
    () => {
        formState.latestTsKeyNames = props.configuration.latestTsKeyNames;
        formState.useMetadataIntervalPatterns = props.configuration.useMetadataIntervalPatterns;
        formState.startInterval = props.configuration.startInterval;
        formState.startIntervalPattern = props.configuration.startIntervalPattern;
        formState.startIntervalTimeUnit = props.configuration.startIntervalTimeUnit;
        formState.endInterval = props.configuration.endInterval;
        formState.endIntervalPattern = props.configuration.endIntervalPattern;
        formState.endIntervalTimeUnit = props.configuration.endIntervalTimeUnit;
        formState.fetchMode = props.configuration.fetchMode;
        formState.aggregation = props.configuration.aggregation;
        formState.orderBy = props.configuration.orderBy;
        formState.limit = props.configuration.limit;
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

function handleUseMetadataIntervalChange(useMetadataInterval) {
    if (useMetadataInterval == true) {
        formState.startInterval = -1;
        formState.endInterval = 1;
    } else {
        formState.startInterval = 1;
        formState.endInterval = 2;

    }
}



defineExpose({ getConfiguration })

</script>
