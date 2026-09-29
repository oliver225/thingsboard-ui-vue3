<script lang="ts" setup>
import type { RequestFormValues } from './form-data';

import type {
  NotificationRequest,
  NotificationRequestPreview,
} from '#/api/tb/notification';
import type { NotificationTarget } from '#/api/tb/notification-target';
import type {
  NotificationTemplate,
  NotificationTemplateConfig,
} from '#/api/tb/notification-template';

import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal, VbenButton, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useTimezoneStore } from '@vben/stores';

import { message, Steps } from 'antdv-next';
import dayjs from 'dayjs';

import { ApiSelect } from '#/adapter/component';
import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { useVbenForm, z } from '#/adapter/form';
import {
  createNotificationRequest,
  getAvailableNotificationDeliveryMethods,
  getNotificationRequestById,
  getNotificationRequestPreview,
} from '#/api/tb/notification';
import { getNotificationTargets } from '#/api/tb/notification-target';
import { getNotificationTemplates } from '#/api/tb/notification-template';
import {
  Authority,
  NotificationDeliveryMethod,
  NotificationType,
} from '#/enums';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

import RecipientForm from '../recipients/form.vue';
import DeliveryMethodForm from '../templates/delivery-method-form.vue';
import TemplateForm from '../templates/form.vue';
import { deliveryMethodOptions } from '../templates/template';
import {
  createDefaultScheduledTime,
  isScheduledTimeValid,
  SCHEDULE_FORMAT,
  toNotificationRequestPayload,
} from './form-data';
import RequestPreview from './preview.vue';

const emit = defineEmits<{ success: [] }>();

const router = useRouter();
const timezoneStore = useTimezoneStore();
const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);
const record = ref<NotificationRequest | null>(null);
const currentStep = ref(0);
const contentRef = ref<HTMLDivElement>();
const isReady = ref(false);
const optionsVersion = ref(0);
const methodsLoading = ref(false);
const methodsError = ref(false);
const templates = ref<NotificationTemplate[]>([]);
const targetOptions = ref<{ label: string; value: string }[]>([]);
const timezoneOptions = ref<{ label: string; value: string }[]>([]);
const availableMethods = ref<NotificationDeliveryMethod[]>([]);
const deliveryFormsRef = ref<InstanceType<typeof DeliveryMethodForm>[]>([]);
const activeMethod = ref<string | undefined>(NotificationDeliveryMethod.WEB);
const preview = ref<NotificationRequestPreview | null>(null);
const previewError = ref(false);
let configuration: NotificationTemplateConfig = {};
let templateName = '';

const methodOptions = computed(deliveryMethodOptions);
const templateOptions = computed(() =>
  templates.value.flatMap((item) =>
    item.id?.id ? [{ label: item.name ?? item.id.id, value: item.id.id }] : [],
  ),
);
const useTemplate = computed(
  () => isReady.value && formApi.form.values.mode === 'template',
);
const steps = computed(() => [
  { title: $t('notification.features.request.steps.settings') },
  ...(useTemplate.value
    ? []
    : [{ title: $t('notification.features.request.steps.compose') }]),
  { title: $t('notification.features.request.steps.review') },
]);
const isReviewStep = computed(
  () => currentStep.value === steps.value.length - 1,
);
const enabledMethods = computed(() =>
  isReady.value
    ? methodOptions.value.filter(({ value }) =>
        formApi.form.values.deliveryMethods?.includes(value),
      )
    : [],
);
const unavailableMethods = computed(() =>
  methodOptions.value.filter(
    ({ value }) => !availableMethods.value.includes(value),
  ),
);

const [RecipientModal, recipientModalApi] = useVbenModal({
  connectedComponent: RecipientForm,
  destroyOnClose: true,
});
const [TemplateModal, templateModalApi] = useVbenModal({
  connectedComponent: TemplateForm,
  destroyOnClose: true,
});

