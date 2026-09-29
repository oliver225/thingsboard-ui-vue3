<script lang="ts" setup>
import type {
  NotificationTemplate,
  NotificationTemplateConfig,
} from '#/api/tb/notification-template';

import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal, VbenButton, VbenSegmented } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Steps } from 'antdv-next';

import TbCheckbox from '#/adapter/component/tb-checkbox.vue';
import { useVbenForm, z } from '#/adapter/form';
import {
  getNotificationTemplateById,
  saveNotificationTemplate,
} from '#/api/tb/notification-template';
import {
  Authority,
  NotificationDeliveryMethod,
  NotificationType,
  notificationTypeOptions,
} from '#/enums';
import { $t } from '#/locales';

import DeliveryMethodForm from './delivery-method-form.vue';
import { deliveryMethodOptions, isAllowedNotificationType } from './template';

interface TemplateFormValues {
  name: string;
  notificationType: NotificationType;
  deliveryMethods: NotificationDeliveryMethod[];
}

const emit = defineEmits<{ success: [template: NotificationTemplate] }>();

const route = useRoute();
const { hasAccessByRoles } = useAccess();
const isSysAdmin = hasAccessByRoles([Authority.SYS_ADMIN]);
const record = ref<NotificationTemplate | null>(null);
const currentStep = ref(0);
const contentRef = ref<HTMLDivElement>();
const isCopy = ref(false);
const fixedNotificationType = ref<NotificationType>();
const isReady = ref(false);
const deliveryFormsRef = ref<InstanceType<typeof DeliveryMethodForm>[]>([]);
const activeMethod = ref<string | undefined>(NotificationDeliveryMethod.WEB);
const methodOptions = computed(deliveryMethodOptions);
const steps = computed(() => [
  { title: $t('notification.features.template.steps.settings') },
  { title: $t('notification.features.template.steps.compose') },
]);

const [Form, formApi] = useVbenForm<TemplateFormValues>({
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
      label: $t('notification.features.template.fields.name'),
      componentProps: {
        placeholder: $t('notification.features.template.form.namePlaceholder'),
      },
      rules: z
        .string()
        .trim()
        .min(1, {
          message: $t('notification.features.template.validation.nameRequired'),
        }),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'VbenSelect',
      fieldName: 'notificationType',
      defaultValue: NotificationType.GENERAL,
      label: $t('notification.features.template.fields.notificationType'),
      componentProps: () => ({
        disabled:
          !!fixedNotificationType.value ||
          (!!record.value?.id && !isCopy.value),
        options: notificationTypeOptions().filter(({ value }) =>
          isAllowedNotificationType(value, isSysAdmin),
        ),
      }),
      rules: z.enum(NotificationType),
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'CheckboxGroup',
      fieldName: 'deliveryMethods',
      defaultValue: [NotificationDeliveryMethod.WEB],
      label: $t('notification.features.template.fields.deliveryMethods'),
      formItemClass: 'sm:col-span-2',
      rules: z.array(z.enum(NotificationDeliveryMethod)).min(1, {
        message: $t(
          'notification.features.template.validation.deliveryMethodsRequired',
        ),
      }),
    },
  ],
});

const enabledMethods = computed(() =>
  isReady.value
    ? methodOptions.value.filter(({ value }) =>
        formApi.form.values.deliveryMethods?.includes(value),
      )
    : [],
);

watch(enabledMethods, (options) => {
  if (!options.some(({ value }) => value === activeMethod.value))
    activeMethod.value = options[0]?.value ?? '';
});

function handleDeliveryMethodChange(
  method: NotificationDeliveryMethod,
  checked: boolean,
) {
  const methods = formApi.form.values.deliveryMethods ?? [];
  return formApi.setValues({
    deliveryMethods: checked
      ? [...new Set([...methods, method])]
      : methods.filter((value) => value !== method),
  });
}

async function handlePrevious() {
  currentStep.value = 0;
  await nextTick();
  contentRef.value?.scrollTo({ top: 0 });
}

const [Modal, modalApi] = useVbenModal<{
  notificationTemplateId?: string;
  isCopy?: boolean;
  notificationType?: NotificationType;
}>({
  async onConfirm() {
    if (!isReady.value || modalState.value.submitting) return;
    modalApi.lock();
    try {
      const { valid } = await formApi.validate();
      if (!valid) {
        currentStep.value = 0;
        await nextTick();
        await formApi.validate();
        return;
      }
      if (currentStep.value === 0) {
        currentStep.value = 1;
        await nextTick();
        contentRef.value?.scrollTo({ top: 0 });
        return;
      }
      const formValues = await formApi.getValues();
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
      const notificationTemplate: NotificationTemplate = {
        ...(isCopy.value ? {} : record.value),
        name: formValues.name.trim(),
        notificationType: formValues.notificationType,
        configuration: { deliveryMethodsTemplates },
      };

      const savedTemplate =
        await saveNotificationTemplate(notificationTemplate);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success', savedTemplate);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const {
      notificationTemplateId,
      isCopy: copy = false,
      notificationType,
    } = modalApi.getData() ?? {};
    isReady.value = false;
    record.value = null;
    currentStep.value = 0;
    isCopy.value = copy;
    await formApi.reset();
    fixedNotificationType.value = notificationType;
    if (notificationType)
      await formApi.setFieldValue('notificationType', notificationType);
    activeMethod.value = NotificationDeliveryMethod.WEB;
    let title = notificationTemplateId
      ? $t('notification.features.template.actions.edit')
      : $t('notification.features.template.actions.create');
    if (copy) title = $t('notification.features.template.actions.copy');
    modalApi.setState({ title });
    modalApi.lock();
    try {
      if (notificationTemplateId) {
        const notificationTemplate = await getNotificationTemplateById(
          notificationTemplateId,
        );
        record.value = notificationTemplate;
        await formApi.setValues({
          name: copy
            ? $t('notification.features.template.form.copyName', {
                name: notificationTemplate.name,
              })
            : notificationTemplate.name,
          notificationType: notificationTemplate.notificationType,
          deliveryMethods: methodOptions.value
            .filter(
              ({ value }) =>
                notificationTemplate.configuration?.deliveryMethodsTemplates?.[
                  value
                ]?.enabled,
            )
            .map(({ value }) => value),
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
    :confirm-text="
      currentStep === 0
        ? $t('notification.features.template.actions.next')
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
          <template #deliveryMethods="slotProps">
            <div
              class="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
              role="group"
              :aria-label="
                $t('notification.features.template.fields.deliveryMethods')
              "
              :aria-describedby="slotProps.componentProps['aria-describedby']"
            >
              <TbCheckbox
                v-for="option in methodOptions"
                :key="option.value"
                :checked="
                  formApi.form.values.deliveryMethods?.includes(option.value)
                "
                @update:checked="
                  handleDeliveryMethodChange(option.value, $event)
                "
              >
                <template #title>
                  <span class="flex items-center gap-2">
                    <IconifyIcon :icon="option.icon" class="size-4 shrink-0" />
                    <span>{{ option.label }}</span>
                  </span>
                </template>
              </TbCheckbox>
            </div>
          </template>
        </Form>
      </div>
      <div v-show="currentStep === 1">
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
            :notification-type="
              formApi.form.values.notificationType ?? NotificationType.GENERAL
            "
            :template="
              record?.configuration?.deliveryMethodsTemplates?.[option.value]
            "
          />
        </template>
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
        {{ $t('notification.features.template.actions.previous') }}
      </VbenButton>
    </template>
  </Modal>
</template>
