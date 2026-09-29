<script lang="ts" setup>
import type { Component } from 'vue';

import type { EscalationFormValues, TriggerFormApi } from './form-data';

import type { NotificationRule } from '#/api/tb/notification-rule';

import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { InputNumber, message, Steps } from 'antdv-next';

import { EntityInput } from '#/adapter/component';
import { useVbenForm, z } from '#/adapter/form';
import {
  getNotificationRuleById,
  saveNotificationRule,
} from '#/api/tb/notification-rule';
import {
  Authority,
  EntityType,
  NotificationRuleTriggerType,
  notificationRuleTriggerTypeLabel,
  notificationRuleTriggerTypeOptions,
} from '#/enums';
import { $t } from '#/locales';

import RecipientForm from '../recipients/form.vue';
import TemplateForm from '../templates/form.vue';
import {
  isAllowedTriggerType,
  toEscalationFormValues,
  toEscalationPayload,
} from './form-data';

interface RuleFormValues {
  name: string;
  enabled: boolean;
  triggerType: NotificationRuleTriggerType;
  templateId: string;
  targets: string[];
  description: string;
}

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);
const record = ref<NotificationRule | null>(null);
const currentStep = ref(0);
const contentRef = ref<HTMLDivElement>();
const isCopy = ref(false);
const isReady = ref(false);
const optionsVersion = ref(0);
const escalations = ref<EscalationFormValues[]>(toEscalationFormValues());
const escalationError = ref('');
const triggerForm = ref<TriggerFormApi>();

const triggerForms: Record<NotificationRuleTriggerType, Component> = {
  ALARM: defineAsyncComponent(() => import('./triggers/alarm.vue')),
  ALARM_ASSIGNMENT: defineAsyncComponent(
    () => import('./triggers/alarm-assignment.vue'),
  ),
  ALARM_COMMENT: defineAsyncComponent(
    () => import('./triggers/alarm-comment.vue'),
  ),
  API_USAGE_LIMIT: defineAsyncComponent(
    () => import('./triggers/api-usage-limit.vue'),
  ),
  DEVICE_ACTIVITY: defineAsyncComponent(
    () => import('./triggers/device-activity.vue'),
  ),
  EDGE_COMMUNICATION_FAILURE: defineAsyncComponent(
    () => import('./triggers/edge-communication-failure.vue'),
  ),
  EDGE_CONNECTION: defineAsyncComponent(
    () => import('./triggers/edge-connection.vue'),
  ),
  ENTITIES_LIMIT: defineAsyncComponent(
    () => import('./triggers/entities-limit.vue'),
  ),
  ENTITY_ACTION: defineAsyncComponent(
    () => import('./triggers/entity-action.vue'),
  ),
  NEW_PLATFORM_VERSION: defineAsyncComponent(
    () => import('./triggers/new-platform-version.vue'),
  ),
  RATE_LIMITS: defineAsyncComponent(() => import('./triggers/rate-limits.vue')),
  RESOURCES_SHORTAGE: defineAsyncComponent(
    () => import('./triggers/resources-shortage.vue'),
  ),
  RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT: defineAsyncComponent(
    () => import('./triggers/rule-engine-lifecycle.vue'),
  ),
  TASK_PROCESSING_FAILURE: defineAsyncComponent(
    () => import('./triggers/task-processing-failure.vue'),
  ),
};

const [RecipientModal, recipientModalApi] = useVbenModal({
  connectedComponent: RecipientForm,
  destroyOnClose: true,
});
const [TemplateModal, templateModalApi] = useVbenModal({
  connectedComponent: TemplateForm,
  destroyOnClose: true,
});