const [Form, formApi] = useVbenForm<RequestFormValues>({
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
      component: VbenSegmented,
      modelPropName: 'modelValue',
      fieldName: 'mode',
      defaultValue: 'scratch',
      label: $t('notification.features.request.fields.mode'),
      hideLabel: true,
      componentProps: {
        'aria-label': $t('notification.features.request.fields.mode'),
        class: '!w-auto',
        variant: 'navigation',
        tabs: [
          {
            value: 'scratch',
            label: $t('notification.features.request.form.scratch'),
          },
          {
            value: 'template',
            label: $t('notification.features.request.form.useTemplate'),
          },
        ],
      },
      formItemClass: 'sm:col-span-2',
      wrapperClass: 'justify-center',
    },
    {
      component: 'ApiSelect',
      fieldName: 'templateId',
      label: $t('notification.features.request.fields.template'),
      componentProps: () => ({
        api: loadTemplateOptions,
        params: { version: optionsVersion.value },
        options: templateOptions.value,
        alwaysLoad: true,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t(
          'notification.features.request.validation.templateRequired',
        ),
      }),
      dependencies: {
        triggerFields: ['mode'],
        resolve: ({ values: formValues }) => ({
          if: formValues.mode === 'template',
          rules:
            formValues.mode === 'template'
              ? z
                  .string({
                    error: $t(
                      'notification.features.request.validation.templateRequired',
                    ),
                  })
                  .min(
                    1,
                    $t(
                      'notification.features.request.validation.templateRequired',
                    ),
                  )
                  .refine(
                    (id) =>
                      templateOptions.value.some((item) => item.value === id),
                    $t(
                      'notification.features.request.validation.templateUnavailable',
                    ),
                  )
              : z.string().optional(),
        }),
      },
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'ApiSelect',
      fieldName: 'targets',
      defaultValue: [],
      label: $t('notification.features.request.fields.targets'),
      componentProps: () => ({
        api: loadTargetOptions,
        params: { version: optionsVersion.value },
        options: targetOptions.value,
        alwaysLoad: true,
        mode: 'multiple',
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: $t(
          'notification.features.request.validation.targetsRequired',
        ),
      }),
      rules: z
        .array(z.string())
        .min(1, $t('notification.features.request.validation.targetsRequired'))
        .refine(
          (ids) =>
            ids.every((id) =>
              targetOptions.value.some((item) => item.value === id),
            ),
          $t('notification.features.request.validation.targetUnavailable'),
        ),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'CheckboxGroup',
      fieldName: 'deliveryMethods',
      defaultValue: [NotificationDeliveryMethod.WEB],
      label: $t('notification.features.request.fields.deliveryMethods'),
      dependencies: {
        triggerFields: ['mode'],
        resolve: ({ values: formValues }) => ({
          if: formValues.mode === 'scratch',
          rules:
            formValues.mode === 'scratch'
              ? z
                  .array(z.enum(NotificationDeliveryMethod))
                  .min(
                    1,
                    $t(
                      'notification.features.request.validation.deliveryMethodsRequired',
                    ),
                  )
                  .refine(
                    (methods) =>
                      methods.every((method) =>
                        availableMethods.value.includes(method),
                      ),
                    $t(
                      'notification.features.request.validation.methodUnavailable',
                    ),
                  )
              : z.array(z.enum(NotificationDeliveryMethod)).optional(),
        }),
      },
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'TbSwitch',
      fieldName: 'scheduleEnabled',
      defaultValue: false,
      hideLabel: true,
      componentProps: {
        title: $t('notification.features.request.fields.schedule'),
        description: $t('notification.features.request.form.scheduleHint'),
      },
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'Select',
      fieldName: 'timezone',
      defaultValue: timezoneStore.timezone,
      label: $t('notification.features.request.fields.timezone'),
      componentProps: () => ({
        options: timezoneOptions.value,
        showSearch: true,
        optionFilterProp: 'label',
      }),
      dependencies: {
        triggerFields: ['scheduleEnabled'],
        resolve: ({ values: formValues }) => ({
          if: formValues.scheduleEnabled,
          rules: formValues.scheduleEnabled
            ? z.string().min(1)
            : z.string().optional(),
        }),
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'scheduledTime',
      defaultValue: createDefaultScheduledTime(timezoneStore.timezone),
      label: $t('notification.features.request.fields.scheduledTime'),
      componentProps: () => ({
        showTime: true,
        format: SCHEDULE_FORMAT,
        valueFormat: SCHEDULE_FORMAT,
        placeholder: $t('notification.features.request.form.timePlaceholder'),
        disabledDate: (date: dayjs.Dayjs) => {
          const today = dayjs()
            .tz(formApi.form.values.timezone || timezoneStore.timezone)
            .format('YYYY-MM-DD');
          const candidate = date.format('YYYY-MM-DD');
          return (
            candidate < today ||
            candidate > dayjs(today).add(7, 'day').format('YYYY-MM-DD')
          );
        },
      }),
      dependencies: {
        triggerFields: ['scheduleEnabled', 'timezone'],
        resolve: ({ values: formValues }) => ({
          if: formValues.scheduleEnabled,
          rules: formValues.scheduleEnabled
            ? z
                .string({
                  error: $t(
                    'notification.features.request.validation.schedule',
                  ),
                })
                .refine(
                  (time) => isScheduledTimeValid(time, formValues.timezone),
                  $t('notification.features.request.validation.schedule'),
                )
            : z.string().optional(),
        }),
      },
    },
  ],
});

