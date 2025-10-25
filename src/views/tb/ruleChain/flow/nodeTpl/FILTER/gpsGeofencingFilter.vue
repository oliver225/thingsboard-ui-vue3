<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-neutral-400 p-2 rounded">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.coordinateFields') }}</p>
      <div class="p-2">
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.latitudeField')"
              name="latitudeKeyName"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.latitudeKeyNameRequired') }]"
            >
              <Input v-model:value="formState.latitudeKeyName"> </Input>
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.longitudeField')"
              name="longitudeKeyName"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.longitudeKeyNameRequired') }]"
            >
              <Input v-model:value="formState.longitudeKeyName" />
            </Form.Item>
          </Col>
        </Row>
        <Alert type="success" :message="t('tb.ruleChain.nodeAction.coordinateFieldsHelp')" />
      </div>
    </div>
    <div class="border border-neutral-400 p-2 rounded mt-3">
      <p class="text-base font-bold">{{ t('tb.ruleChain.nodeAction.geofencing') }}</p>
      <div class="p-2">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.perimeterType')"
          name="perimeterType"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.perimeterTypeRequired') }]"
        >
          <Select v-model:value="formState.perimeterType">
            <Select.Option value="POLYGON">{{ t('tb.ruleChain.nodeAction.perimeterTypePolygon') }}</Select.Option>
            <Select.Option value="CIRCLE">{{ t('tb.ruleChain.nodeAction.perimeterTypeCircle') }}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="fetchPerimeterInfoFromMessageMetadata">
          <Checkbox v-model:checked="formState.fetchPerimeterInfoFromMessageMetadata">
            {{ t('tb.ruleChain.nodeAction.fetchPerimeterFromMetadata') }}</Checkbox
          >
        </Form.Item>
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.perimeterInfoField')"
          name="perimeterKeyName"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.perimeterInfoFieldRequired') }]"
          :help="t('tb.ruleChain.nodeAction.perimeterInfoFieldHelp')"
          v-if="formState.fetchPerimeterInfoFromMessageMetadata == true"
        >
          <Input v-model:value="formState.perimeterKeyName" />
        </Form.Item>

        <Form.Item
          :label="t('tb.ruleChain.nodeAction.polygonsDefinition')"
          name="polygonsDefinition"
          :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.polygonsDefinitionRequired') }]"
          :help="t('tb.ruleChain.nodeAction.polygonsDefinitionHelp')"
          v-if="formState.fetchPerimeterInfoFromMessageMetadata == false && formState.perimeterType == 'POLYGON'"
        >
          <Input v-model:checked="formState.polygonsDefinition" />
        </Form.Item>

        <Row
          :gutter="20"
          v-if="formState.fetchPerimeterInfoFromMessageMetadata == false && formState.perimeterType == 'CIRCLE'"
        >
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.centerLatitude')"
              name="centerLatitude"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.centerLatitudeRequired') }]"
            >
              <InputNumber v-model:value="formState.centerLatitude" :style="{ width: '100%' }" :step="0.01" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.centerLongitude')"
              name="centerLongitude"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.centerLongitudeRequired') }]"
            >
              <InputNumber v-model:value="formState.centerLatitude" :style="{ width: '100%' }" :step="0.01" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.range')"
              name="range"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.rangeRequired') }]"
            >
              <InputNumber v-model:value="formState.range" :style="{ width: '100%' }" :step="0.01" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item
              :label="t('tb.ruleChain.nodeAction.rangeUnit')"
              name="rangeUnit"
              :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.rangeUnitRequired') }]"
            >
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
    name: 'gps-geofencing-filter',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Select, Input, Row, Col, Alert, Checkbox, InputNumber } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    latitudeKeyName: string;
    longitudeKeyName: string;
    perimeterKeyName: string;
    polygonsDefinition: string;
    perimeterType: 'POLYGON' | 'CIRCLE';
    fetchPerimeterInfoFromMessageMetadata: boolean;
    centerLatitude: number;
    centerLongitude: number;
    range: number;
    rangeUnit: 'METER' | 'KILOMETER' | 'FOOT' | 'MILE' | 'NAUTICAL_MILE';
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const rangeUnitOptions = [
    { value: 'METER', label: t('tb.ruleChain.nodeAction.meter') },
    { value: 'KILOMETER', label: t('tb.ruleChain.nodeAction.kilometer') },
    { value: 'FOOT', label: t('tb.ruleChain.nodeAction.foot') },
    { value: 'MILE', label: t('tb.ruleChain.nodeAction.mile') },
    { value: 'NAUTICAL_MILE', label: t('tb.ruleChain.nodeAction.nauticalMile') },
  ];

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
    rangeUnit: undefined,
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
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
