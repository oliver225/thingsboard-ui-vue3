<script setup lang="ts">
import type { SelectProps } from 'antdv-next';

import type { TbUserInfo } from '#/api/core/user';
import type { EntityId } from '#/types/tb';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { useUserStore } from '@vben/stores';

import { Select } from 'antdv-next';

import { getCustomerAssetInfos, getTenantAssetInfos } from '#/api/tb/asset';
import { getCustomerById, getCustomers } from '#/api/tb/customer';
import { getCustomerDashboards, getTenantDashboards } from '#/api/tb/dashboard';
import { getCustomerDeviceInfos, getTenantDeviceInfos } from '#/api/tb/device';
import { getCustomerEdgeInfos, getTenantEdgeInfos } from '#/api/tb/edge';
import {
  getCustomerEntityViewInfos,
  getTenantEntityViewInfos,
} from '#/api/tb/entity-view';
import { getRuleChains } from '#/api/tb/rule-chain';
import { getTenantInfos } from '#/api/tb/tenant';
import { getUsers } from '#/api/tb/user';
import { Authority, EntityType, entityTypeOptions } from '#/enums';
import { $t } from '#/locales';

interface Props {
  additionEntityTypes?: EntityType[];
  allowedEntityTypes?: EntityType[];
  class?: any;
  disabled?: boolean;
  entityPlaceholder?: string;
  entityTypePlaceholder?: string;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  additionEntityTypes: () => [],
  allowedEntityTypes: undefined,
  class: undefined,
  entityPlaceholder: undefined,
  entityTypePlaceholder: undefined,
  multiple: true,
});

const emit = defineEmits<{
  change: [EntityId | EntityId[] | undefined];
}>();

const modelValue = defineModel<EntityId | EntityId[] | undefined>('value');

const userStore = useUserStore();
const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);
const isTenantAdmin = hasAccessByRoles([Authority.TENANT_ADMIN]);
const isCustomerUser = hasAccessByRoles([Authority.CUSTOMER_USER]);
const customerId = computed(
  () => (userStore.userInfo as null | TbUserInfo)?.tbUser?.customerId?.id ?? '',
);
const tenantId = computed(
  () => (userStore.userInfo as null | TbUserInfo)?.tbUser?.tenantId?.id ?? '',
);

const selectedEntityType = ref<EntityType>();
const selectedEntityIds = ref<string[]>([]);
const entityOptions = ref<SelectProps['options']>([]);
const loading = ref(false);

const availableEntityTypes = computed(() => {
  const baseTypes = (() => {
    if (isSysAdmin) {
      return [EntityType.TENANT];
    }

    const types = [
      EntityType.DEVICE,
      EntityType.ASSET,
      EntityType.ENTITY_VIEW,
      EntityType.CUSTOMER,
      EntityType.USER,
      EntityType.DASHBOARD,
      EntityType.EDGE,
    ];
    if (isTenantAdmin) {
      types.push(EntityType.TENANT);
    }
    return types;
  })();

  const mergedTypes = [...baseTypes, ...props.additionEntityTypes];
  const uniqueTypes = [...new Set(mergedTypes)];
  if (!props.allowedEntityTypes?.length) {
    return uniqueTypes;
  }
  return uniqueTypes.filter((type) => props.allowedEntityTypes?.includes(type));
});

// 仅当可选实体类型多于一个时才展示类型下拉(对齐 ui-ngx displayEntityTypeSelect);
// 单一类型时锁定为该类型,实体下拉独占整行。
const displayEntityTypeSelect = computed(
  () => availableEntityTypes.value.length > 1,
);

const entityTypeSelectOptions = computed(() =>
  entityTypeOptions().filter((item) =>
    availableEntityTypes.value.includes(item.value),
  ),
);

const entitySelectValue = computed({
  get() {
    return props.multiple
      ? selectedEntityIds.value
      : (selectedEntityIds.value[0] ?? undefined);
  },
  set(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      selectedEntityIds.value = value;
    } else {
      selectedEntityIds.value = value ? [value] : [];
    }
    emitValue();
  },
});

// 外部 value 变化 → 同步内部状态;跳过由 emitValue 回写自身触发的“回声”(对齐 ui-ngx compareIds)。
watch(
  modelValue,
  (value) => {
    const entities = toEntityArray(value);
    const incomingType = entities[0]?.entityType;
    const incomingIds = entities.map((entity) => entity.id);
    if (
      incomingType === selectedEntityType.value &&
      isSameIds(incomingIds, selectedEntityIds.value)
    ) {
      return;
    }
    selectedEntityType.value =
      incomingType ?? selectedEntityType.value ?? availableEntityTypes.value[0];
    selectedEntityIds.value =
      incomingType === selectedEntityType.value ? incomingIds : [];
  },
  { immediate: true },
);

// 可选类型集合变化时,保持已选类型有效,否则回落到首个类型。
watch(
  availableEntityTypes,
  (types) => {
    if (types.length === 0) {
      selectedEntityType.value = undefined;
      return;
    }
    if (
      !selectedEntityType.value ||
      !types.includes(selectedEntityType.value)
    ) {
      selectedEntityType.value = types[0];
      selectedEntityIds.value = [];
      emitValue();
    }
  },
  { immediate: true },
);

