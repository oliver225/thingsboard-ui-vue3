<template>
  <div class="device-api">
    <BasicTable @register="registerTable" :columns="showColumn">
      <template #tableTitle>
        <Segmented v-model:value="apiType" :options="apiTypeList" @change="reload()" />
      </template>
      <template #caseSlot="{ column, record }">
        <Button size="small" type="primary" @click="handelShowCasemModal(record)"> 示例报文 </Button>
      </template>
    </BasicTable>

    <BasicModal v-model:open="showCaseModal">
      <template #title>示例报文( {{ showTopic.function }})</template>
      <div class="pl-2 pb-2 text-lg font-bold">
        {{ showTopic.topic }}
      </div>
      <CodeEditor v-model:value="showTopic.case" :mode="MODE.JSON" class="border border-solid border-gray-400" />
    </BasicModal>
  </div>
</template>
<script lang="ts" setup name="ViewsTbDeviceApi">
  import { BasicTable, BasicColumn, useTable } from '/@/components/Table';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { Segmented, Button } from 'ant-design-vue';
  import { BasicModal } from '/@/components/Modal';
  import { CodeEditor, MODE } from '/@/components/CodeEditor';
  import { computed, ref, reactive } from 'vue';
  import { DeviceInfo, getDeviceInfoById, DeviceCredentials, getDeviceCredentialsByDeviceId } from '/@/api/tb/device';
  import { onMounted } from 'vue';
  import { CredentialsType } from '/@/enums/deviceEnum';

  const props = defineProps({
    entityType: {
      type: String as PropType<EntityType>,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
  });

  const { showMessage } = useMessage();

  const deviceInfo = ref<DeviceInfo>({} as DeviceInfo);
  const credentials = ref<DeviceCredentials>({} as DeviceCredentials);

  const apiTypeList = reactive([
    { value: 'MQTT_DEVICE', label: 'MQTT 设备', className: 'segment-tab' },
    { value: 'MQTT_GATEWAY', label: 'MQTT 网关', className: 'segment-tab' },
    { value: 'HTTP', label: 'HTTP 设备', className: 'segment-tab' },
    { value: 'COAP', label: 'COAP 设备', className: 'segment-tab' },
  ]);
  const apiType = ref('MQTT_DEVICE');
  const showCaseModal = ref(false);
  const showTopic = ref();

  function handelShowCasemModal(record: any) {
    showCaseModal.value = true;
    showTopic.value = record;
  }

  const showColumn = computed(() => {
    switch (apiType.value) {
      case 'MQTT_DEVICE':
        return mqttColumns;
      case 'MQTT_GATEWAY':
        return mqttColumns;
      case 'HTTP':
        return httpColumns;
      case 'COAP':
        return mqttColumns;
    }
  });

  onMounted(async () => {
    await fetchDeviceInfo();
  });

  async function fetchDeviceInfo() {
    try {
      deviceInfo.value = await getDeviceInfoById(props.entityId);
      credentials.value = await getDeviceCredentialsByDeviceId(props.entityId);
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    }
  }

  function getAccessToken() {
    if (credentials.value && credentials.value.credentialsType == CredentialsType.ACCESS_TOKEN) {
      return credentials.value.credentialsId;
    }
    return '$ACCESS_TOKEN';
  }
  async function fetchDatasource() {
    switch (apiType.value) {
      case 'MQTT_DEVICE':
        return mqttDataSource.filter((item) => item.gateway == false);
      case 'MQTT_GATEWAY':
        return mqttDataSource.filter((item) => item.gateway == true);
      case 'HTTP':
        return httpDataSource.value;
      case 'COAP':
        return [];
    }
  }

  const httpDataSource = computed(() => {
    return [
      {
        function: '遥测上传',
        url: `${location.protocol}//${location.host}/api/v1/${getAccessToken()}/telemetry`,
        operate: 'POST',
        description: '遥测数据 上传到 服务端',
        case: '{"key1":"value1", "key2":"value2"}\n[{"key1":"value1"}, {"key2":"value2"}]\n{"ts":1451649600512, "values":{"key1":"value1", "key2":"value2"}}',
      },
      {
        rowSpan: 3,
        function: '属性',
        url: `${location.protocol}//${location.host}/api/v1/${getAccessToken()}/attributes`,
        operate: 'POST',
        description: '设备属性 上传到 服务端',
        case: '{"attribute1": "value1", "attribute2": true}',
      },
      {
        rowSpan: 0,
        function: '属性',
        url: `${location.protocol}//${location.host}/api/v1/${getAccessToken()}/attributes?clientKeys=attribute1,attribute2&sharedKeys=shared1,shared2`,
        operate: 'GET',
        description: '从 服务端 请求 客户端或共享设备属性',
        case: '{"client":{"attribute1":"value1","attribute2":true}}',
      },
      {
        rowSpan: 0,
        function: '属性',
        url: `${location.protocol}//${location.host}/api/v1/${getAccessToken()}/attributes/updates?timeout=20000`,
        operate: 'GET',
        description: '订阅来自服务器的属性更新',
        case: '{"client":{"attribute1":"value1","attribute2":true}}',
      },
      {
        rowSpan: 2,
        function: 'RPC',
        url: `${location.protocol}//${location.host}/api/v1/${getAccessToken()}/rpc?timeout=20000`,
        operate: 'GET',
        description: '订阅 服务端 下发的命令',
        case: '{"id": "$id", "method": "setGpio", "params": {"pin":1,"value":1}}',
      },
      {
        rowSpan: 0,
        function: 'RPC',
        url: `${location.protocol}//${location.host}/api/v1/${getAccessToken()}/rpc/$id`,
        operate: 'POST',
        description: '响应 服务端 下发的命令',
        case: '{"success": true}',
      },
    ];
  });

  const mqttDataSource = [
    {
      gateway: false,
      function: '遥测上传',
      topic: 'v1/devices/me/telemetry',
      operate: '发布',
      description: '遥测数据 上传到 服务端',
      case: '{"key1":"value1", "key2":"value2"}\n[{"key1":"value1"}, {"key2":"value2"}]\n{"ts":1451649600512, "values":{"key1":"value1", "key2":"value2"}}',
    },
    {
      rowSpan: 3,
      gateway: false,
      function: '属性',
      topic: 'v1/devices/me/attributes',
      operate: '发布',
      description: '设备属性 上传到 服务端',
      case: '{"attribute1": "value1", "attribute2": true}',
    },
    {
      rowSpan: 0,
      gateway: false,
      function: '属性',
      topic: 'v1/devices/me/attributes/request/$request_id',
      operate: '发布',
      description: '请求服务端 共享属性 和 客户端属性',
      case: '',
    },
    {
      rowSpan: 0,
      gateway: false,
      function: '属性',
      topic: 'v1/devices/me/attributes/response/+',
      operate: '订阅',
      description: '服务端 响应 的 共享属性 和 客户端属性',
      case: '{"client":{"attribute1":"value1","attribute2":true}}',
    },
    {
      rowSpan: 2,
      gateway: false,
      function: 'RPC',
      topic: 'v1/devices/me/rpc/request/+',
      operate: '订阅',
      description: '订阅 服务端 下发的命令',
      case: '{"method": "toggle_gpio","params": {"pin":1}}',
    },
    {
      rowSpan: 0,
      gateway: false,
      function: 'RPC',
      topic: 'v1/devices/me/rpc/response/$request_id',
      operate: '发布',
      description: '响应 服务端 下发的命令',
      case: '{"data": {"success":true}}',
    },
    {
      rowSpan: 2,
      gateway: true,
      function: '子设备连接',
      topic: 'v1/gateway/connect',
      operate: '发布',
      description: '子设备连接成功',
      case: '{"device":"Device A"}',
    },
    {
      rowSpan: 0,
      gateway: true,
      function: '子设备断连',
      topic: 'v1/gateway/disconnect',
      operate: '发布',
      description: '子设备断开连接',
      case: '{"device":"Device A"}',
    },
    {
      gateway: true,
      function: '遥测上传',
      topic: 'v1/gateway/telemetry',
      operate: '发布',
      description: '子设备的遥测数据 上传到 服务端',
      case: '{"Device A": [{"ts": 1483228800000,"values": {"temperature": 42, "humidity": 80}},{"ts": 1483228801000,"values": { "temperature": 43,"humidity": 82} } ], "Device B": [{"ts": 1483228800000,"values": { "temperature": 42, "humidity": 80} }]}',
    },
    {
      rowSpan: 4,
      gateway: true,
      function: '子设备属性',
      topic: 'v1/gateway/attributes',
      operate: '发布',
      description: '子设备的属性 上传到 服务端',
      case: '{"Device A":{"attribute1":"value1", "attribute2": 42}, "Device B":{"attribute1":"value1", "attribute2": 42}}',
    },
    {
      rowSpan: 0,
      gateway: true,
      function: '子设备属性',
      topic: 'v1/gateway/attributes',
      operate: '订阅',
      description: '订阅子设备的 属性更新',
      case: '{"device": "Device A", "data": {"attribute1": "value1", "attribute2": 42}}',
    },
    {
      rowSpan: 0,
      gateway: true,
      function: '子设备属性',
      topic: 'v1/gateway/attributes/request',
      operate: '发布',
      description: '请求服务端 子设备的属性',
      case: '{"id": "$request_id", "device": "Device A", "client": true, "key": "attribute1"}',
    },
    {
      rowSpan: 0,
      gateway: true,
      function: '子设备属性',
      topic: 'v1/gateway/attributes/response',
      operate: '订阅',
      description: '服务端 响应 请求的 子设备的属性',
      case: '{"id": "$request_id", "device": "Device A", "value": "value1"}',
    },
    {
      rowSpan: 2,
      gateway: true,
      function: 'RPC',
      topic: 'v1/gateway/rpc',
      operate: '订阅',
      description: '订阅 服务端 下发的命令',
      case: '{"device": "Device A", "data": {"id": "$request_id", "method": "toggle_gpio", "params": {"pin":1}}}',
    },
    {
      rowSpan: 0,
      gateway: true,
      function: 'RPC',
      topic: 'v1/gateway/rpc',
      operate: '发布',
      description: '响应 服务端 下发的命令',
      case: '{"device": "Device A", "id": "$request_id", "data": {"success": true}}',
    },
  ];
  const mqttColumns: BasicColumn[] = [
    {
      title: '功能',
      dataIndex: 'function',
      width: 120,
      key: 'function',
      align: 'center',
      customCell: (record, index) => {
        if (record.rowSpan != undefined) {
          return { rowSpan: record.rowSpan };
        }
        return {};
      },
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      align: 'left',
    },
    {
      title: '操作',
      dataIndex: 'operate',
      width: 80,
      key: 'operate',
      align: 'center',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      align: 'left',
    },
    {
      title: '示例',
      dataIndex: 'case',
      key: 'case',
      width: 100,
      align: 'center',
      slot: 'caseSlot',
    },
  ];

  const httpColumns: BasicColumn[] = [
    {
      title: '功能',
      dataIndex: 'function',
      width: 120,
      key: 'function',
      align: 'center',
      customCell: (record, index) => {
        if (record.rowSpan != undefined) {
          return { rowSpan: record.rowSpan };
        }
        return {};
      },
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      align: 'left',
      ellipsis: false,
    },
    {
      title: '操作',
      dataIndex: 'operate',
      width: 60,
      key: 'operate',
      align: 'center',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      align: 'left',
    },
    {
      title: '示例',
      dataIndex: 'case',
      key: 'case',
      width: 100,
      align: 'center',
      slot: 'caseSlot',
    },
  ];
  const [registerTable, { reload }] = useTable({
    showIndexColumn: false,
    api: fetchDatasource,
    showTableSetting: false,
    useSearchForm: false,
    pagination: false,
    canResize: true,
  });
</script>
<style lang="less">
  .device-api {
    .ant-segmented-item-selected {
      background-color: @primary-color !important;
      color: @white !important;
    }
  }
</style>