const [Form, formApi] = useVbenForm<RuleFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  scrollToFirstError: true,
  schema: [
    {
      component: 'VbenInput',
      fieldName: 'name',
      defaultValue: '',
      label: $t('notification.features.rule.fields.name'),
      componentProps: {
        placeholder: $t('notification.features.rule.form.namePlaceholder'),
      },
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t('notification.features.rule.validation.nameRequired'),
        }),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'TbSwitch',
      fieldName: 'enabled',
      defaultValue: true,
      hideLabel: true,
      componentProps: {
        title: $t('notification.features.rule.actions.enable'),
      },
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenSelect',
      fieldName: 'triggerType',
      defaultValue: isSysAdmin
        ? NotificationRuleTriggerType.ENTITIES_LIMIT
        : NotificationRuleTriggerType.ALARM,
      label: $t('notification.features.rule.fields.triggerType'),
      componentProps: () => ({
        disabled: !!record.value?.id && !isCopy.value,
        options: notificationRuleTriggerTypeOptions().filter(({ value }) =>
          isAllowedTriggerType(value, isSysAdmin),
        ),
      }),
      rules: z.enum(NotificationRuleTriggerType),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      fieldName: 'templateId',
      defaultValue: undefined,
      label: $t('notification.features.rule.fields.template'),
      componentProps: () => ({
        entityType: triggerType.value ? 'NOTIFICATION_TEMPLATE' : undefined,
        params: {
          notificationTypes: triggerType.value,
          sortProperty: 'name',
          sortOrder: 'ASC',
        },
        key: `${triggerType.value}:${optionsVersion.value}`,
        showSearch: true,
        placeholder: $t(
          'notification.features.rule.validation.templateRequired',
        ),
      }),
      rules: z.string().min(1, {
        message: $t('notification.features.rule.validation.templateRequired'),
      }),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'EntityInput',
      fieldName: 'targets',
      defaultValue: [],
      label: $t('notification.features.rule.fields.targets'),
      componentProps: () => ({
        entityType: triggerType.value ? 'NOTIFICATION_TARGET' : undefined,
        params: {
          notificationType: triggerType.value,
          sortProperty: 'name',
          sortOrder: 'ASC',
        },
        key: `${triggerType.value}:${optionsVersion.value}`,
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.rule.validation.targetsRequired',
        ),
      }),
      dependencies: {
        triggerFields: ['triggerType'],
        resolve: ({ values: formValues }) => ({
          if: formValues.triggerType !== NotificationRuleTriggerType.ALARM,
          rules:
            formValues.triggerType === NotificationRuleTriggerType.ALARM
              ? z.array(z.string()).optional()
              : z.array(z.string()).min(1, {
                  message: $t(
                    'notification.features.rule.validation.targetsRequired',
                  ),
                }),
        }),
      },
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      defaultValue: '',
      label: $t('notification.features.rule.fields.description'),
      componentProps: {
        rows: 3,
        placeholder: $t(
          'notification.features.rule.form.descriptionPlaceholder',
        ),
      },
      formItemClass: 'sm:col-span-2',
    },
  ],
});

const triggerType = computed((): NotificationRuleTriggerType | undefined =>
  isReady.value ? formApi.form.values.triggerType : undefined,
);
const steps = computed(() => [
  { title: $t('notification.features.rule.steps.settings') },
  {
    title: $t('notification.features.rule.steps.trigger', {
      trigger:
        notificationRuleTriggerTypeLabel(triggerType.value) ||
        $t('notification.features.rule.fields.triggerType'),
    }),
  },
]);

watch(triggerType, async (value, previous) => {
  if (!value) return;
  if (previous && value !== previous) {
    await formApi.setValues({ templateId: undefined, targets: [] });
    escalationError.value = '';
  }
});

function handleCreate(target: 'recipient' | 'template') {
  const api = target === 'template' ? templateModalApi : recipientModalApi;
  api.setData({}).open();
}

function onSuccess() {
  optionsVersion.value++;
}

function handleAddEscalation() {
  const delayInSec =
    Math.max(...escalations.value.map((item) => item.delayInSec), 0) + 3600;
  escalations.value.push({ delayInSec, targets: [] });
}

function handleRemoveEscalation(index: number) {
  if (escalations.value.length > 1) escalations.value.splice(index, 1);
}

function isEscalationValid() {
  escalationError.value = '';
  if (triggerType.value !== NotificationRuleTriggerType.ALARM) return true;
  const delays = new Set<number>();
  for (const item of escalations.value) {
    if (
      !Number.isInteger(item.delayInSec) ||
      item.delayInSec < 0 ||
      delays.has(item.delayInSec)
    ) {
      escalationError.value = $t(
        'notification.features.rule.validation.escalationDelay',
      );
      return false;
    }
    if (item.targets.length === 0) {
      escalationError.value = $t(
        'notification.features.rule.validation.targetsRequired',
      );
      return false;
    }
    delays.add(item.delayInSec);
  }
  return escalations.value.length > 0;
}

async function handlePrevious() {
  currentStep.value = 0;
  await nextTick();
  contentRef.value?.scrollTo({ top: 0 });
}

