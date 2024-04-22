<template>
    <Form ref="formRef" :model="formState" layout="vertical">
        <div class="border  border-neutral-400 p-2 rounded">
            <p class="text-base font-bold">坐标字段</p>
            <div class="p-2">
                <Row :gutter="20">
                    <Col :span="12">
                    <Form.Item label="纬度字段" name="latitudeKeyName" :rules="[{ required: true, message: '纬度字段名称不能为空!' }]">
                        <Input v-model:value="formState.latitudeKeyName">
                        </Input>
                    </Form.Item>
                    </Col>
                    <Col :span="12">
                    <Form.Item label="经度字段" name="longitudeKeyName" :rules="[{ required: true, message: '经度字段名称不能为空!' }]">
                        <Input v-model:value="formState.longitudeKeyName" />
                    </Form.Item>
                    </Col>
                </Row>
                <Alert type="success" message="规则节点尝试从消息中检索指定的字段。如果它们不存在，它将在元数据中查找它们。" />
            </div>
        </div>
        <div class="border  border-neutral-400 p-2 rounded mt-3">
            <p class="text-base font-bold">地理围栏</p>
            <div class="p-2">
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
            </div>
        </div>

    </Form>
</template>
<script lang="ts">
export default defineComponent({
    name: "gps-geofencing-filter",
});
</script>
<script lang="ts" setup >
import { ref, watch, defineComponent, reactive } from 'vue';
import { Form, Select, Input, Row, Col, Alert, Checkbox, InputNumber } from 'ant-design-vue';
import { FormInstance } from 'ant-design-vue/lib/form';

interface Configuration {
    latitudeKeyName: string,
    longitudeKeyName: string,
    perimeterKeyName: string,
    polygonsDefinition: string,
    perimeterType: 'POLYGON' | 'CIRCLE',
    fetchPerimeterInfoFromMessageMetadata: boolean,
    centerLatitude: number,
    centerLongitude: number,
    range: number,
    rangeUnit: 'METER' | 'KILOMETER' | 'FOOT' | 'MILE' | 'NAUTICAL_MILE'

}


const props = defineProps({
    configuration: {
        type: Object as PropType<Configuration>,
        required: true,
    },
    ruleChainId: { type: String, default: '' }

});

const rangeUnitOptions = [
    { value: 'METER', label: '米' },
    { value: 'KILOMETER', label: '千米' },
    { value: 'FOOT', label: '英尺' },
    { value: 'MILE', label: '英里' },
    { value: 'NAUTICAL_MILE', label: '海里' }
]




const formRef = ref<FormInstance>();

const formState = reactive<any>({
    latitudeKeyName: 'latitude',
    longitudeKeyName: 'longitude',
    perimeterKeyName: 'ss_perimeter',
    polygonsDefinition: undefined,
    perimeterType: 'POLYGON',
    fetchPerimeterInfoFromMessageMetadata: true,
    centerLatitude: undefined,
    centerLongitude: undefined,
    range: undefined,
    rangeUnit: undefined
});

watch(
    () => props.configuration,
    () => {
        formState.latitudeKeyName = props.configuration.latitudeKeyName;
        formState.longitudeKeyName = props.configuration.longitudeKeyName;
        formState.perimeterKeyName = props.configuration.perimeterKeyName;
        formState.polygonsDefinition = props.configuration.polygonsDefinition;
        formState.perimeterType = props.configuration.perimeterType;
        formState.fetchPerimeterInfoFromMessageMetadata = props.configuration.fetchPerimeterInfoFromMessageMetadata;
        formState.centerLatitude = props.configuration.centerLatitude;
        formState.centerLongitude = props.configuration.centerLongitude;
        formState.range = props.configuration.range;
        formState.rangeUnit = props.configuration.rangeUnit;
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