watch(enabledMethods, (methods) => {
  if (!methods.some(({ value }) => value === activeMethod.value))
    activeMethod.value = methods[0]?.value;
});

async function loadTemplateOptions() {
  templates.value = await loadAllPages((pageLink) =>
    getNotificationTemplates({
      ...pageLink,
      notificationTypes: NotificationType.GENERAL,
      sortProperty: 'name',
      sortOrder: 'ASC',
    }),
  );
  return templateOptions.value;
}

async function loadTargetOptions() {
  const targets = await loadAllPages((pageLink) =>
    getNotificationTargets({
      ...pageLink,
      notificationType: NotificationType.GENERAL,
      sortProperty: 'name',
      sortOrder: 'ASC',
    }),
  );
  targetOptions.value = targets.flatMap((item) =>
    item.id ? [{ label: item.name ?? item.id.id, value: item.id.id }] : [],
  );
  return targetOptions.value;
}

async function handleLoadAvailableMethods() {
  methodsLoading.value = true;
  methodsError.value = false;
  try {
    availableMethods.value = await getAvailableNotificationDeliveryMethods();
    const formValues = await formApi.getValues();
    await formApi.setFieldValue(
      'deliveryMethods',
      (formValues.deliveryMethods ?? []).filter((method) =>
        availableMethods.value.includes(method),
      ),
    );
  } catch {
    methodsError.value = true;
  } finally {
    methodsLoading.value = false;
  }
}

function getConfigurationPath(method: NotificationDeliveryMethod) {
  if (method === NotificationDeliveryMethod.SLACK)
    return '/settings/notifications';
  if (!isSysAdmin) return;
  if (method === NotificationDeliveryMethod.EMAIL)
    return '/settings/outgoing-mail';
  if (
    [
      NotificationDeliveryMethod.MOBILE_APP,
      NotificationDeliveryMethod.SMS,
    ].includes(method)
  )
    return '/settings/notifications';
}

function handleConfigureMethod(method: NotificationDeliveryMethod) {
  const path = getConfigurationPath(method);
  if (path)
    window.open(router.resolve(path).href, '_blank', 'noopener,noreferrer');
}

function handleCreate(target: 'recipient' | 'template') {
  if (target === 'template') {
    templateModalApi
      .setData({ notificationType: NotificationType.GENERAL })
      .open();
  } else {
    recipientModalApi.setData({ generalOnly: true }).open();
  }
}

async function onSuccess(
  target: 'recipient' | 'template',
  record: NotificationTarget | NotificationTemplate,
) {
  if (!record.id?.id) return;
  optionsVersion.value++;
  if (target === 'template') {
    templates.value.push(record as NotificationTemplate);
    await formApi.setFieldValue('templateId', record.id.id);
    return;
  }
  targetOptions.value.push({
    label: record.name ?? record.id.id,
    value: record.id.id,
  });
  const formValues = await formApi.getValues();
  await formApi.setFieldValue('targets', [
    ...new Set([...formValues.targets, record.id.id]),
  ]);
}

async function handleDeliveryMethodChange(
  method: NotificationDeliveryMethod,
  checked: boolean,
) {
  const formValues = await formApi.getValues();
  const methods = new Set(formValues.deliveryMethods);
  if (checked) methods.add(method);
  else methods.delete(method);
  await formApi.setFieldValue('deliveryMethods', [...methods]);
}

async function handlePrevious() {
  preview.value = null;
  previewError.value = false;
  currentStep.value--;
  await nextTick();
  contentRef.value?.scrollTo({ top: 0 });
}

