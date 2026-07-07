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

const entityTypeSelectOptions = computed(() =>
  entityTypeOptions().filter((item) =>
    availableEntityTypes.value.includes(item.value),
  ),
);

const entitySelectValue = computed({
  get() {
    if (props.multiple) {
      return selectedEntityIds.value;
    }
    return selectedEntityIds.value[0] ?? undefined;
  },
  set(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      selectedEntityIds.value = value;
    } else if (value) {
      selectedEntityIds.value = [value];
    } else {
      selectedEntityIds.value = [];
    }
    emitValue();
  },
});

watch(
  () => modelValue.value,
  (value) => {
    const entities = toEntityArray(value);
    selectedEntityType.value =
      entities[0]?.entityType ??
      selectedEntityType.value ??
      availableEntityTypes.value[0];
    selectedEntityIds.value = entities
      .filter((entity) => entity.entityType === selectedEntityType.value)
      .map((entity) => entity.id);
  },
  { immediate: true },
);

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
      clearEntityValue();
    }
  },
  { immediate: true },
);

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

function clearEntityValue() {
  selectedEntityIds.value = [];
  emitValue();
}

function emitValue() {
  if (!selectedEntityType.value) {
    modelValue.value = undefined;
    emit('change', undefined);
    return;
  }

  const entities = selectedEntityIds.value.map((id) => ({
    entityType: selectedEntityType.value as EntityType,
    id,
  }));
  const nextValue = props.multiple ? entities : entities[0];
  modelValue.value = nextValue;
  emit('change', nextValue);
}

function handleEntityTypeChange(value: EntityType) {
  selectedEntityType.value = value;
  clearEntityValue();
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
      :disabled="disabled"
      :options="entityTypeSelectOptions"
      :placeholder="
        entityTypePlaceholder ?? $t('tb.relation.fields.relatedEntityType')
      "
      :value="selectedEntityType"
      class="w-30 shrink-0"
      show-search
      @change="handleEntityTypeChange"
    />
    <Select
      v-model:value="entitySelectValue"
      :disabled="disabled || !selectedEntityType"
      :loading="loading"
      :mode="multiple ? 'multiple' : undefined"
      :options="entityOptions"
      :placeholder="
        entityPlaceholder ?? $t('tb.relation.fields.relatedEntityId')
      "
      class="min-w-0 flex-1"
      option-filter-prop="label"
      show-search
    />
  </div>
</template>
