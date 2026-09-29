<script setup lang="ts">
import type { ComponentInternalInstance } from 'vue';

import type { TbUserInfo } from '#/api/core/user';
import type {
  EntityData,
  EntityKey,
  EntityLatestValues,
} from '#/api/tb/entity-query';
import type { DeviceMap, MapPoint, Tianditu } from '#/types/tianditu';

import {
  computed,
  getCurrentInstance,
  h,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onMounted,
  ref,
  render,
  useId,
  watch,
} from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { areaList } from '@vant/area-data';
import { useResizeObserver } from '@vueuse/core';
import { Button, Spin } from 'antdv-next';

import {
  getImageResource,
  removeImagePrefix,
} from '#/adapter/component/image-input/utils';
import { getCustomerById } from '#/api/tb/customer';
import { getDeviceProfileInfoById } from '#/api/tb/device-profile';
import { downloadImagePreview } from '#/api/tb/image';
import { EntityType } from '#/enums';
import { useWs } from '#/hooks/use-ws';
import { useTianditu } from '#/hooks/useTianditu';
import { $t } from '#/locales';

import MapInfoWindow from './map-info-window.vue';

const emit = defineEmits<{ retry: [] }>();
// 默认使用无效 Key，部署时可通过环境变量覆盖。
const tiandituKey = String(
  import.meta.env.VITE_TIANDITU_KEY || 'invalid-tianditu-key',
);
const { geocoder, toPromise } = useTianditu(tiandituKey);
const container = ref<HTMLElement>();
const containerId = `customer-map-${useId().replaceAll(':', '-')}`;
const userStore = useUserStore();
const entities = ref<Record<string, EntityData>>();
const limited = ref(false);
const mapStatus = ref<'error' | 'loading' | 'ready'>('loading');
const instance = getCurrentInstance() as ComponentInternalInstance;
const profileIcons = new Map<string, Promise<string>>();
let map: DeviceMap | undefined;
let sdk: Tianditu | undefined;
let popupContainer: HTMLElement | undefined;
const mapCenter = ref<MapPoint>({ lng: 119.41, lat: 35.99 });
const demoTime = Date.now();
const keys: EntityKey[] = [
  ...(['TIME_SERIES', 'ATTRIBUTE'] as const).flatMap((type) =>
    ['latitude', 'longitude', 'lat', 'lng'].map((key) => ({ type, key })),
  ),
  { type: 'ATTRIBUTE', key: 'active' },
  { type: 'ATTRIBUTE', key: 'lastActivityTime' },
];
const ws = useWs({
  type: 'ENTITY_DATA',
  query: {
    entityFilter: { type: 'entityType', entityType: EntityType.DEVICE },
    pageLink: {
      page: 0,
      pageSize: 1024,
      dynamic: true,
      sortOrder: {
        direction: 'DESC',
        key: { type: 'ENTITY_FIELD', key: 'createdTime' },
      },
    },
    entityFields: [
      { type: 'ENTITY_FIELD', key: 'name' },
      { type: 'ENTITY_FIELD', key: 'label' },
      { type: 'ENTITY_FIELD', key: 'deviceProfileId' },
    ],
    latestValues: keys,
  },
  latestCmd: { keys },
});
watch(ws.data, (message) => {
  if (!message) {
    entities.value = undefined;
    limited.value = false;
    return;
  }
  if (message.cmdUpdateType !== 'ENTITY_DATA') return;
  if (message.data) {
    entities.value = Object.fromEntries(
      message.data.data.map((item) => [item.entityId.id, item]),
    );
    limited.value = message.data.hasNext;
  }
  if (!entities.value) return;
  // 增量消息只带变化字段，按数据类别合并，保留原有坐标和名称。
  for (const item of message.update ?? []) {
    const previous = entities.value[item.entityId.id];
    const latest: EntityLatestValues = { ...previous?.latest };
    for (const type of Object.keys(
      item.latest,
    ) as (keyof EntityLatestValues)[]) {
      latest[type] = { ...latest[type], ...item.latest[type] };
    }
    entities.value[item.entityId.id] = { ...item, latest };
  }
});
function getCoordinates(latest: EntityLatestValues): MapPoint | undefined {
  for (const type of ['TIME_SERIES', 'ATTRIBUTE'] as const) {
    for (const [latKey, lngKey] of [
      ['latitude', 'longitude'],
      ['lat', 'lng'],
    ] as const) {
      const rawLat = latest[type]?.[latKey]?.value;
      const rawLng = latest[type]?.[lngKey]?.value;
      if (
        rawLat === undefined ||
        rawLat === null ||
        rawLng === undefined ||
        rawLng === null ||
        String(rawLat).trim() === '' ||
        String(rawLng).trim() === ''
      )
        continue;
      const lat = Number(rawLat);
      const lng = Number(rawLng);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      )
        return { lat, lng };
    }
  }
}
const devices = computed(() =>
  Object.values(entities.value ?? {}).flatMap((entity) => {
    const point = getCoordinates(entity.latest);
    if (!point) return [];
    const latest = entity.latest;
    return [
      {
        id: entity.entityId.id,
        name: latest.ENTITY_FIELD?.name?.value ?? entity.entityId.id,
        label: latest.ENTITY_FIELD?.label?.value ?? '—',
        profileId: latest.ENTITY_FIELD?.deviceProfileId?.value ?? '',
        active: latest.ATTRIBUTE?.active?.value,
        lastActivity: Number(latest.ATTRIBUTE?.lastActivityTime?.value),
        ...point,
      },
    ];
  }),
);
const isDemo = computed(
  () =>
    entities.value !== undefined &&
    devices.value.length === 0 &&
    !ws.loading.value &&
    ws.status.value !== 'error' &&
    ws.status.value !== 'stale',
);
const displayDevices = computed(() =>
  isDemo.value
    ? (
        [
          [-0.025, 0.012],
          [0.018, 0.025],
          [0.03, -0.014],
        ] as const
      ).map(([lng, lat], index) => ({
        id: `demo-${index}`,
        profileId: '',
        name: $t('home.map.demoDevice', { index: index + 1 }),
        label: $t('home.map.demoLabel'),
        active: index === 2 ? 'false' : 'true',
        lastActivity: demoTime - index * 60_000,
        lng: mapCenter.value.lng + lng,
        lat: mapCenter.value.lat + lat,
      }))
    : devices.value,
);
type MapDevice = (typeof displayDevices.value)[number];