// 类型变化即重新加载实体候选。
watch(
  selectedEntityType,
  async (type) => {
    if (!type) {
      entityOptions.value = [];
      return;
    }
    await loadEntityOptions(type);
  },
  { immediate: true },
);

function toEntityArray(value: EntityId | EntityId[] | undefined) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function isSameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function toOptions<T extends { id?: EntityId; name?: string; title?: string }>(
  rows: T[],
) {
  return rows
    .map((item) => ({
      label: item.title || item.name || item.id?.id,
      value: item.id?.id,
    }))
    .filter((item) => item.value);
}

// 无选中项时对外发 undefined(对齐 ui-ngx 返回 null),使 required 校验能正确触发。
function emitValue() {
  let nextValue: EntityId | EntityId[] | undefined;
  if (selectedEntityType.value && selectedEntityIds.value.length > 0) {
    const entities = selectedEntityIds.value.map((id) => ({
      entityType: selectedEntityType.value as EntityType,
      id,
    }));
    nextValue = props.multiple ? entities : entities[0];
  }
  modelValue.value = nextValue;
  emit('change', nextValue);
}

// 用户切换类型:清空已选实体(对齐 ui-ngx reset)。
function handleEntityTypeChange(value: EntityType) {
  selectedEntityType.value = value;
  selectedEntityIds.value = [];
  emitValue();
}

async function loadEntityOptions(type: EntityType) {
  loading.value = true;
  const defaultPageLink = {
    page: 0,
    pageSize: 100,
    sortOrder: 'ASC' as const,
    sortProperty: 'name',
  };

  try {
    switch (type) {
      case EntityType.ASSET: {
        const pageData =
          isCustomerUser && customerId.value
            ? await getCustomerAssetInfos(customerId.value, defaultPageLink)
            : await getTenantAssetInfos(defaultPageLink);
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.CUSTOMER: {
        if (isCustomerUser && customerId.value) {
          const customer = await getCustomerById(customerId.value);
          entityOptions.value = toOptions([customer]);
          break;
        }
        const pageData = await getCustomers({
          ...defaultPageLink,
          sortProperty: 'title',
        });
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.DASHBOARD: {
        const dashboardPageLink = {
          ...defaultPageLink,
          sortProperty: 'title',
        };
        const pageData =
          isCustomerUser && customerId.value
            ? await getCustomerDashboards(customerId.value, dashboardPageLink)
            : await getTenantDashboards(dashboardPageLink);
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.EDGE: {
        const pageData =
          isCustomerUser && customerId.value
            ? await getCustomerEdgeInfos(customerId.value, defaultPageLink)
            : await getTenantEdgeInfos(defaultPageLink);
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.ENTITY_VIEW: {
        const pageData =
          isCustomerUser && customerId.value
            ? await getCustomerEntityViewInfos(
                customerId.value,
                defaultPageLink,
              )
            : await getTenantEntityViewInfos(defaultPageLink);
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.RULE_CHAIN: {
        const pageData = await getRuleChains(defaultPageLink);
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.TENANT: {
        if (isTenantAdmin && tenantId.value) {
          entityOptions.value = [
            {
              label: tenantId.value,
              value: tenantId.value,
            },
          ];
          break;
        }
        const pageData = await getTenantInfos({
          ...defaultPageLink,
          sortProperty: 'title',
        });
        entityOptions.value = toOptions(pageData.data);
        break;
      }
      case EntityType.USER: {
        const pageData = await getUsers({
          ...defaultPageLink,
          sortProperty: 'email',
        });
        entityOptions.value = toOptions(
          pageData.data.map((item) => ({ ...item, name: item.email })),
        );
        break;
      }
      default: {
        const pageData =
          isCustomerUser && customerId.value
            ? await getCustomerDeviceInfos(customerId.value, defaultPageLink)
            : await getTenantDeviceInfos(defaultPageLink);
        entityOptions.value = toOptions(pageData.data);
      }
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div :class="props.class" class="flex w-full items-center gap-2">
    <Select
      v-if="displayEntityTypeSelect"
      :disabled="disabled"
      :options="entityTypeSelectOptions"
      :placeholder="
        entityTypePlaceholder ?? $t('tb.relation.fields.relatedEntityType')
      "
      :value="selectedEntityType"
      class="w-30 shrink-0"
      option-filter-prop="label"
      show-search
      @change="handleEntityTypeChange"
    />
    <Select
      v-if="selectedEntityType"
      v-model:value="entitySelectValue"
      :disabled="disabled"
      :loading="loading"
      :mode="multiple ? 'multiple' : undefined"
      :options="entityOptions"
      :placeholder="
        entityPlaceholder ?? $t('tb.relation.fields.relatedEntityId')
      "
      allow-clear
      class="min-w-0 flex-1"
      option-filter-prop="label"
      show-search
    />
  </div>
</template>
