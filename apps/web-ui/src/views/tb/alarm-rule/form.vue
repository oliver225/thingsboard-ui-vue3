<script setup lang="ts">
import type {
  AlarmRuleFormData,
  AlarmRuleFormValues,
  AlarmRuleScriptTestRequest,
} from './form-data';

import type { ArgumentValues } from '#/adapter/component/field-arguments/data';
import type { TbUserInfo } from '#/api/core/user';
import type { AlarmRuleDefinition } from '#/api/tb/alarm-rule';
import type { AlarmSeverity } from '#/enums';
import type { EntityId } from '#/types/tb';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { cloneDeep } from '@vben/utils';

import { message, Select } from 'antdv-next';

import {
  getSourceEntityName,
  toArgumentFormValues,
  toArgumentPayload,
  validateArguments,
} from '#/adapter/component/field-arguments/data';
import FieldArguments from '#/adapter/component/field-arguments/index.vue';
import TbSwitch from '#/adapter/component/tb-switch.vue';
import { useVbenForm, z } from '#/adapter/form';
import {
  getAlarmRuleById,
  getLatestAlarmRuleDebugEvent,
  saveAlarmRule,
  testAlarmRuleScript,
} from '#/api/tb/alarm-rule';
import { getAssetById } from '#/api/tb/asset';
import { getDeviceById } from '#/api/tb/device';
import { FormSection } from '#/components/form-section';
import { EntityType } from '#/enums';
import { $t } from '#/locales';
import { useSystemStore } from '#/store';

import RuleEditor from './components/rule-editor.vue';
import {
  createDefaultAlarmRule,
  createDefaultAlarmRuleConfiguration,
  entityTypeOptions,
  severities,
  toAlarmRulePayload,
} from './form-data';
import { useFormNode } from './use-form-node';