const [Modal, modalApi] = useVbenModal<{
  notificationRuleId?: string;
  isCopy?: boolean;
}>({
  async onConfirm() {
    if (!isReady.value || modalState.value.submitting) return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!isEscalationValid() || !valid) {
        await handlePrevious();
        await formApi.validate();
        return;
      }
      if (currentStep.value === 0) {
        currentStep.value = 1;
        await nextTick();
        contentRef.value?.scrollTo({ top: 0 });
        return;
      }
      if (!triggerForm.value) return;
      const triggerValidation = await triggerForm.value.validate();
      if (!triggerValidation.valid) return;
      const formValues = await formApi.getValues();
      const triggerConfig = await triggerForm.value.getValues();
      const notificationRule: NotificationRule = {
        ...(isCopy.value ? {} : record.value),
        name: formValues.name.trim(),
        enabled: formValues.enabled,
        triggerType: formValues.triggerType,
        templateId: {
          entityType: EntityType.NOTIFICATION_TEMPLATE,
          id: formValues.templateId,
        },
        additionalConfig: {
          ...record.value?.additionalConfig,
          description: formValues.description?.trim() ?? '',
        },
        recipientsConfig: {
          triggerType: formValues.triggerType,
          ...(formValues.triggerType === NotificationRuleTriggerType.ALARM
            ? { escalationTable: toEscalationPayload(escalations.value) }
            : { targets: [...new Set(formValues.targets)] }),
        },
        triggerConfig: {
          ...triggerConfig,
          triggerType: formValues.triggerType,
        },
      };
      await saveNotificationRule(notificationRule);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      isReady.value = false;
      return;
    }
    const { notificationRuleId, isCopy: copy = false } =
      modalApi.getData() ?? {};
    isReady.value = false;
    record.value = null;
    currentStep.value = 0;
    isCopy.value = copy;
    escalationError.value = '';
    escalations.value = toEscalationFormValues();
    await formApi.reset();
    let title = notificationRuleId
      ? $t('notification.features.rule.actions.edit')
      : $t('notification.features.rule.actions.create');
    if (copy) title = $t('notification.features.rule.actions.copy');
    modalApi.setState({ title });
    modalApi.lock();
    try {
      if (notificationRuleId) {
        const notificationRule =
          await getNotificationRuleById(notificationRuleId);
        record.value = notificationRule;
        escalations.value = toEscalationFormValues(
          notificationRule.recipientsConfig?.escalationTable,
        );
        await formApi.setValues({
          name: copy
            ? $t('notification.features.rule.form.copyName', {
                name: notificationRule.name,
              })
            : notificationRule.name,
          enabled: notificationRule.enabled ?? true,
          triggerType: notificationRule.triggerType,
          templateId: notificationRule.templateId?.id,
          targets: notificationRule.recipientsConfig?.targets ?? [],
          description: notificationRule.additionalConfig?.description ?? '',
        });
      }
      isReady.value = true;
    } catch {
      modalApi.close();
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
    content-class="flex min-h-0 flex-col overflow-hidden px-6 pt-5 pb-1"
    :confirm-disabled="!isReady"
    :confirm-text="
      currentStep === 0
        ? $t('notification.features.rule.actions.next')
        : $t('tb.common.save')
    "
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
    <div class="mb-6 shrink-0">
      <Steps :current="currentStep" :items="steps" size="small" />
    </div>
    <div ref="contentRef" class="min-h-0 flex-1 overflow-y-auto px-1">
      <div v-show="currentStep === 0">
        <Form>
          <template #templateId="slotProps">
            <div class="w-full space-y-2">
              <EntityInput
                v-bind="slotProps.componentProps"
                :aria-label="$t('notification.features.rule.fields.template')"
              />
              <VbenButton
                type="button"
                variant="link"
                class="h-7 gap-1 px-0 text-sm"
                @click="handleCreate('template')"
              >
                <IconifyIcon
                  icon="lucide:plus"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ $t('notification.features.template.actions.create') }}
              </VbenButton>
            </div>
          </template>
          <template #targets="slotProps">
            <div class="w-full space-y-2">
              <EntityInput
                v-bind="slotProps.componentProps"
                :aria-label="$t('notification.features.rule.fields.targets')"
              />
              <VbenButton
                type="button"
                variant="link"
                class="h-7 gap-1 px-0 text-sm"
                @click="handleCreate('recipient')"
              >
                <IconifyIcon
                  icon="lucide:plus"
                  class="size-4"
                  aria-hidden="true"
                />
                {{ $t('notification.features.recipient.actions.create') }}
              </VbenButton>
            </div>
          </template>
        </Form>
        <section
          v-if="triggerType === NotificationRuleTriggerType.ALARM"
          class="mb-5 rounded-lg border p-4"
          :aria-label="$t('notification.features.rule.fields.escalationChain')"
        >
          <div class="mb-4">
            <h3 class="text-sm font-medium">
              {{ $t('notification.features.rule.fields.escalationChain') }}
            </h3>
            <p class="text-muted-foreground mt-1 text-xs leading-5">
              {{ $t('notification.features.rule.form.escalationHint') }}
            </p>
          </div>
          <div
            v-for="(escalation, index) in escalations"
            :key="index"
            class="bg-muted/30 mb-3 grid grid-cols-1 items-start gap-3 rounded-md border p-3 sm:grid-cols-[140px_1fr_auto]"
          >
            <div>
              <label
                :for="`escalation-delay-${index}`"
                class="mb-2 block text-sm font-medium"
              >
                {{ $t('notification.features.rule.fields.delaySeconds') }}
              </label>
              <InputNumber
                :id="`escalation-delay-${index}`"
                v-model:value="escalation.delayInSec"
                :min="0"
                :precision="0"
                class="w-full"
              />
            </div>
            <div class="min-w-0">
              <label
                :for="`escalation-targets-${index}`"
                class="mb-2 block text-sm font-medium"
              >
                {{ $t('notification.features.rule.fields.targets') }}
              </label>
              <div class="w-full space-y-2">
                <EntityInput
                  :id="`escalation-targets-${index}`"
                  v-model="escalation.targets"
                  multiple
                  show-search
                  entity-type="NOTIFICATION_TARGET"
                  :key="`${triggerType}:${optionsVersion}`"
                  :params="{
                    notificationType: triggerType,
                    sortProperty: 'name',
                    sortOrder: 'ASC',
                  }"
                  class="w-full"
                  :placeholder="
                    $t('notification.features.rule.validation.targetsRequired')
                  "
                />
                <VbenButton
                  type="button"
                  variant="link"
                  class="h-7 gap-1 px-0 text-sm"
                  @click="handleCreate('recipient')"
                >
                  <IconifyIcon
                    icon="lucide:plus"
                    class="size-4"
                    aria-hidden="true"
                  />
                  {{ $t('notification.features.recipient.actions.create') }}
                </VbenButton>
              </div>
            </div>
            <VbenButton
              type="button"
              variant="ghost"
              size="icon"
              class="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mt-7 !cursor-pointer"
              :disabled="escalations.length === 1"
              :aria-label="
                $t('notification.features.rule.actions.removeEscalation')
              "
              @click="handleRemoveEscalation(index)"
            >
              <IconifyIcon icon="lucide:trash-2" class="size-4" />
            </VbenButton>
          </div>
          <p
            v-if="escalationError"
            role="alert"
            class="text-destructive mb-3 text-sm"
          >
            {{ escalationError }}
          </p>
          <VbenButton
            type="button"
            variant="outline"
            @click="handleAddEscalation"
          >
            <IconifyIcon icon="lucide:plus" class="mr-2 size-4" />{{
              $t('notification.features.rule.actions.addEscalation')
            }}
          </VbenButton>
        </section>
      </div>
      <div v-show="currentStep === 1">
        <div class="mb-5 border-b pb-4">
          <h3 class="text-sm font-medium">
            {{ notificationRuleTriggerTypeLabel(triggerType) }}
          </h3>
          <p class="text-muted-foreground mt-1 text-xs leading-5">
            {{ $t('notification.features.rule.form.triggerSettingsHint') }}
          </p>
        </div>
        <KeepAlive v-if="isReady && triggerType">
          <component
            :is="triggerForms[triggerType]"
            :key="triggerType"
            ref="triggerForm"
            :config="
              record?.triggerType === triggerType
                ? record.triggerConfig
                : undefined
            "
            :escalation-count="escalations.length"
          />
        </KeepAlive>
      </div>
    </div>

    <template #prepend-footer>
      <VbenButton
        v-if="currentStep === 1"
        type="button"
        variant="outline"
        class="mr-auto"
        :disabled="modalState.submitting"
        @click="handlePrevious"
      >
        {{ $t('notification.features.rule.actions.previous') }}
      </VbenButton>
    </template>
  </Modal>
  <RecipientModal @success="onSuccess" />
  <TemplateModal @success="onSuccess" />
</template>