async function loadPreview() {
  preview.value = null;
  previewError.value = false;
  try {
    const formValues = await formApi.getValues();
    preview.value = await getNotificationRequestPreview(
      toNotificationRequestPayload(formValues, configuration, templateName),
    );
  } catch {
    previewError.value = true;
  }
}

async function handleRetryPreview() {
  modalApi.lock();
  try {
    await loadPreview();
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal<{ notificationRequestId?: string }>({
  async onConfirm() {
    if (
      !isReady.value ||
      modalState.value.submitting ||
      methodsLoading.value ||
      methodsError.value
    )
      return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!valid) {
        currentStep.value = 0;
        preview.value = null;
        await nextTick();
        await formApi.validate();
        return;
      }
      const formValues = await formApi.getValues();
      if (isReviewStep.value) {
        if (!preview.value) return;
        // 复核定时时间后再组装请求，避免预览期间经过的时间推迟发送。
        await createNotificationRequest(
          toNotificationRequestPayload(formValues, configuration, templateName),
        );
        message.success(
          formValues.scheduleEnabled
            ? $t('notification.features.request.scheduleSuccess')
            : $t('notification.features.request.sendSuccess'),
        );
        modalApi.close();
        emit('success');
        return;
      }
      if (currentStep.value === 1 && !useTemplate.value) {
        const deliveryMethodsTemplates: NonNullable<
          NotificationTemplateConfig['deliveryMethodsTemplates']
        > = {};
        for (const { value: method } of enabledMethods.value) {
          const form = deliveryFormsRef.value.find(
            (item) => item.method === method,
          );
          if (!form) return;
          const result = await form.validate();
          if (!result.valid) {
            activeMethod.value = method;
            await nextTick();
            await form.validate();
            return;
          }
          deliveryMethodsTemplates[method] = await form.getValues();
        }
        configuration = { deliveryMethodsTemplates };
      }
      currentStep.value++;
      await nextTick();
      contentRef.value?.scrollTo({ top: 0 });
      if (isReviewStep.value) await loadPreview();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { notificationRequestId } = modalApi.getData() ?? {};
    isReady.value = false;
    record.value = null;
    currentStep.value = 0;
    preview.value = null;
    previewError.value = false;
    configuration = {};
    templateName = crypto.randomUUID();
    modalApi.setState({
      title: $t('notification.features.request.actions.send'),
    });
    modalApi.lock();
    try {
      await formApi.reset();
      await formApi.setValues({
        timezone: timezoneStore.timezone,
        scheduledTime: createDefaultScheduledTime(timezoneStore.timezone),
      });
      timezoneOptions.value = await timezoneStore.getTimezoneOptions();
      if (
        !timezoneOptions.value.some(
          (item) => item.value === timezoneStore.timezone,
        )
      )
        timezoneOptions.value.unshift({
          label: timezoneStore.timezone,
          value: timezoneStore.timezone,
        });
      if (notificationRequestId) {
        record.value = await getNotificationRequestById(notificationRequestId);
        await formApi.setValues({
          mode: record.value.template ? 'scratch' : 'template',
          templateId: record.value.templateId?.id,
          targets: record.value.targets ?? [],
          deliveryMethods: methodOptions.value
            .filter(
              ({ value }) =>
                record.value?.template?.configuration
                  ?.deliveryMethodsTemplates?.[value]?.enabled,
            )
            .map(({ value }) => value),
        });
      }
      await handleLoadAvailableMethods();
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
    :confirm-disabled="
      !isReady || methodsLoading || methodsError || (isReviewStep && !preview)
    "
    :confirm-text="
      isReviewStep
        ? $t('notification.features.request.actions.send')
        : $t('notification.features.template.actions.next')
    "
  >
    <template #title>
      <span class="flex items-center gap-3">
        <IconifyIcon
          icon="lucide:send"
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
              <ApiSelect
                v-bind="slotProps.componentProps"
                :aria-label="
                  $t('notification.features.request.fields.template')
                "
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
                />{{ $t('notification.features.template.actions.create') }}
              </VbenButton>
            </div>
          </template>
          <template #targets="slotProps">
            <div class="w-full space-y-2">
              <ApiSelect
                v-bind="slotProps.componentProps"
                :aria-label="$t('notification.features.request.fields.targets')"
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
                />{{ $t('notification.features.recipient.actions.create') }}
              </VbenButton>
            </div>
          </template>
          <template #deliveryMethods="slotProps">
            <div
              class="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
              role="group"
              :aria-label="
                $t('notification.features.request.fields.deliveryMethods')
              "
              :aria-describedby="slotProps.componentProps['aria-describedby']"
            >
              <TbCheckbox
                v-for="option in methodOptions"
                :key="option.value"
                :checked="
                  formApi.form.values.deliveryMethods?.includes(option.value)
                "
                :disabled="
                  methodsLoading ||
                  methodsError ||
                  !availableMethods.includes(option.value)
                "
                @update:checked="
                  handleDeliveryMethodChange(option.value, $event)
                "
              >
                <template #title>
                  <span class="flex items-center gap-2">
                    <IconifyIcon
                      :icon="option.icon"
                      class="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {{ option.label }}
                  </span>
                </template>
              </TbCheckbox>
            </div>
          </template>
        </Form>
        <section
          v-if="unavailableMethods.length || methodsError"
          class="border-border bg-muted/30 mb-5 rounded-lg border p-4 text-sm"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="text-muted-foreground mb-0">
              {{
                methodsError
                  ? $t('notification.features.request.form.methodsError')
                  : $t('notification.features.request.form.unavailableMethods')
              }}
            </p>
            <VbenButton
              type="button"
              variant="ghost"
              size="sm"
              :disabled="methodsLoading"
              @click="handleLoadAvailableMethods"
            >
              <IconifyIcon
                icon="lucide:refresh-cw"
                class="mr-1 size-4"
                :class="{ 'animate-spin': methodsLoading }"
                aria-hidden="true"
              />{{ $t('tb.common.refresh') }}
            </VbenButton>
          </div>
          <div v-if="!methodsError" class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <template v-for="option in unavailableMethods" :key="option.value">
              <VbenButton
                v-if="getConfigurationPath(option.value)"
                type="button"
                variant="link"
                class="h-7 gap-1 px-0 text-sm"
                @click="handleConfigureMethod(option.value)"
              >
                {{ option.label
                }}<IconifyIcon
                  icon="lucide:external-link"
                  class="size-3"
                  aria-hidden="true"
                />
              </VbenButton>
              <span
                v-else
                class="text-muted-foreground inline-flex h-7 items-center"
              >
                {{ option.label }}
              </span>
            </template>
          </div>
        </section>
      </div>
      <div v-show="currentStep === 1 && !useTemplate">
        <div class="mb-5 overflow-x-auto pb-1">
          <VbenSegmented
            v-if="enabledMethods.length"
            v-model="activeMethod"
            variant="navigation"
            class="min-w-max"
            :tabs="enabledMethods"
          />
        </div>
        <template v-if="isReady">
          <DeliveryMethodForm
            v-for="option in methodOptions"
            v-show="activeMethod === option.value"
            :key="option.value"
            ref="deliveryFormsRef"
            :method="option.value"
            :notification-type="NotificationType.GENERAL"
            :template="
              record?.template?.configuration?.deliveryMethodsTemplates?.[
                option.value
              ]
            "
          />
        </template>
      </div>
      <div v-if="isReviewStep">
        <div
          v-if="previewError"
          role="alert"
          class="border-destructive/30 bg-destructive/5 rounded-xl border p-5 text-center"
        >
          <p class="mb-4 text-sm">
            {{ $t('notification.features.request.preview.error') }}
          </p>
          <VbenButton
            variant="outline"
            :disabled="modalState.submitting"
            @click="handleRetryPreview"
          >
            {{ $t('tb.common.retry') }}
          </VbenButton>
        </div>
        <RequestPreview
          v-else-if="preview"
          :preview="preview"
          :scheduled-time="
            formApi.form.values.scheduleEnabled
              ? formApi.form.values.scheduledTime
              : undefined
          "
          :timezone="formApi.form.values.timezone"
        />
      </div>
    </div>

    <template #prepend-footer>
      <VbenButton
        v-if="currentStep > 0"
        type="button"
        variant="outline"
        class="mr-auto"
        :disabled="modalState.submitting"
        @click="handlePrevious"
      >
        {{ $t('notification.features.template.actions.previous') }}
      </VbenButton>
    </template>
  </Modal>
  <RecipientModal @success="onSuccess('recipient', $event)" />
  <TemplateModal @success="onSuccess('template', $event)" />
</template>
