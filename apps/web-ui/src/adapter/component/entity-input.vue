<script setup lang="ts">
import type { SelectProps } from 'antdv-next';

import type { EntityDataPageLink } from '#/api/tb/entity-query';
import type { EntityType } from '#/enums';
import type { EntityId, PageData, PageLink } from '#/types/tb';

import { computed, onBeforeUnmount, ref, useAttrs, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { Select } from 'antdv-next';

import { getAiModelById, getAiModels } from '#/api/tb/ai-model';
import { getAssetProfileInfos } from '#/api/tb/asset';
import { getAssetProfileById } from '#/api/tb/asset-profile';
import { getCustomerById, getCustomers } from '#/api/tb/customer';
import { getDashboardInfoById, getTenantDashboards } from '#/api/tb/dashboard';
import {
  getDeviceProfileInfoById,
  getDeviceProfileInfos,
} from '#/api/tb/device-profile';
import { findEntityDataByQuery } from '#/api/tb/entity-query';
import { getMobileApp, getMobileApps } from '#/api/tb/mobile-app';
import {
  getNotificationTargetById,
  getNotificationTargets,
} from '#/api/tb/notification-target';
import {
  getNotificationTemplateById,
  getNotificationTemplates,
} from '#/api/tb/notification-template';
import { getOAuth2Client, getOAuth2Clients } from '#/api/tb/oauth2';
import { getQueueById, getQueues } from '#/api/tb/queue';
import { getResourceInfoById, getResources } from '#/api/tb/resource';
import { getRuleChainById, getRuleChains } from '#/api/tb/rule-chain';
import { getTenantById, getTenantInfos } from '#/api/tb/tenant';
import {
  getTenantProfileInfoById,
  getTenantProfileInfos,
} from '#/api/tb/tenant-profile';
import { ResourceType } from '#/enums';

export interface EntityInputProps {
  entityType?: `${EntityType}`;
  multiple?: boolean;
  objectId?: boolean;
  valueField?: 'id' | 'name';
  excludeId?: string;
  params?: Record<string, unknown>;
}

type Entity = {
  id?: EntityId;
  name?: string;
  pkgName?: string;
  title?: string;
};
type EntityApi = {
  list: (page: PageLink & Record<string, unknown>) => Promise<PageData<Entity>>;
  read: (id: string) => Promise<Entity>;
};

type Option = { label: string; value: string };

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<EntityInputProps>(), {
  entityType: undefined,
  valueField: undefined,
  excludeId: undefined,
  params: () => ({}),
});
const emit = defineEmits<{
  change: [value: EntityId | string | string[] | undefined, option: unknown];
  search: [text: string];
  openChange: [open: boolean];
}>();
const value = defineModel<EntityId | null | string | string[]>();
const attrs = useAttrs();
const options = ref<Option[]>([]);
const loading = ref(false);
let request = 0;

const selected = computed(() =>
  typeof value.value === 'object' && !Array.isArray(value.value)
    ? value.value?.id
    : value.value,
);
const selectedValues = computed(() =>
  (Array.isArray(selected.value) ? selected.value : [selected.value]).filter(
    (item): item is string => !!item,
  ),
);

// 专用接口集中适配，其余实体使用统一查询。
const entityApis: Partial<Record<`${EntityType}`, EntityApi>> = {
  AI_MODEL: { list: getAiModels, read: getAiModelById },
  ASSET_PROFILE: { list: getAssetProfileInfos, read: getAssetProfileById },
  CUSTOMER: { list: getCustomers, read: getCustomerById },
  DASHBOARD: { list: getTenantDashboards, read: getDashboardInfoById },
  DEVICE_PROFILE: {
    list: getDeviceProfileInfos,
    read: getDeviceProfileInfoById,
  },
  MOBILE_APP: { list: getMobileApps, read: getMobileApp },
  NOTIFICATION_TARGET: {
    list: getNotificationTargets,
    read: getNotificationTargetById,
  },
  NOTIFICATION_TEMPLATE: {
    list: getNotificationTemplates,
    read: getNotificationTemplateById,
  },
  OAUTH2_CLIENT: { list: getOAuth2Clients, read: getOAuth2Client },
  QUEUE: { list: getQueues, read: getQueueById },
  RULE_CHAIN: {
    list: (page) => getRuleChains(page, page.type === 'EDGE' ? 'EDGE' : 'CORE'),
    read: getRuleChainById,
  },
  TB_RESOURCE: {
    list: (page) =>
      getResources({ ...page, resourceType: ResourceType.GENERAL }),
    read: getResourceInfoById,
  },
  TENANT: { list: getTenantInfos, read: getTenantById },
  TENANT_PROFILE: {
    list: getTenantProfileInfos,
    read: getTenantProfileInfoById,
  },
};