const mapNotice = computed(() => {
  if (ws.loading.value) return $t('home.loading');
  if (isDemo.value) return $t('home.map.demoNotice');
  return devices.value.length > 0
    ? $t('home.map.located', { count: devices.value.length })
    : $t('home.map.empty');
});

// 仅首次加载或真实/演示设备切换时调整视野，遥测更新保留用户的缩放与拖动。
watch(
  [displayDevices, isDemo, mapStatus],
  ([items, demo, status], [previous, previousDemo, previousStatus]) => {
    if (status !== 'ready') return;
    renderMarkers();
    if (
      items.length > 0 &&
      (previousStatus !== 'ready' ||
        previous.length === 0 ||
        demo !== previousDemo)
    )
      fitDevices();
  },
);

function fitDevices() {
  if (!map || !sdk) return;
  const { LngLat } = sdk;
  const points = displayDevices.value.map(
    (device) => new LngLat(device.lng, device.lat),
  );
  if (points.length > 1) map.setViewport(points);
  else if (points[0]) map.centerAndZoom(points[0], 13);
  else
    map.centerAndZoom(
      new sdk.LngLat(mapCenter.value.lng, mapCenter.value.lat),
      10,
    );
}
function renderMarkers() {
  if (!map || !sdk) return;
  const api = sdk;
  closePopup();
  map.clearOverLays();
  for (const device of displayDevices.value) {
    const marker = new sdk.Marker(new sdk.LngLat(device.lng, device.lat), {
      icon: createMarkerIcon(api, device.active === 'true'),
    });
    map.addOverLay(marker);
    marker.addEventListener('click', () => openDevicePopup(device));
    if (device.profileId) {
      void loadProfileIcon(device.profileId).then((image) => {
        if (image && !instance.isUnmounted)
          marker.setIcon(
            createMarkerIcon(api, device.active === 'true', image),
          );
      });
    }
  }
}

