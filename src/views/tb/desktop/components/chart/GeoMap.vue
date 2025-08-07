<template>
  <div id="tianditu-container" :style="{ height, width }"></div>
</template>
<script lang="ts" setup>
  import { isArray } from 'lodash-es';
  import { useTianditu } from '/@/hooks/web/useTianditu';
  import { ref, watchEffect, onMounted } from 'vue';
  import { useWebsocketStore } from '/@/store/modules/websocket';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { onUnmounted } from 'vue';
  import dayjs from 'dayjs';
  import { watch } from 'vue';
  import { WsCmdType } from '/@/enums/wsCmdTypeEnum';

  const props = defineProps({
    width: {
      type: String as PropType<string>,
      default: '100%',
    },
    height: {
      type: String as PropType<string>,
      default: '400px',
    },
    center: {
      type: [Array, String] as PropType<[number, number] | string>,
      default: '诸城市',
    },
    zoom: { type: Number, default: 8 },
  });

  const DEVICE_POSITION_COUNT_CMD_ID = ref(0);

  const positionDeviceList = ref<Array<any>>([]);

  let mapInstance: any = undefined;

  const { getAndIncrementCmdId, send, unsubscribe } = useWebsocketStore();
  const { success, geocoder, T } = useTianditu('6ebfd5932adb4ce17a850dd486f0a246');

  watchEffect(() => {
    if (success.value == true) {
      initMap();
    }
  });

  watch(
    () => props.center,
    async () => {
      if (mapInstance) {
        const centerPoint = await getMapCenter();
        mapInstance.centerAndZoom(centerPoint, props.zoom);
      }
    },
  );

  async function initMap() {
    if (T.value) {
      const centerPoint = await getMapCenter();
      mapInstance = new T.value.Map('tianditu-container'); // 创建Map实例
      if (mapInstance) {
        mapInstance.centerAndZoom(centerPoint, props.zoom);
        mapInstance.enableScrollWheelZoom(); // 启用滚轮放大缩小
        sendQueryPacket();
      }
    }
  }

  async function getMapCenter() {
    let centerPoint = undefined;
    if (isArray(props.center)) {
      centerPoint = new T.value.LngLat(props.center[0], props.center[1]);
    } else {
      const location = await geocoder(props.center);
      centerPoint = new T.value.LngLat(location.lon, location.lat);
    }
    return centerPoint;
  }

  function sendQueryPacket() {
    positionDeviceList.value.length = 0;
    send(
      DEVICE_POSITION_COUNT_CMD_ID.value,
      {
        cmds: [
          {
            cmdId: DEVICE_POSITION_COUNT_CMD_ID.value,
            type: WsCmdType.ENTITY_DATA,
            latestCmd: {
              keys: [
                { type: 'TIME_SERIES', key: 'lat' },
                { type: 'TIME_SERIES', key: 'lng' },
                { type: 'ATTRIBUTE', key: 'active' },
                { type: 'ATTRIBUTE', key: 'lastActivityTime' },
              ],
            },
            query: {
              entityFilter: {
                type: 'entityType',
                entityType: EntityType.DEVICE,
                resolveMultiple: true,
              },
              keyFilters: [
                {
                  valueType: 'NUMERIC',
                  key: { key: 'lat', type: 'TIME_SERIES' },
                  predicate: { operation: 'GREATER', type: 'NUMERIC', value: { defaultValue: 0 } },
                },
              ],
              entityFields: [
                { type: 'ENTITY_FIELD', key: 'name' },
                { type: 'ENTITY_FIELD', key: 'label' },
              ],
              pageLink: {
                page: 0,
                pageSize: 1024,
                sortOrder: { direction: 'DESC', key: { type: 'ENTITY_FIELD', key: 'createdTime' } },
              },
              latestValues: [
                { type: 'TIME_SERIES', key: 'lat' },
                { type: 'TIME_SERIES', key: 'lng' },
                { type: 'ATTRIBUTE', key: 'active' },
                { type: 'ATTRIBUTE', key: 'lastActivityTime' },
              ],
            },
          },
        ],
      },
      onMessage,
    );
  }

  function onMessage(data: any) {
    if (DEVICE_POSITION_COUNT_CMD_ID.value == data.cmdId) {
      positionDeviceList.value.push(
        ...data.data.data.map((item) => {
          return {
            name: item.latest.ENTITY_FIELD.name.value,
            label: item.latest.ENTITY_FIELD.label.value,
            active: item.latest.ATTRIBUTE.active.value == 'true',
            lastActivityTime: Number.parseInt(item.latest.ATTRIBUTE.lastActivityTime.value),
            latitude: Number.parseFloat(item.latest.TIME_SERIES.lat.value),
            longitude: Number.parseFloat(item.latest.TIME_SERIES.lng.value),
          };
        }),
      );
    }
    renderPosition();
  }

  function renderPosition() {
    if (mapInstance && T.value) {
      mapInstance.clearOverLays();
      positionDeviceList.value.forEach((item) => {
        const point = new T.value.LngLat(item.longitude, item.latitude);
        const marker = new T.value.Marker(point);

        mapInstance.addOverLay(marker);

        const infoWindow = new T.value.InfoWindow();

        let info =
          `<div style="display:flex;justify-content:space-between;margin:0 6px 0 1px"><strong>名称：</strong><span>${item.name}</span></div>` +
          `<div style="display:flex;justify-content:space-between;margin:0 6px 0 1px"><strong>标签：</strong><span>${item.label}</span></div>` +
          `<div style="display:flex;justify-content:space-between;margin:0 6px 0 1px"><strong>状态：</strong><span style="color:${item.active == true ? 'green' : 'red'}">${item.active == true ? '在线' : '离线'}</span></div>`;
        info =
          info +
          `<div style="display:flex;justify-content:space-between;margin:0 6px 0 1px"><strong>活动时间：</strong><span>${dayjs(item.lastActivityTime).format('YYYY-MM-DD HH:mm:ss')}</span></div>`;

        infoWindow.setContent(info);

        marker.addEventListener('click', function () {
          marker.openInfoWindow(infoWindow);
        }); // 将标注添加到地图中
      });
    }
  }

  onMounted(() => {
    DEVICE_POSITION_COUNT_CMD_ID.value = getAndIncrementCmdId();
  });

  onUnmounted(() => {
    unsubscribeDataCmds();
  });

  function unsubscribeDataCmds() {
    if (DEVICE_POSITION_COUNT_CMD_ID.value > 0) {
      unsubscribe(DEVICE_POSITION_COUNT_CMD_ID.value, {
        cmds: [{ cmdId: DEVICE_POSITION_COUNT_CMD_ID.value, type: WsCmdType.ENTITY_DATA_UNSUBSCRIBE }],
      });
    }
  }
</script>
