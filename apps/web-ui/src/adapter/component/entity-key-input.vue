<script setup lang="ts">
import type { SourceType } from './field-arguments/data';

import type { EntityFilter } from '#/api/tb/entity-query';
import type { EntityId } from '#/types/tb';

import { onBeforeUnmount, ref, watch } from 'vue';

import { AutoComplete } from 'antdv-next';

import { findAvailableEntityKeysByQueryV2 } from '#/api/tb/entity-query';
import { AttributeScope, EntityType } from '#/enums';

const props = defineProps<{
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  ownerId?: EntityId;
  sourceType?: SourceType;
  sourceId?: string;
  keyType?: string;
  scope?: string;
  predefinedEntityFilter?: EntityFilter;
}>();
const value = defineModel<string>('value');
const options = ref<{ value: string }[]>([]);
let request = 0;
watch(
  () => [
    props.entityType,
    props.entityId,
    props.entityName,
    props.ownerId?.entityType,
    props.ownerId?.id,
    props.sourceType,
    props.sourceId,
    props.keyType,
    props.scope,
    props.predefinedEntityFilter,
  ],
  async () => {
    const version = ++request;
    options.value = [];
    const sourceType = props.sourceType || 'CURRENT';
    let entityType: 'RELATION_PATH_QUERY' | EntityType | undefined;
    let entityId: string | undefined;
    if (sourceType === 'CURRENT') {
      entityType = props.entityType;
      entityId = props.entityId;
    } else if (sourceType === 'CURRENT_OWNER') {
      entityType = props.ownerId?.entityType;
      entityId = props.ownerId?.id;
    } else {
      entityType = sourceType;
      entityId = props.sourceId;
    }
    if (
      !props.predefinedEntityFilter &&
      (!entityType || !entityId || entityType === 'RELATION_PATH_QUERY')
    )
      return;
    let entityFilter: EntityFilter;
    if (props.predefinedEntityFilter) {
      entityFilter = props.predefinedEntityFilter;
    } else if (
      entityType === EntityType.DEVICE_PROFILE ||
      entityType === EntityType.ASSET_PROFILE
    ) {
      if (!props.entityName || props.entityName === entityId) return;
      entityFilter =
        entityType === EntityType.DEVICE_PROFILE
          ? { type: 'deviceType', deviceTypes: [props.entityName] }
          : { type: 'assetType', assetTypes: [props.entityName] };
    } else {
      if (!entityType || !entityId || entityType === 'RELATION_PATH_QUERY')
        return;
      entityFilter = {
        type: 'singleEntity',
        singleEntity: { entityType, id: entityId },
      };
    }
    const attribute = props.keyType === 'ATTRIBUTE';
    const scope =
      Object.values(AttributeScope).find((item) => item === props.scope) ??
      AttributeScope.SERVER_SCOPE;
    try {
      const keys = await findAvailableEntityKeysByQueryV2(
        { entityFilter, pageLink: { page: 0, pageSize: 100 } },
        {
          includeTimeseries: !attribute,
          includeAttributes: attribute,
          ...(attribute ? { scopes: [scope] } : {}),
        },
      );
      if (version === request)
        options.value = (
          attribute ? keys.attributes?.[scope] || [] : keys.timeseries || []
        ).map((item) => ({ value: item.key }));
    } catch {
      /* 键建议不可用时仍允许手动填写。 */
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  request++;
});
</script>

<template>
  <AutoComplete
    v-model:value="value"
    :options="options"
    :filter-option="
      (search, option) =>
        String(option?.value || '')
          .toLowerCase()
          .includes(search.toLowerCase())
    "
    :maxlength="255"
    allow-clear
  />
</template>
