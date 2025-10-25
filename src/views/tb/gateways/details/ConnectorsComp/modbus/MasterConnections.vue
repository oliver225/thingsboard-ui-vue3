<template>
  <div class="master-connections">
    <!-- Header with Add button -->
    <div class="mb-4 flex justify-between items-center">
      <span class="text-base font-medium">{{ t('tb.gateway.details.modbus.masterConnections.title') }}</span>
      <div class="flex gap-2">
        <Button type="primary" @click="handleAdd">
          <template #icon>
            <Icon icon="ant-design:plus-outlined" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Description -->
    <div class="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
      {{ t('tb.gateway.details.modbus.masterConnections.description') }}
    </div>

    <!-- Device connections list -->
    <div v-if="slaves.length === 0" class="text-center py-8 text-gray-500">
      {{ t('tb.gateway.details.modbus.masterConnections.noDevices') }}
    </div>

    <div v-else>
      <!-- Table header -->
      <div class="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-50 rounded-t font-medium text-sm border-b">
        <div class="col-span-3">{{ t('tb.gateway.details.modbus.masterConnections.deviceName') }}</div>
        <div class="col-span-3">{{ t('tb.gateway.details.modbus.masterConnections.info') }}</div>
        <div class="col-span-2">{{ t('tb.gateway.details.modbus.masterConnections.unitId') }}</div>
        <div class="col-span-2">{{ t('tb.gateway.details.modbus.masterConnections.type') }}</div>
        <div class="col-span-2 text-right">{{ t('tb.gateway.details.modbus.masterConnections.actions') }}</div>
      </div>

      <!-- Table rows -->
      <div class="border border-t-0 rounded-b">
        <div
          v-for="(slave, index) in slaves"
          :key="slave.deviceName"
          class="grid grid-cols-12 gap-4 py-3 px-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
          @click="handleEdit(slave, index)"
        >
          <div class="col-span-3 font-medium">{{ slave.deviceName }}</div>
          <div class="col-span-3 text-sm text-gray-600">{{ slave.host }}:{{ slave.port }}</div>
          <div class="col-span-2">
            <span class="px-2 py-1 bg-gray-100 rounded text-sm">{{ slave.unitId }}</span>
          </div>
          <div class="col-span-2">
            <Tag :color="getTypeColor(slave.type)">{{ slave.type.toUpperCase() }}</Tag>
          </div>
          <div class="col-span-2 text-right">
            <Button type="text" size="small" @click.stop="handleEdit(slave, index)">
              <Icon icon="ant-design:edit-outlined" />
            </Button>
            <Button type="text" size="small" danger @click.stop="removeDevice(index)" :disabled="slaves.length <= 1">
              <Icon icon="ant-design:delete-outlined" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备配置抽屉 -->
    <MasterConnectionsDrawer @register="registerDrawer" @save="handleSave" />
  </div>
</template>

<script lang="ts" setup name="MasterConnections">
  import { ref, computed, PropType, watch } from 'vue';
  import { Button, Tag } from 'ant-design-vue';
  import { cloneDeep } from 'lodash-es';

  import { useDrawer } from '/@/components/Drawer';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  import MasterConnectionsDrawer from './MasterConnectionsDrawer.vue';
  import { ModbusSlave, ModbusMaster, MODBUS_TYPE, MODBUS_METHOD, BYTE_ORDER, WORD_ORDER } from './type';
  import { REPORT_TYPE } from '/@/enums/gateway';

  const props = defineProps({
    config: {
      type: Object as PropType<Partial<ModbusMaster>>,
      default: () => ({}),
    },
  });

  const slaves = ref<ModbusSlave[]>([]);
  const currentIndex = ref(-1);
  const { t } = useI18n('');

  const [registerDrawer, { openDrawer }] = useDrawer();

  const createDefaultSlave = (): ModbusSlave => ({
    host: '127.0.0.1',
    port: 5021,
    type: MODBUS_TYPE.TCP,
    method: MODBUS_METHOD.SOCKET,
    timeout: 35,
    byteOrder: BYTE_ORDER.LITTLE,
    wordOrder: WORD_ORDER.LITTLE,
    retries: true,
    retryOnEmpty: true,
    retryOnInvalid: true,
    pollPeriod: 5000,
    unitId: 1,
    deviceName: 'Temp Sensor',
    deviceType: 'default',
    connectAttemptTimeMs: 5000,
    connectAttemptCount: 5,
    waitAfterFailedAttemptsMs: 300000,
    reportStrategy: {
      type: REPORT_TYPE.ON_REPORT_PERIOD,
      reportPeriod: 30000,
    },
    attributes: [],
    timeseries: [],
    attributeUpdates: [],
    rpc: [],
  });

  // 初始化数据
  watch(
    () => [props.config],
    () => {
      if (props.config?.slaves && props.config.slaves.length > 0) {
        slaves.value = cloneDeep(props.config.slaves);
      } else {
        slaves.value = [createDefaultSlave()];
      }
    },
    { immediate: true, deep: true },
  );

  function getTypeColor(type: MODBUS_TYPE) {
    switch (type) {
      case MODBUS_TYPE.TCP:
        return 'blue';
      case MODBUS_TYPE.SERIAL:
        return 'green';
      case MODBUS_TYPE.UDP:
        return 'orange';
      default:
        return 'default';
    }
  }

  function handleAdd() {
    currentIndex.value = -1;
    openDrawer(true, {
      slave: {},
      mode: 'add',
    });
  }

  function handleEdit(record: ModbusSlave, index: number) {
    currentIndex.value = index;
    openDrawer(true, {
      slave: cloneDeep(record),
      mode: 'edit',
    });
  }

  function removeDevice(index: number) {
    slaves.value.splice(index, 1);
    if (slaves.value.length === 0) {
      slaves.value.push(createDefaultSlave());
    }
  }

  function handleSave(slave: ModbusSlave) {
    if (currentIndex.value === -1) {
      slaves.value.push(slave);
    } else {
      slaves.value.splice(currentIndex.value, 1, slave);
    }
  }

  async function getConfiguration() {
    return {
      configurationJson: {
        master: {
          slaves: cloneDeep(slaves.value),
        },
      },
    };
  }

  function resetToInitial() {
    if (props.config?.slaves && props.config.slaves.length > 0) {
      slaves.value = cloneDeep(props.config.slaves);
    } else {
      slaves.value = [createDefaultSlave()];
    }
  }

  defineExpose({ getConfiguration, resetToInitial });
</script>

<style scoped>
  .master-connections {
    padding: 0;
  }

  .flex-1 {
    flex: 1;
  }
</style>
