<script lang="ts">
import type {
  CalculatedFieldDefinition,
  ConfigurationProps,
  ValidationIssue,
} from '../form-schema';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, markRaw } from 'vue';

import KeyInput from '#/adapter/component/entity-key-input.vue';
import {
  toSourceFormValues,
  toSourcePayload,
} from '#/adapter/component/field-arguments/data';
import FormField from '#/adapter/form-field.vue';
import { FormSection } from '#/components/form-section';
import { CalculatedFieldType } from '#/enums';
import { $t } from '#/locales';

import { createDefaultZoneFormValues } from '../form-data';
import ZoneGroups, { validateZoneValues } from './zone-groups.vue';

export const definition = {
  type: CalculatedFieldType.GEOFENCING,
  getValues: (config, limits) => ({
    latitudeKey: config.entityCoordinates?.latitudeKeyName ?? '',
    longitudeKey: config.entityCoordinates?.longitudeKeyName ?? '',
    scheduledUpdate: config.scheduledUpdateEnabled ?? true,
    scheduledUpdateInterval:
      config.scheduledUpdateInterval ??
      limits?.minAllowedScheduledUpdateIntervalInSecForCF ??
      60,
    zones: Object.entries(config.zoneGroups ?? {}).map(([name, zone]) => ({
      ...createDefaultZoneFormValues(),
      ...toSourceFormValues(zone),
      name,
      perimeterKeyName: zone.perimeterKeyName,
      reportStrategy: zone.reportStrategy,
      createRelationsWithMatchedZones: zone.createRelationsWithMatchedZones,
      direction: zone.direction ?? 'TO',
      relationType: zone.relationType ?? '',
    })),
  }),
  validate(formValues, limits) {
    const issues: ValidationIssue[] = [];
    if (!formValues.latitudeKey.trim())
      issues.push({
        fieldName: 'latitudeKey',
        message: $t('calculated-fields.validation.required'),
      });
    if (!formValues.longitudeKey.trim())
      issues.push({
        fieldName: 'longitudeKey',
        message: $t('calculated-fields.validation.required'),
      });
    if (formValues.zones.length === 0)
      issues.push({
        fieldName: 'zones',
        message: $t('calculated-fields.validation.zones'),
      });
    const maxItems = (limits?.maxArgumentsPerCF ?? 0) - 2;
    if (maxItems > 0 && formValues.zones.length > maxItems)
      issues.push({
        fieldName: 'zones',
        message: $t('calculated-fields.validation.maxItems', {
          count: maxItems,
        }),
      });
    formValues.zones.forEach((row, index) =>
      issues.push(
        ...validateZoneValues(
          row,
          limits?.maxRelationLevelPerCfArgument,
          formValues.zones.slice(0, index).map((other) => other.name.trim()),
        ).map((issue) => ({
          ...issue,
          fieldName: `zones[${index}].${issue.fieldName}`,
        })),
      ),
    );
    if (
      formValues.scheduledUpdate &&
      (!Number.isSafeInteger(formValues.scheduledUpdateInterval) ||
        formValues.scheduledUpdateInterval <
          (limits?.minAllowedScheduledUpdateIntervalInSecForCF ?? 1) ||
        formValues.scheduledUpdateInterval > Number.MAX_SAFE_INTEGER)
    )
      issues.push({
        fieldName: 'scheduledUpdateInterval',
        message: $t('calculated-fields.validation.range', {
          min: limits?.minAllowedScheduledUpdateIntervalInSecForCF ?? 1,
          max: Number.MAX_SAFE_INTEGER,
        }),
      });
    return issues;
  },
  toConfiguration: (formValues) => ({
    entityCoordinates: {
      latitudeKeyName: formValues.latitudeKey.trim(),
      longitudeKeyName: formValues.longitudeKey.trim(),
    },
    zoneGroups: Object.fromEntries(
      formValues.zones.map((zone) => [
        zone.name.trim(),
        {
          ...toSourcePayload(zone),
          perimeterKeyName: zone.perimeterKeyName.trim(),
          reportStrategy: zone.reportStrategy,
          createRelationsWithMatchedZones: zone.createRelationsWithMatchedZones,
          ...(zone.createRelationsWithMatchedZones
            ? {
                direction: zone.direction,
                relationType: zone.relationType.trim(),
              }
            : {}),
        },
      ]),
    ),
    scheduledUpdateEnabled: formValues.scheduledUpdate,
    scheduledUpdateInterval: formValues.scheduledUpdateInterval,
  }),
} satisfies CalculatedFieldDefinition;
</script>

<script setup lang="ts">
const props = defineProps<ConfigurationProps>();
const coordinatesFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, entityName } = props;
  return ['latitudeKey', 'longitudeKey'].map((fieldName) => ({
    fieldName,
    component: markRaw(KeyInput),
    modelPropName: 'value',
    label: $t(`calculated-fields.fields.${fieldName}`),
    rules: 'required',
    componentProps: {
      entityType: formValues.entityType,
      entityId: formValues.entityId,
      entityName,
      keyType: 'TS_LATEST',
    },
  }));
});
const zonesFields = computed<VbenFormSchema[]>(() => {
  const {
    values: formValues,
    limits,
    entityName,
    ownerId,
    validationField,
  } = props;
  return [
    {
      fieldName: 'zones',
      component: markRaw(ZoneGroups),
      modelPropName: 'modelValue',
      hideLabel: true,
      formItemClass: 'pb-0 sm:col-span-2',
      componentProps: {
        entityId: {
          entityType: formValues.entityType,
          id: formValues.entityId,
        },
        entityName,
        ownerId,
        maxRelationLevel: limits?.maxRelationLevelPerCfArgument,
        maxItems: limits?.maxArgumentsPerCF
          ? limits.maxArgumentsPerCF - 2
          : undefined,
        validationField,
      },
    },
  ];
});
const hasRelatedZones = computed(() =>
  props.values.zones.some((zone) => zone.sourceType === 'RELATION_PATH_QUERY'),
);
const schedulingFields = computed<VbenFormSchema[]>(() => {
  const { values: formValues, limits } = props;
  return [
    {
      fieldName: 'scheduledUpdate',
      component: 'TbSwitch',
      hideLabel: true,
      formItemClass: 'sm:col-span-2 pb-2',
      componentProps: {
        title: $t('calculated-fields.features.geofencing.refreshInterval'),
        help: $t('calculated-fields.features.geofencing.refreshHelp'),
        class: 'bg-muted/40',
      },
    },
    ...[
      {
        fieldName: 'scheduledUpdateInterval',
        component: 'SecondsInput',
        modelPropName: 'modelValue',
        label: $t('calculated-fields.fields.scheduledUpdateInterval'),
        componentProps: {
          min: limits?.minAllowedScheduledUpdateIntervalInSecForCF ?? 1,
          class: 'w-full',
          disabled: !formValues.scheduledUpdate,
          'aria-label': $t('calculated-fields.fields.scheduledUpdateInterval'),
        },
      },
    ],
  ];
});
</script>

<template>
  <div class="space-y-4">
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.coordinates')"
      :description="$t('calculated-fields.features.geofencing.coordinatesHelp')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in coordinatesFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      size="small"
      :title="$t('calculated-fields.sections.zones')"
      :description="$t('calculated-fields.features.geofencing.zonesHelp')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in zonesFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
    <FormSection
      v-if="hasRelatedZones"
      size="small"
      :title="$t('calculated-fields.sections.scheduling')"
    >
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField
          v-for="field in schedulingFields"
          :key="field.fieldName"
          :schema="field"
        />
      </div>
    </FormSection>
  </div>
</template>