function openDevicePopup(device: MapDevice) {
  if (!map || !sdk) return;
  closePopup();
  const content = document.createElement('div');
  const vnode = h(MapInfoWindow, { device, onClose: closePopup });
  vnode.appContext = instance.appContext;
  render(vnode, content);
  popupContainer = content;
  const info = new sdk.InfoWindow(content, {
    minWidth: 300,
    maxWidth: 300,
    autoPan: true,
    closeButton: false,
    offset: new sdk.Point(0, -20),
    autoPanPadding: new sdk.Point(16, 16),
  });
  info.addEventListener('close', () => {
    if (popupContainer === content) unmountPopup();
  });
  map.openInfoWindow(info, new sdk.LngLat(device.lng, device.lat));
}

function unmountPopup() {
  if (popupContainer) render(null, popupContainer);
  popupContainer = undefined;
}

function closePopup() {
  map?.closeInfoWindow();
  unmountPopup();
}

function createMarkerIcon(api: Tianditu, active: boolean, image = '') {
  // 与设备列表的 success / warning 状态保持一致，未设置图片时使用定位图标。
  const color = active ? '#059669' : '#d97706';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <path d="M16 38S3 24 3 15a13 13 0 1 1 26 0c0 9-13 23-13 23Z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="16" cy="15" r="4.5" fill="white"/>
  </svg>`;
  return new api.Icon({
    iconUrl:
      image || `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: new api.Point(32, 40),
    iconAnchor: new api.Point(16, 38),
    className: 'home-device-marker',
  });
}
// 缓存 Promise，让同一配置的设备共用请求和图片。
function loadProfileIcon(profileId: string) {
  const icon = profileIcons.get(profileId) ?? fetchProfileIcon(profileId);
  profileIcons.set(profileId, icon);
  return icon;
}

async function fetchProfileIcon(profileId: string): Promise<string> {
  let url = '';
  try {
    const profile = await getDeviceProfileInfoById(profileId);
    if (!profile.image || instance.isUnmounted) return '';
    const resource = getImageResource(profile.image);
    url = resource
      ? URL.createObjectURL(
          await downloadImagePreview(resource.scope, resource.resourceKey),
        )
      : removeImagePrefix(profile.image);
    const image = new Image();
    image.src = url;
    await image.decode();
    return url;
  } catch {
    URL.revokeObjectURL(url);
    return '';
  }
}

async function loadMapCenter() {
  try {
    const customerId = (userStore.userInfo as TbUserInfo).tbUser.customerId?.id;
    const customer = customerId ? await getCustomerById(customerId) : undefined;
    if (instance.isUnmounted) return;
    // 客户表单的 country / state / city 分别保存省 / 市 / 区县。
    const address = [
      [customer?.country, areaList.province_list],
      [customer?.state, areaList.city_list],
      [customer?.city, areaList.county_list],
    ] as const;
    const location = address
      .map(([code, names]) => (code ? names[code] || code : ''))
      .filter((name) => name && !/^\d+$/.test(name))
      .join('');
    const point = await geocoder(location || '诸城市');
    if (!point || instance.isUnmounted) return;
    const lat = Number(point.lat);
    const lng = Number(point.lon);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      return;
    mapCenter.value = { lat, lng };
  } catch {
    /* 没有客户地址或地理编码不可用时，保留默认视野。 */
  }
}
async function initializeMap() {
  try {
    sdk = await toPromise();
    if (instance.isUnmounted) return;
    await loadMapCenter();
    if (instance.isUnmounted) return;
    map = new sdk.Map(containerId);
    map.centerAndZoom(
      new sdk.LngLat(mapCenter.value.lng, mapCenter.value.lat),
      10,
    );
    map.enableScrollWheelZoom();
    mapStatus.value = 'ready';
  } catch {
    if (!instance.isUnmounted) mapStatus.value = 'error';
  }
}