async function queryEntities(
  type: `${EntityType}`,
  page: EntityDataPageLink,
  ids?: string[],
): Promise<Entity[]> {
  const result = await findEntityDataByQuery({
    entityFilter: ids
      ? { type: 'entityList', entityType: type as EntityType, entityList: ids }
      : { type: 'entityType', entityType: type as EntityType },
    pageLink: page,
    entityFields: [{ type: 'ENTITY_FIELD', key: 'name' }],
  });
  return result.data.map((item) => ({
    id: item.entityId,
    name: item.latest.ENTITY_FIELD?.name?.value,
  }));
}

async function getEntityList(
  type: `${EntityType}`,
  params: Record<string, unknown>,
): Promise<Entity[]> {
  const page = { ...params, page: 0, pageSize: 500 };
  const api = entityApis[type];
  if (!api) return queryEntities(type, page);
  const result = await api.list(page);
  return result.data;
}

async function getEntitiesByIds(
  type: `${EntityType}`,
  ids: string[],
): Promise<Entity[]> {
  if (ids.length === 0) return [];
  const api = entityApis[type];
  if (!api) return queryEntities(type, { page: 0, pageSize: ids.length }, ids);
  const results = await Promise.allSettled(ids.map((id) => api.read(id)));
  return results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  );
}

function toOptions(items: Entity[]): Option[] {
  const byName = props.valueField === 'name';
  const result = new Map<string, Option>();
  for (const item of items) {
    if (!item.id?.id || item.id.id === props.excludeId) continue;
    const id = byName ? item.name : item.id.id;
    if (!id) continue;
    const label = byName ? id : item.pkgName || item.name || item.title || id;
    result.set(id, { value: id, label });
  }
  // 按名称保存时直接回显名称，不把名称当成 ID 查询。
  if (byName) {
    for (const name of selectedValues.value) {
      if (!result.has(name)) result.set(name, { value: name, label: name });
    }
  }
  return [...result.values()];
}

async function load(textSearch = '') {
  const current = ++request;
  const type = props.entityType;
  if (!type) {
    options.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const items = await getEntityList(type, { ...props.params, textSearch });
    if (current !== request) return;

    // 搜索结果可能不含已选实体，补查详情以保持编辑回显。
    if (props.valueField !== 'name') {
      const ids = new Set(items.map((item) => item.id?.id));
      const missing = selectedValues.value.filter((id) => !ids.has(id));
      items.push(...(await getEntitiesByIds(type, missing)));
    }
    if (current === request) {
      options.value = toOptions(items);
    }
  } catch {
    // 请求层提示错误，保留当前选项供用户继续操作。
  } finally {
    if (current === request) {
      loading.value = false;
    }
  }
}

const handleChange: SelectProps['onChange'] = (id, option) => {
  const next = id as string | string[] | undefined;
  value.value =
    props.objectId && typeof next === 'string' && props.entityType
      ? { id: next, entityType: props.entityType as EntityType }
      : next;
  emit('change', value.value, option);
};

// 搜索延迟执行前也校验序号，切换实体类型或卸载后不再发起旧搜索。
const search = useDebounceFn((text: string, version: number) => {
  if (version === request) {
    return load(text);
  }
}, 300);

function handleSearch(text: string) {
  emit('search', text);
  void search(text, ++request);
}

function handleOpen(open: boolean) {
  emit('openChange', open);
  if (open && !loading.value && options.value.length === 0) {
    void load();
  }
}

watch(
  [
    () => props.entityType,
    () => props.excludeId,
    () => props.valueField,
    // 表单重建相同参数对象时不重复请求，同时响应参数内容变化。
    () => JSON.stringify(props.params),
  ],
  (_current, previous) => {
    if (previous?.[0] && previous[0] !== props.entityType) {
      value.value = undefined;
    }
    options.value = [];
    void load();
  },
  { immediate: true },
);
watch(selectedValues, (ids) => {
  if (ids.some((id) => !options.value.some((option) => option.value === id))) {
    void load();
  }
});
onBeforeUnmount(() => {
  request++;
});
</script>

<template>
  <Select
    class="w-full"
    :filter-option="false"
    option-filter-prop="label"
    allow-clear
    v-bind="attrs"
    :value="selected ?? undefined"
    :options="options"
    :loading="loading || !!attrs.loading"
    :mode="multiple ? 'multiple' : undefined"
    @search="handleSearch"
    @change="handleChange"
    @open-change="handleOpen"
  />
</template>
