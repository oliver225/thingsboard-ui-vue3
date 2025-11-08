<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.latitudeKeyName')"
      name="latitudeKeyName"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.latitudeKeyNameRequired') }]"
    >
      <Input v-model:value="formState.latitudeKeyName" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.longitudeKeyName')"
      name="longitudeKeyName"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.longitudeKeyNameRequired') }]"
    >
      <Input v-model:value="formState.longitudeKeyName" />
    </Form.Item>
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
      :label="t('tb.ruleChain.nodeAction.perimeterKeyName')"
      name="perimeterKeyName"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.perimeterKeyNameRequired') }]"
      :help="t('tb.ruleChain.nodeAction.perimeterKeyNameHelp')"
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
          <InputNumber v-model:value="formState.centerLongitude" :style="{ width: '100%' }" :step="0.01" />
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
          <Select v-model:value="formState.rangeUnit" :default-value="'METER'" :options="rangeUnitOptions" />
        </Form.Item>
      </Col>
    </Row>

    <!-- Presence monitoring strategy -->
    <Form.Item name="reportPresenceStatusOnEachMessage">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <span class="font-medium">{{ t('tb.ruleChain.nodeAction.presenceMonitoringStrategy') }}</span>
          <div class="flex gap-2">
            <Button
              :type="formState.reportPresenceStatusOnEachMessage ? 'primary' : 'default'"
              @click="formState.reportPresenceStatusOnEachMessage = true"
            >
              {{ t('tb.ruleChain.nodeAction.onEachMessage') }}
            </Button>
            <Button
              :type="!formState.reportPresenceStatusOnEachMessage ? 'primary' : 'default'"
              @click="formState.reportPresenceStatusOnEachMessage = false"
            >
              {{ t('tb.ruleChain.nodeAction.onFirstMessage') }}
            </Button>
          </div>
        </div>

        <!-- Description for "On each message" mode -->
        <div
          v-if="formState.reportPresenceStatusOnEachMessage"
          class="border border-neutral-300 rounded-md px-4 py-3 bg-neutral-100"
        >
          <span class="text-neutral-600">{{ t('tb.ruleChain.nodeAction.onEachMessageDescription') }}</span>
        </div>

        <!-- Description for "On first message" mode -->
        <div v-else class="border border-neutral-300 rounded-md px-4 py-3 bg-neutral-100">
          <span class="text-neutral-600">{{ t('tb.ruleChain.nodeAction.onFirstMessageDescription') }}</span>
        </div>
      </div>
    </Form.Item>

    <!-- Duration settings - only show when "On first message" is selected -->
    <Row :gutter="20" v-if="!formState.reportPresenceStatusOnEachMessage">
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.minInsideDuration')"
          name="minInsideDuration"
          :rules="[{ required: true }]"
        >
          <InputNumber v-model:value="formState.minInsideDuration" :style="{ width: '100%' }" :min="1" :step="1" />
        </Form.Item>
      </Col>
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.minInsideDurationTimeUnit')"
          name="minInsideDurationTimeUnit"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.minInsideDurationTimeUnit" :options="TIME_UNIT_OPTIONS" />
        </Form.Item>
      </Col>
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.minOutsideDuration')"
          name="minOutsideDuration"
          :rules="[{ required: true }]"
        >
          <InputNumber v-model:value="formState.minOutsideDuration" :style="{ width: '100%' }" :min="1" :step="1" />
        </Form.Item>
      </Col>
      <Col :span="12">
        <Form.Item
          :label="t('tb.ruleChain.nodeAction.minOutsideDurationTimeUnit')"
          name="minOutsideDurationTimeUnit"
          :rules="[{ required: true }]"
        >
          <Select v-model:value="formState.minOutsideDurationTimeUnit" :options="TIME_UNIT_OPTIONS" />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'gps-geofencing-events',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, InputNumber, Select, Checkbox, Row, Col, Button } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { TIME_UNIT_OPTIONS } from '/@/enums/telemetryEnum';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface Configuration {
    centerLatitude: string;
    centerLongitude: string;
    fetchPerimeterInfoFromMessageMetadata: boolean;
    latitudeKeyName: string;
    longitudeKeyName: string;
    minInsideDuration: number;
    minInsideDurationTimeUnit: string;
    minOutsideDuration: number;
    minOutsideDurationTimeUnit: string;
    perimeterKeyName: string;
    perimeterType: 'POLYGON' | 'CIRCLE';
    polygonsDefinition: string;
    range: number;
    rangeUnit: 'METER' | 'KILOMETER' | 'FOOT' | 'MILE' | 'NAUTICAL_MILE';
    reportPresenceStatusOnEachMessage: boolean;
  }

  const { t } = useI18n('tb');

  const rangeUnitOptions = [
    { value: 'METER', label: t('tb.ruleChain.nodeAction.meter') },
    { value: 'KILOMETER', label: t('tb.ruleChain.nodeAction.kilometer') },
    { value: 'FOOT', label: t('tb.ruleChain.nodeAction.foot') },
    { value: 'MILE', label: t('tb.ruleChain.nodeAction.mile') },
    { value: 'NAUTICAL_MILE', label: t('tb.ruleChain.nodeAction.nauticalMile') },
  ];

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
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