useResizeObserver(container, () => map?.checkResize());
onMounted(initializeMap);
onActivated(() => nextTick(() => map?.checkResize()));
onBeforeUnmount(() => {
  closePopup();
  map?.clearOverLays();
  map?.remove?.();
  // 未完成的图片请求也通过同一 Promise 回收，避免切页后残留 Blob URL。
  for (const image of profileIcons.values())
    void image.then(URL.revokeObjectURL);
  profileIcons.clear();
});
</script>

<template>
  <div
    class="customer-map relative isolate h-full min-h-0 overflow-hidden bg-muted rounded-xl"
  >
    <div
      :id="containerId"
      ref="container"
      class="h-full w-full"
      :aria-label="$t('home.map.title')"
    ></div>
    <div class="absolute right-4 top-4 z-[500] flex items-center gap-3">
      <VbenIconButton
        class="size-12 rounded-full shadow-sm"
        variant="outline"
        :disabled="mapStatus !== 'ready'"
        :tooltip="$t('home.map.fit')"
        @click="fitDevices"
      >
        <IconifyIcon icon="lucide:locate-fixed" class="size-4" />
        <span class="sr-only">{{ $t('home.map.fit') }}</span>
      </VbenIconButton>
    </div>
    <div
      v-if="mapStatus !== 'ready'"
      class="bg-card/90 absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 text-sm"
    >
      <Spin v-if="mapStatus === 'loading'" />
      <template v-else>
        <IconifyIcon icon="lucide:map" class="text-muted-foreground size-8" />
        <span>{{ $t('home.map.loadFailed') }}</span>
        <Button @click="emit('retry')">{{ $t('home.retry') }}</Button>
      </template>
    </div>
    <div
      v-else
      class="bg-card/95 absolute left-3 top-3 z-[500] flex max-w-[calc(100%-160px)] flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-sm"
    >
      <template
        v-if="ws.status.value === 'error' || ws.status.value === 'stale'"
      >
        {{ $t('home.loadFailed') }}
        <Button type="link" size="small" @click="ws.refresh">
          {{ $t('home.retry') }}
        </Button>
      </template>
      <template v-else>
        {{ mapNotice }}
        <span v-if="limited" class="text-muted-foreground">
          {{ $t('home.map.limited') }}
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.customer-map :deep(.tdt-container) {
  background: hsl(var(--muted));
}

/* 只调整底图瓦片，保留图钉、弹窗和天地图标识的原色。 */
.dark .customer-map :deep(.tdt-tile-pane) {
  filter: invert(1) hue-rotate(180deg) saturate(0.45) brightness(1.15)
    contrast(0.9);
}

.dark .customer-map :deep(.tdt-control-copyright) {
  color: hsl(var(--muted-foreground));
  background: hsl(var(--card) / 90%);
  border-radius: 4px;
}

.dark .customer-map :deep(.tdt-control-copyright a) {
  color: inherit;
}

.customer-map :deep(.tdt-infowindow-content-wrapper),
.customer-map :deep(.tdt-infowindow-tip) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.customer-map :deep(.tdt-infowindow-content) {
  margin: 0;
  line-height: inherit;
}

.customer-map :deep(.tdt-infowindow-close-button) {
  display: none;
}

.customer-map :deep(.home-device-marker) {
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 20%));
}

/* 与规则链编辑器相同的按钮图标，不继承地图 SDK 的绝对定位。 */
.customer-map :deep(button svg) {
  position: static;
}
</style>
