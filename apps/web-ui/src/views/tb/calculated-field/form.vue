<script lang="ts" setup>
import type { Component } from 'vue';

import type { CalculatedFieldFormValues } from './form-data';
import type { CalculatedFieldDefinition } from './form-schema';

import type { ScriptTestData } from '#/adapter/component/script-test/types';
import type { TbUserInfo } from '#/api/core/user';
import type { CalculatedField } from '#/api/tb/calculated-field';
import type { EntityId } from '#/types/tb';

import { computed, markRaw, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vben-core/shadcn-ui';

import { Alert, message, Segmented } from 'antdv-next';

import { getSourceEntityName } from '#/adapter/component/field-arguments/data';
import ScriptTest from '#/adapter/component/script-test/index.vue';
import { useVbenForm } from '#/adapter/form';
import FormField from '#/adapter/form-field.vue';
import { getAssetById } from '#/api/tb/asset';
import {
  getCalculatedFieldById,
  getLatestCalculatedFieldDebugEvent,
  saveCalculatedField,
} from '#/api/tb/calculated-field';
import { getDeviceById } from '#/api/tb/device';
import { FormSection } from '#/components/form-section';
import { SYS_TENANT_ID } from '#/constants';
import {
  CalculatedFieldType,
  calculatedFieldTypeLabel,
  EntityType,
} from '#/enums';
import { $t } from '#/locales';
import { useSystemStore } from '#/store';

import entityAggregationComponent, {
  definition as entityAggregationConfiguration,
} from './configurations/entity-aggregation.vue';
import geofencingComponent, {
  definition as geofencingConfiguration,
} from './configurations/geofencing.vue';
import propagationComponent, {
  definition as propagationConfiguration,
} from './configurations/propagation.vue';
import relatedEntitiesAggregationComponent, {
  definition as relatedEntitiesAggregationConfiguration,
} from './configurations/related-entities-aggregation.vue';
import scriptComponent, {
  definition as scriptConfiguration,
} from './configurations/script.vue';
import simpleComponent, {
  definition as simpleConfiguration,
} from './configurations/simple.vue';
import {
  getTypeOptions,
  toCalculatedFieldFormValues,
  toCalculatedFieldPayload,
} from './form-data';
import {
  createGeneralFields,
  createOutputFields,
  createStrategyFields,
  validateCommonValues,
} from './form-schema';
const props = defineProps<{ entityId?: EntityId }>();
const emit = defineEmits<{
  success: [];
}>();
const route = useRoute();
const typeOptions = computed(getTypeOptions);
const record = ref<CalculatedField | null>(null);
const importedField = ref<CalculatedField>();
const entityName = ref<string>();
const isReady = ref(false);
const systemStore = useSystemStore();
const validationError = ref('');
const validationField = ref('');
const userStore = useUserStore();
const ownerId = ref<EntityId>();
let ownerRequest = 0;
const [TestModal, testModalApi] = useVbenModal({
  connectedComponent: ScriptTest,
  destroyOnClose: true,
});
const [Form, formApi] = useVbenForm<CalculatedFieldFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-4',
  },
  wrapperClass: 'grid-cols-1 gap-4',
  showDefaultActions: false,
  schema: [
    {
      fieldName: '_general',
      component: 'VbenInput',
      hideLabel: true,
      formItemClass: 'pb-0',
    },
    {
      fieldName: 'type',
      component: 'VbenInput',
      label: $t('calculated-fields.fields.type'),
      rules: 'selectRequired',
    },
    {
      fieldName: '_configuration',
      component: 'VbenInput',
      hideLabel: true,
      formItemClass: 'pb-0',
    },
  ],
});
const generalFields = computed(() =>
  createGeneralFields({
    disabled: !!record.value || !!props.entityId,
    entityType: isReady.value ? formApi.form.values.entityType : undefined,
    onEntityTypeChange: handleEntityTypeChange,
    onEntityChange: (_value, option) => {
      entityName.value = option?.label;
      void loadOwner();
    },
  }),
);
async function loadOwner() {
  const version = ++ownerRequest;
  const tenantId = (userStore.userInfo as null | TbUserInfo)?.tbUser.tenantId;
  ownerId.value = tenantId;
  const formValues = await formApi.getValues();
  if (
    !formValues.entityId ||
    ![EntityType.ASSET, EntityType.DEVICE].includes(formValues.entityType)
  )
    return;
  try {
    const entity = await (formValues.entityType === EntityType.DEVICE
      ? getDeviceById(formValues.entityId)
      : getAssetById(formValues.entityId));
    if (version !== ownerRequest) return;
    ownerId.value =
      entity.customerId?.id && entity.customerId.id !== SYS_TENANT_ID
        ? entity.customerId
        : (entity.tenantId ?? tenantId);
  } catch {
    /* Entity owner suggestions are optional. */
  }
}
async function handleEntityTypeChange() {
  ++ownerRequest;
  ownerId.value = undefined;
  await formApi.setFieldValue('entityId', '');
  await formApi.setFieldValue('outputScope', 'SERVER_SCOPE');
  entityName.value = undefined;
}
async function handleTypeChange(value: unknown) {
  const type = typeOptions.value.find(
    (option) => option.value === value,
  )?.value;
  const previous = await formApi.getValues();
  if (!type || type === previous.type) return;
  void handleTestScript();
  await formApi.reset(
    {
      values: {
        ...toCalculatedFieldFormValues(
          getDefinition(type),
          undefined,
          systemStore.systemParams,
          previous,
        ),
        name: previous.name,
        entityType: previous.entityType,
        entityId: previous.entityId,
        debugSettings: previous.debugSettings,
      },
    },
    { force: true },
  );
  await clearCalculatedFieldValidation();
}
async function clearCalculatedFieldValidation() {
  validationError.value = '';
  validationField.value = '';
  await nextTick();
  await formApi.clearValidation();
}
async function handleConfigurationChange(field: string, value: unknown) {
  await formApi.setFieldValue(field, value);
  await clearCalculatedFieldValidation();
}
function handleTestScript(request?: ScriptTestData) {
  if (!request) {
    void testModalApi.close();
    return;
  }
  const id = record.value?.id?.id;
  testModalApi
    .setData({
      ...request,
      loadTestArguments:
        request.loadTestArguments ??
        (id
          ? async () => {
              const event = await getLatestCalculatedFieldDebugEvent(id);
              const sample = event?.arguments
                ? JSON.parse(event.arguments)
                : undefined;
              return sample &&
                typeof sample === 'object' &&
                !Array.isArray(sample)
                ? sample
                : undefined;
            }
          : undefined),
    })
    .open();
}
async function resetCalculatedFieldForm() {
  record.value = null;
  importedField.value = undefined;
  validationError.value = '';
  await formApi.reset(
    {
      values: toCalculatedFieldFormValues(simpleConfiguration),
    },
    { force: true },
  );
  validationField.value = '';
}
async function getValidatedFormValues() {
  validationError.value = '';
  validationField.value = '';
  const formValues = await formApi.getValues();
  const { valid, errors } = await formApi.validate();
  const definition = getDefinition(formValues.type);
  const issues = [
    ...validateCommonValues(formValues, definition.output),
    ...definition.validate(formValues, systemStore.systemParams),
  ];
  for (const issue of issues)
    await formApi.setFieldError(issue.fieldName, issue.message);
  const first = issues[0];
  if (!valid || first) {
    validationError.value =
      first?.message ||
      Object.values(errors)[0] ||
      $t('calculated-fields.validation.required');
    validationField.value =
      first?.fieldName || Object.keys(errors)[0] || '_configuration';
    await nextTick();
    formApi.scrollToFirstError(
      /^(arguments|zones|metrics)\[/.test(validationField.value)
        ? '_configuration'
        : validationField.value,
    );
    return null;
  }
  return formValues;
}
const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    const current = ++ownerRequest;
    if (!isOpen) {
      isReady.value = false;
      void handleTestScript();
      return;
    }
    isReady.value = false;
    entityName.value = undefined;
    await resetCalculatedFieldForm();
    modalApi.lock();
    try {
      const data = (modalApi.getData() ?? {}) as {
        calculatedFieldId?: string;
        entityName?: string;
        value?: CalculatedField;
      };
      record.value = data.calculatedFieldId
        ? await getCalculatedFieldById(data.calculatedFieldId)
        : null;
      importedField.value = data.value;
      const field = record.value ?? data.value;
      const entityId = props.entityId ?? field?.entityId;
      await formApi.reset(
        {
          values: {
            ...toCalculatedFieldFormValues(
              getDefinition(field?.type ?? CalculatedFieldType.SIMPLE),
              field,
              systemStore.systemParams,
            ),
            ...(entityId && {
              entityType: entityId.entityType,
              entityId: entityId.id,
            }),
          },
        },
        { force: true },
      );
      const name = entityId?.id
        ? data.entityName ||
          (await getSourceEntityName(entityId).catch(() => entityId.id))
        : undefined;
      if (current !== ownerRequest) return;
      entityName.value = name;
      modalApi.setState({
        title: record.value
          ? $t('calculated-fields.actions.edit')
          : $t('calculated-fields.actions.create'),
      });
      isReady.value = true;
      await loadOwner();
    } catch {
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  async onConfirm() {
    if (modalState.value.submitting) return;
    modalApi.lock();
    try {
      const formValues = await getValidatedFormValues();
      if (!formValues) return;

      await saveCalculatedField(
        toCalculatedFieldPayload(
          getDefinition(formValues.type),
          formValues,
          record.value,
          importedField.value,
          systemStore.systemParams,
        ),
      );
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
const configurations: Partial<
  Record<
    CalculatedFieldType,
    CalculatedFieldDefinition & { component: Component }
  >
> = {
  [CalculatedFieldType.SIMPLE]: {
    ...simpleConfiguration,
    component: markRaw(simpleComponent),
  },
  [CalculatedFieldType.SCRIPT]: {
    ...scriptConfiguration,
    component: markRaw(scriptComponent),
  },
  [CalculatedFieldType.PROPAGATION]: {
    ...propagationConfiguration,
    component: markRaw(propagationComponent),
  },
  [CalculatedFieldType.GEOFENCING]: {
    ...geofencingConfiguration,
    component: markRaw(geofencingComponent),
  },
  [CalculatedFieldType.ENTITY_AGGREGATION]: {
    ...entityAggregationConfiguration,
    component: markRaw(entityAggregationComponent),
  },
  [CalculatedFieldType.RELATED_ENTITIES_AGGREGATION]: {
    ...relatedEntitiesAggregationConfiguration,
    component: markRaw(relatedEntitiesAggregationComponent),
  },
};
function getDefinition(type: CalculatedFieldType) {
  const definition = configurations[type];
  if (!definition) throw new Error($t('calculated-fields.validation.type'));
  return definition;
}
const strategyOpen = ref(true);
const strategyTabs = computed(() =>
  ['IMMEDIATE', 'RULE_CHAIN'].map((value) => ({
    value,
    label: $t(`calculated-fields.options.${value}`),
  })),
);
const modalState = modalApi.useStore();

watch(validationField, (field) => {
  if (['strategyType', 'ttl'].includes(field)) strategyOpen.value = true;
});
</script>

<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          v-if="typeof route.meta.icon === 'string'"
          :icon="route.meta.icon"
          class="size-5 shrink-0"
          aria-hidden="true"
        />
        {{ modalState.title }}
      </span>
    </template>
    <Form class="calculated-field-form form-message-flow">
      <template #_general>
        <div class="w-full">
          <div
            class="grid grid-cols-1 gap-x-4 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <FormField
              v-for="field in generalFields.slice(0, 2)"
              :key="field.fieldName"
              :schema="field"
            />
          </div>
          <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <FormField
              v-for="field in generalFields.slice(2)"
              :key="field.fieldName"
              :schema="field"
            />
          </div>
        </div>
      </template>
      <template #type="{ componentField }">
        <Select
          :model-value="componentField.modelValue"
          :disabled="!!record"
          @update:model-value="handleTypeChange"
        >
          <SelectTrigger class="h-10 w-full" @blur="componentField.onBlur">
            <SelectValue :placeholder="$t('ui.placeholder.select')">
              {{ calculatedFieldTypeLabel(componentField.modelValue) }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent class="w-[var(--reka-select-trigger-width)]">
            <SelectItem
              v-for="option in typeOptions"
              :key="option.value"
              :value="option.value"
              :text-value="option.label"
              class="py-2.5"
            >
              <span class="flex min-w-0 flex-col gap-1">
                <span class="font-medium leading-5">{{ option.label }}</span>
                <span
                  class="text-muted-foreground whitespace-normal text-xs leading-5"
                >
                  {{
                    $t(
                      `calculated-fields.messages.typeDescriptions.${option.value}`,
                    )
                  }}
                </span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </template>
      <template #_configuration="{ values: formValues }">
        <fieldset
          v-if="formValues.type"
          :disabled="!formValues.entityId"
          :inert="!formValues.entityId"
          class="w-full min-w-0 space-y-4"
        >
          <component
            :is="getDefinition(formValues.type).component"
            :key="formValues.type"
            :values="formValues"
            :limits="systemStore.systemParams"
            :entity-name="entityName"
            :owner-id="ownerId"
            :validation-field="validationField"
            @change="handleConfigurationChange"
            @test="handleTestScript"
          />
          <FormSection
            size="small"
            :title="$t('calculated-fields.sections.output')"
            :description="$t('calculated-fields.messages.outputHint')"
          >
            <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <FormField
                v-for="field in createOutputFields(
                  formValues,
                  getDefinition(formValues.type).output,
                )"
                :key="field.fieldName"
                :schema="field"
              />
            </div>
            <FormSection
              size="small"
              v-model:open="strategyOpen"
              class="calculated-field-strategy"
              :class="{
                'calculated-field-strategy--rule-chain':
                  formValues.strategyType === 'RULE_CHAIN',
              }"
              :collapsible="formValues.strategyType === 'IMMEDIATE'"
              :title="$t('calculated-fields.sections.strategy')"
              :description="$t('calculated-fields.messages.strategyHint')"
              actions-position="left"
            >
              <template #actions>
                <Segmented
                  :value="formValues.strategyType"
                  :options="strategyTabs"
                  :aria-label="$t('calculated-fields.sections.strategy')"
                  shape="round"
                  size="medium"
                  class="calculated-field-strategy-tabs"
                  @change="
                    (value) => {
                      strategyOpen = true;
                      handleConfigurationChange('strategyType', value);
                    }
                  "
                />
              </template>
              <div
                v-if="formValues.strategyType === 'IMMEDIATE'"
                class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
              >
                <FormField
                  v-for="field in createStrategyFields(formValues)"
                  :key="field.fieldName"
                  :schema="field"
                />
              </div>
            </FormSection>
          </FormSection>
        </fieldset>
      </template>
    </Form>
    <Alert
      v-if="validationError"
      class="mt-4"
      type="error"
      show-icon
      :message="validationError"
    />
    <TestModal />
  </Modal>
</template>

<style scoped>
.calculated-field-strategy :deep(.form-section-header) {
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.calculated-field-strategy :deep(.form-section-header > h3) {
  flex-basis: 20rem;
  padding-top: 4px;
}

.calculated-field-strategy--rule-chain :deep(.form-section-content) {
  display: none;
}

.calculated-field-strategy-tabs {
  background: hsl(var(--muted));
}

.calculated-field-strategy-tabs :deep(.ant-segmented-item-label) {
  min-width: 56px;
  padding-inline: 12px;
  font-size: 12px;
}

.calculated-field-strategy-tabs :deep(.ant-segmented-item-selected),
.calculated-field-strategy-tabs :deep(.ant-segmented-thumb) {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  box-shadow: none;
}
</style>