const props = defineProps<{ entityId?: EntityId }>();
const emit = defineEmits<{ success: [] }>();
const formValues = ref(createDefaultAlarmRuleConfiguration());
const argumentValues = ref<ArgumentValues[]>([]);
const record = ref<AlarmRuleDefinition>();
const isReady = ref(false);
const loadError = ref('');
const saveError = ref('');
const contentRef = ref<HTMLElement>();
const ownerId = ref<EntityId>();
const entityName = ref<string>();
const systemStore = useSystemStore();
const systemParams = computed(() => systemStore.systemParams);
const userStore = useUserStore();
const propagationOpen = ref(false);
const entries = computed(() =>
  severities.flatMap((severity) => {
    const rule = formValues.value.createRules[severity];
    return rule ? [{ severity, rule }] : [];
  }),
);
const createRuleErrors = computed(() =>
  entries.value.length > 0 ? [] : [$t('alarm-rule.validation.create')],
);
const formNode = useFormNode(() => [
  ...argumentErrors.value,
  ...createRuleErrors.value,
]);
let session = 0;
const argumentNames = computed(() =>
  argumentValues.value.map((value) => value.name.trim()),
);
const [GeneralForm, generalApi] = useVbenForm<AlarmRuleFormValues>({
  layout: 'vertical',
  showDefaultActions: false,
  wrapperClass: 'alarm-general-grid',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-3',
  },
  schema: [
    {
      fieldName: 'name',
      formItemClass: 'alarm-name-field',
      component: 'VbenInput',
      label: $t('alarm-rule.fields.alarmType'),
      help: $t('alarm-rule.messages.nameHint'),
      rules: z
        .string()
        .trim()
        .min(1, $t('alarm-rule.validation.nameRequired'))
        .max(255),
      componentProps: { maxlength: 255 },
    },
    {
      fieldName: 'debugSettings',
      component: 'DebugSettingsButton',
      hideLabel: true,
      formItemClass: 'alarm-debug-field',
      componentProps: () => ({
        entityLabel: $t('alarm-rule.menu'),
      }),
    },
    {
      fieldName: 'entityType',
      formItemClass: 'alarm-entity-field',
      component: 'Select',
      label: $t('alarm-rule.fields.entityType'),
      rules: 'selectRequired',
      componentProps: () => ({
        options: entityTypeOptions(),
        disabled: !!props.entityId,
        onChange: handleEntityTypeChange,
      }),
    },
    {
      fieldName: 'entityId',
      formItemClass: 'alarm-entity-field',
      component: 'EntityInput',
      label: $t('alarm-rule.fields.entityName'),
      rules: 'selectRequired',
      componentProps: () => ({
        disabled: !!props.entityId,
        entityType: isReady.value ? selectedEntity.value.entityType : undefined,
        key: isReady.value ? selectedEntity.value.entityType : undefined,
        showSearch: true,
        onChange: (_value: unknown, option?: { label?: string }) => {
          entityName.value = option?.label;
          void updateOwner();
        },
      }),
    },
  ],
});
const selectedEntity = computed<EntityId>(() => ({
  entityType: isReady.value
    ? generalApi.form.values.entityType
    : EntityType.DEVICE_PROFILE,
  id: isReady.value ? generalApi.form.values.entityId : '',
}));
const argumentsDisabled = computed(
  () =>
    !isReady.value ||
    !selectedEntity.value.id ||
    !generalApi.form.values.name?.trim(),
);
const argumentOptions = computed(() => ({
  entityId: selectedEntity.value,
  entityName: entityName.value,
  ownerId: ownerId.value,
  allowRolling: true,
  maxArguments: systemParams.value?.maxArgumentsPerCF,
  maxDataPoints: systemParams.value?.maxDataPointsPerRollingArg,
}));
const argumentErrors = computed(() =>
  argumentValues.value.length > 0
    ? validateArguments(argumentValues.value, argumentOptions.value).map(
        (issue) => issue.message,
      )
    : [$t('alarm-rule.validation.arguments')],
);
const argumentsInvalid = computed(
  () => formNode.attempted.value && argumentErrors.value.length > 0,
);
function handleCreate() {
  const severity = severities.find(
    (value) => !formValues.value.createRules[value],
  );
  if (severity)
    formValues.value.createRules[severity] = createDefaultAlarmRule();
}
function handleSeverityChange(from: AlarmSeverity, to: AlarmSeverity) {
  if (
    from === to ||
    formValues.value.createRules[to] ||
    !severities.includes(to)
  )
    return;
  const { [from]: rule, ...remainingRules } = formValues.value.createRules;
  formValues.value.createRules = rule
    ? { ...remainingRules, [to]: rule }
    : remainingRules;
}
async function handleEntityTypeChange() {
  await generalApi.setFieldValue('entityId', '');
  entityName.value = undefined;
  await updateOwner();
}
async function updateOwner() {
  const current = session;
  const entity = { ...selectedEntity.value };
  ownerId.value = (userStore.userInfo as null | TbUserInfo)?.tbUser.tenantId;
  let customerId: EntityId | undefined;
  if (entity.id && entity.entityType === EntityType.DEVICE) {
    const device = await getDeviceById(entity.id);
    customerId = device.customerId ?? undefined;
  } else if (entity.id && entity.entityType === EntityType.ASSET) {
    const asset = await getAssetById(entity.id);
    customerId = asset.customerId ?? undefined;
  }
  if (
    current !== session ||
    selectedEntity.value.id !== entity.id ||
    selectedEntity.value.entityType !== entity.entityType
  )
    return;
  if (
    customerId?.id &&
    customerId.id !== '00000000-0000-0000-0000-000000000000'
  )
    ownerId.value = customerId;
}
// General fields use Vben's context. Business editors share these root-owned refs.
// Collect once after recursive validation, then serialize only the enabled modes.
async function toFormPayload(): Promise<AlarmRuleDefinition> {
  const generalFormValues = await generalApi.getValues();
  return toAlarmRulePayload(
    cloneDeep(generalFormValues),
    cloneDeep(formValues.value),
    toArgumentPayload(cloneDeep(argumentValues.value), {
      maxDataPoints: systemParams.value?.maxDataPointsPerRollingArg,
    }),
    cloneDeep(record.value),
  );
}
function handleTest(request: AlarmRuleScriptTestRequest) {
  const current = session;
  const id = record.value?.id?.id;
  if (!isReady.value) return;
  request.open({
    expression: request.expression,
    functionName: 'expression',
    arguments: cloneDeep(argumentValues.value),
    loadTestArguments: id
      ? async () => {
          const event = await getLatestAlarmRuleDebugEvent(id);
          const sample = event?.arguments
            ? JSON.parse(event.arguments)
            : undefined;
          return sample && typeof sample === 'object' && !Array.isArray(sample)
            ? sample
            : undefined;
        }
      : undefined,
    testRunner: testAlarmRuleScript,
    onApply: (value: string) => {
      if (session === current) request.onApply(value);
    },
  });
}
async function focusError() {
  await nextTick();
  const element = contentRef.value?.querySelector<HTMLElement>(
    '[aria-invalid="true"], [data-alarm-invalid]',
  );
  element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (
    element?.querySelector<HTMLElement>('input,button,[role="combobox"]') ??
    element
  )?.focus({
    preventScroll: true,
  });
}
const [Modal, modalApi] = useVbenModal<AlarmRuleFormData>({
  async onOpenChange(open) {
    const current = ++session;
    isReady.value = false;
    if (!open) return;
    modalApi.lock();
    modalApi.setState({ confirmDisabled: false });
    loadError.value = '';
    saveError.value = '';
    formNode.reset();
    propagationOpen.value = false;
    entityName.value = undefined;
    ownerId.value = undefined;
    try {
      const data = modalApi.getData() ?? {};
      const value = data.alarmRuleId
        ? await getAlarmRuleById(data.alarmRuleId)
        : data.value;
      if (current !== session) return;
      record.value = cloneDeep(value);
      formValues.value = cloneDeep({
        ...createDefaultAlarmRuleConfiguration(),
        ...value?.configuration,
      });
      formValues.value.createRules ??= {};
      argumentValues.value = toArgumentFormValues(formValues.value.arguments, {
        maxDataPoints: systemParams.value?.maxDataPointsPerRollingArg,
      });
      await generalApi.reset(
        {
          values: {
            name: value?.name ?? '',
            entityType:
              props.entityId?.entityType ??
              value?.entityId?.entityType ??
              EntityType.DEVICE_PROFILE,
            entityId: props.entityId?.id ?? value?.entityId?.id ?? '',
            debugSettings: {
              failuresEnabled: true,
              allEnabled: true,
              ...value?.debugSettings,
            },
          },
        },
        { force: true },
      );
      if (current !== session) return;
      const entityId = props.entityId ?? value?.entityId;
      const name = entityId?.id
        ? data.entityName ||
          (await getSourceEntityName(entityId).catch(() => entityId.id))
        : undefined;
      if (current !== session) return;
      entityName.value = name;
      isReady.value = true;
      modalApi.setState({
        title: data.alarmRuleId
          ? $t('alarm-rule.actions.edit')
          : $t('alarm-rule.actions.create'),
      });
      await updateOwner();
    } catch (error) {
      if (current === session) {
        loadError.value =
          error instanceof Error ? error.message : String(error);
        modalApi.setState({ confirmDisabled: true });
      }
    } finally {
      if (current === session) modalApi.unlock();
    }
  },
  async onConfirm() {
    if (!isReady.value || modalState.value.submitting || loadError.value)
      return;
    modalApi.lock();
    try {
      saveError.value = '';
      const nestedValid = formNode.validate();
      const { valid } = await generalApi.validate();
      if (!valid || !nestedValid) {
        await focusError();
        return;
      }
      await saveAlarmRule(await toFormPayload());
      message.success($t('tb.common.saveSuccess'));
      emit('success');
      modalApi.close();
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : String(error);
    } finally {
      modalApi.unlock();
    }
  },
});
const modalState = modalApi.useStore();
</script>
<template>
  <Modal
    class="h-[min(80%,calc(100dvh-20px))] w-[calc(100%_-_2rem)] max-w-4xl rounded-xl"
    content-class="px-6 pt-5 pb-1"
    :confirm-text="$t('tb.common.save')"
  >
    <div ref="contentRef" class="space-y-5">
      <FormSection size="small">
        <GeneralForm class="form-message-flow" />
      </FormSection>
      <template v-if="isReady">
        <FormSection
          size="small"
          :title="$t('alarm-rule.sections.arguments')"
          :class="{ 'border-destructive': argumentsInvalid }"
          :data-alarm-invalid="argumentsInvalid ? '' : undefined"
          tabindex="-1"
        >
          <FieldArguments
            v-model="argumentValues"
            v-bind="argumentOptions"
            :disabled="argumentsDisabled"
            watch-key-change
          />
          <p
            v-if="argumentsInvalid"
            role="alert"
            class="text-destructive mt-2 text-xs"
          >
            {{ argumentErrors[0] }}
          </p>
        </FormSection>
        <p
          v-if="!argumentValues.length"
          class="text-muted-foreground flex items-center gap-2 text-xs"
        >
          <IconifyIcon icon="lucide:info" class="size-4" />{{
            $t('alarm-rule.messages.addArgumentsFirst')
          }}
        </p>
        <fieldset
          :disabled="!argumentValues.length || modalState.submitting"
          :inert="!argumentValues.length || modalState.submitting"
          class="min-w-0 space-y-5"
          :class="{ 'opacity-60': !argumentValues.length }"
        >
          <div class="space-y-6">
            <section class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-semibold">
                  {{ $t('alarm-rule.sections.createConditions') }}
                  <span class="text-muted-foreground ml-1 font-normal">{{ entries.length }}/5</span>
                </h3>
                <VbenButton
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="entries.length === 5"
                  @click="handleCreate"
                >
                  <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />{{
                    $t('alarm-rule.actions.addCreate')
                  }}
                </VbenButton>
              </div>
              <FormSection
                v-if="!entries.length"
                class="bg-muted/20 border-dashed text-center"
                content-class="px-4 py-8"
                :data-alarm-invalid="formNode.attempted.value ? '' : undefined"
                tabindex="-1"
              >
                <IconifyIcon
                  icon="lucide:bell-plus"
                  class="text-muted-foreground mx-auto mb-2 size-6"
                />
                <p class="text-muted-foreground text-sm">
                  {{ $t('alarm-rule.messages.noCreate') }}
                </p>
              </FormSection>
              <p
                v-if="formNode.attempted.value && createRuleErrors[0]"
                role="alert"
                class="text-destructive text-xs"
              >
                {{ createRuleErrors[0] }}
              </p>
              <RuleEditor
                v-for="entry in entries"
                :key="entry.severity"
                :model-value="entry.rule"
                :severity="entry.severity"
                :used-severities="entries.map((item) => item.severity)"
                :argument-names="argumentNames"
                @update:model-value="
                  (value) => (formValues.createRules[entry.severity] = value)
                "
                @severity="
                  (value) => handleSeverityChange(entry.severity, value)
                "
                @remove="delete formValues.createRules[entry.severity]"
                @test="handleTest"
              />
            </section>
            <section class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-semibold">
                  {{ $t('alarm-rule.sections.clearCondition') }}
                  <span
                    class="text-muted-foreground ml-1 text-xs font-normal"
                    >{{ $t('alarm-rule.options.optional') }}</span>
                </h3>
                <VbenButton
                  v-if="!formValues.clearRule"
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="formValues.clearRule = createDefaultAlarmRule()"
                >
                  <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />{{
                    $t('alarm-rule.actions.addClear')
                  }}
                </VbenButton>
              </div>
              <RuleEditor
                v-if="formValues.clearRule"
                v-model="formValues.clearRule"
                :argument-names="argumentNames"
                @remove="formValues.clearRule = null"
                @test="handleTest"
              />
              <p
                v-else
                class="text-muted-foreground rounded-lg bg-muted/30 px-4 py-3 text-xs"
              >
                {{ $t('alarm-rule.messages.noClear') }}
              </p>
            </section>
          </div>
          <FormSection
            v-model:open="propagationOpen"
            collapsible
            size="small"
            :title="$t('alarm-rule.sections.propagation')"
          >
            <div class="divide-border divide-y">
              <div class="space-y-3 pb-4">
                <TbSwitch
                  v-model:checked="formValues.propagate"
                  :title="$t('alarm-rule.fields.propagate')"
                />
                <label
                  v-if="formValues.propagate"
                  class="block space-y-2 text-xs"
                  ><span>{{ $t('alarm-rule.fields.relationTypes') }}</span><Select
                    v-model:value="formValues.propagateRelationTypes"
                    mode="tags"
                    :options="[
                      { label: 'Contains', value: 'Contains' },
                      { label: 'Manages', value: 'Manages' },
                    ]"
                    :token-separators="[',', ';']"
                    class="w-full"
                    :aria-label="$t('alarm-rule.fields.relationTypes')"
                  /><span class="text-muted-foreground block">{{
                    $t('alarm-rule.messages.relationHint')
                  }}</span></label>
              </div>
              <div class="py-4">
                <TbSwitch
                  v-model:checked="formValues.propagateToOwner"
                  :title="$t('alarm-rule.fields.propagateOwner')"
                />
              </div>
              <div class="pt-4">
                <TbSwitch
                  v-model:checked="formValues.propagateToTenant"
                  :title="$t('alarm-rule.fields.propagateTenant')"
                />
              </div>
            </div>
          </FormSection>
        </fieldset>
      </template>
      <FormSection
        v-if="loadError || saveError"
        role="alert"
        size="small"
        class="border-destructive/30 bg-destructive/10 text-destructive text-sm"
      >
        {{ loadError || saveError }}
      </FormSection>
      <p
        v-else-if="formNode.invalid.value"
        role="alert"
        class="text-destructive text-sm"
      >
        {{ $t('alarm-rule.validation.summary') }}
      </p>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.alarm-general-grid) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 1rem;
}

:deep(.alarm-debug-field) {
  align-self: start;
  padding-top: 1.5rem;
}

:deep(.alarm-debug-field button[aria-expanded]) {
  width: 100%;
}

:deep(.alarm-entity-field) {
  grid-column: 1 / -1;
}

@media (min-width: 640px) {
  :deep(.alarm-general-grid) {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }

  :deep(.alarm-name-field) {
    grid-column: span 9;
  }

  :deep(.alarm-debug-field) {
    grid-column: span 3;
  }

  :deep(.alarm-entity-field) {
    grid-column: span 6;
  }
}
</style>
