<template>
    <Form ref="formRef" :model="formState" layout="vertical">

        <Form.Item label="纬度字段" name="latitudeKeyName" :rules="[{ required: true, message: '纬度字段名称不能为空!' }]">
            <Input v-model:value="formState.latitudeKeyName">
            </Input>
        </Form.Item>
        <Form.Item label="经度字段" name="longitudeKeyName" :rules="[{ required: true, message: '经度字段名称不能为空!' }]">
            <Input v-model:value="formState.longitudeKeyName" />
        </Form.Item>
        <Form.Item label="边界类型" name="perimeterType" :rules="[{ required: true, message: '边界类型必选!' }]">
            <Select v-model:value="formState.perimeterType">
                <Select.Option value="POLYGON">多边形</Select.Option>
                <Select.Option value="CIRCLE">圆形</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item name="fetchPerimeterInfoFromMessageMetadata">
            <Checkbox v-model:checked="formState.fetchPerimeterInfoFromMessageMetadata"> 从元数据中获取边界信息</Checkbox>
        </Form.Item>
        <Form.Item label="边界信息字段" name="perimeterKeyName" :rules="[{ required: true, message: '边界信息字段不能为空!' }]"
            help="包含边界信息的元数据字段名称。" v-if="formState.fetchPerimeterInfoFromMessageMetadata == true">
            <Input v-model:value="formState.perimeterKeyName" />
        </Form.Item>
        <Form.Item label="范围边界定义" name="polygonsDefinition" :rules="[{ required: true, message: '范围边界不能为空!' }]"
            help="使用以下格式手动定义多边形：[[lat1，lon1]，[lat2，lon2]，...，[latN，lonN]]。"
            v-if="formState.fetchPerimeterInfoFromMessageMetadata == false && formState.perimeterType == 'POLYGON'">
            <Input v-model:checked="formState.polygonsDefinition" />
        </Form.Item>
        <Row :gutter="20"
            v-if="formState.fetchPerimeterInfoFromMessageMetadata == false && formState.perimeterType == 'CIRCLE'">
            <Col :span="12">
            <Form.Item label="圆心纬度" name="centerLatitude" :rules="[{ required: true, message: '圆心纬度不能为空!' }]">
                <InputNumber v-model:value="formState.centerLatitude" :style="{ width: '100%' }" :step="0.01" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="圆心经度" name="centerLongitude" :rules="[{ required: true, message: '圆心经度不能为空!' }]">
                <InputNumber v-model:value="formState.centerLatitude" :style="{ width: '100%' }" :step="0.01" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="范围" name="range" :rules="[{ required: true, message: '范围不能为空!' }]">
                <InputNumber v-model:value="formState.range" :style="{ width: '100%' }" :step="0.01" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="范围单位" name="rangeUnit" :rules="[{ required: true, message: '范围单位不能为空!' }]">
                <Select v-model:value="formState.rangeUnit" :default-value="'METER'" :options="rangeUnitOptions">
                </Select>
            </Form.Item>
            </Col>
        </Row>
        <Row :gutter="20">
            <Col :span="12">
            <Form.Item label="min Inside Duration" name="minInsideDuration" :rules="[{ required: true, }]">
                <InputNumber v-model:value="formState.minInsideDuration" :style="{ width: '100%' }" :min="1" :step="1" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="单位" name="minInsideDurationTimeUnit" :rules="[{ required: true }]">
                <Select v-model:value="formState.minInsideDurationTimeUnit" :options="TIME_UNIT_OPTIONS">
                </Select>
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="min Outside Duration" name="minOutsideDuration" :rules="[{ required: true, }]">
                <InputNumber v-model:value="formState.minOutsideDuration" :style="{ width: '100%' }" :min="1" :step="1" />
            </Form.Item>
            </Col>
            <Col :span="12">
            <Form.Item label="单位" name="minOutsideDurationTimeUnit" :rules="[{ required: true }]">
                <Select v-model:value="formState.minOutsideDurationTimeUnit" :options="TIME_UNIT_OPTIONS">
                </Select>
            </Form.Item>
            </Col>
        </Row>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "gps-geofencing-events",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Input, InputNumber, Select, Checkbox, Row, Col } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';
import { TIME_UNIT_OPTIONS } from '/@/enums/telemetryEnum';

interface Configuration {
    centerLatitude: string,
    centerLongitude: string,
    fetchPerimeterInfoFromMessageMetadata: boolean,
    latitudeKeyName: string,
    longitudeKeyName: string,
    minInsideDuration: number,
    minInsideDurationTimeUnit: string,
    minOutsideDuration: number,
    minOutsideDurationTimeUnit: string,
    perimeterKeyName: string,
    perimeterType: 'POLYGON' | 'CIRCLE',
    polygonsDefinition: string,
    range: number,
    rangeUnit: 'METER' | 'KILOMETER' | 'FOOT' | 'MILE' | 'NAUTICAL_MILE',
    reportPresenceStatusOnEachMessage: boolean,
}

const rangeUnitOptions = [
    { value: 'METER', label: '米' },
    { value: 'KILOMETER', label: '千米' },
    { value: 'FOOT', label: '英尺' },
    { value: 'MILE', label: '英里' },
    { value: 'NAUTICAL_MILE', label: '海里' }
]


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const formRef = ref<FormInstance>();

const formState = reactive<any>({
    centerLatitude: undefined,
    centerLongitude: undefined,
    fetchPerimeterInfoFromMessageMetadata: true,
    latitudeKeyName: 'latitude',
    longitudeKeyName: 'longitude',
    perimeterKeyName: 'ss_perimeter',
    perimeterType: 'POLYGON',
    polygonsDefinition: undefined,
    range: undefined,
    rangeUnit: undefined,
    minInsideDuration: 1,
    minInsideDurationTimeUnit: 'MINUTES',
    minOutsideDuration: 1,
    minOutsideDurationTimeUnit: 'MINUTES',
    reportPresenceStatusOnEachMessage: true,
});



watch(
    () => props.configuration,
    () => {
        formState.centerLatitude = props.configuration.centerLatitude;
        formState.centerLongitude = props.configuration.centerLongitude;
        formState.fetchPerimeterInfoFromMessageMetadata = props.configuration.fetchPerimeterInfoFromMessageMetadata;
        formState.latitudeKeyName = props.configuration.latitudeKeyName;
        formState.longitudeKeyName = props.configuration.longitudeKeyName;
        formState.minInsideDuration = props.configuration.minInsideDuration;
        formState.minInsideDurationTimeUnit = props.configuration.minInsideDurationTimeUnit;
        formState.minOutsideDuration = props.configuration.minOutsideDuration;
        formState.minOutsideDurationTimeUnit = props.configuration.minOutsideDurationTimeUnit;
        formState.perimeterKeyName = props.configuration.perimeterKeyName;
        formState.perimeterType = props.configuration.perimeterType;
        formState.polygonsDefinition = props.configuration.polygonsDefinition;
        formState.range = props.configuration.range;
        formState.rangeUnit = props.configuration.rangeUnit;
        formState.reportPresenceStatusOnEachMessage = props.configuration.reportPresenceStatusOnEachMessage;
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
