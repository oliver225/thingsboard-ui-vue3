<script lang="ts" setup>
import type { QueueFormValues } from './form-data';

import type { Queue } from '#/api/tb/queue';

import { nextTick, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getQueueById, saveQueue } from '#/api/tb/queue';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import {
  pickQueueFormValues,
  queueFormFields,
  toQueueFormValues,
  toQueuePayload,
} from './form-data';
import {
  createQueueFormSchemas,
  createQueueValidationSchema,
} from './form-schema';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | Queue>(null);
const expandedSections = reactive({
  submit: true,
  processing: true,
  polling: true,
});

const schemas = createQueueFormSchemas();
// 沿用密码策略页的分块 VbenForm，各卡片只管理自己的字段。
const formOptions = {
  layout: 'vertical',
  commonConfig: {
    colon: false,
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-0',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2',
  showDefaultActions: false,
} as const;
const [GeneralForm, generalFormApi] = useVbenForm<Partial<QueueFormValues>>({
  ...formOptions,
  schema: schemas.general,
});
const [SubmitForm, submitFormApi] = useVbenForm<Partial<QueueFormValues>>({
  ...formOptions,
  schema: schemas.submit,
});
const [ProcessingForm, processingFormApi] = useVbenForm<
  Partial<QueueFormValues>
>({
  ...formOptions,
  schema: schemas.processing,
});
const [PollingForm, pollingFormApi] = useVbenForm<Partial<QueueFormValues>>({
  ...formOptions,
  schema: schemas.polling,
});
const [AdditionalForm, additionalFormApi] = useVbenForm<
  Partial<QueueFormValues>
>({
  ...formOptions,
  schema: schemas.additional,
});
const forms = [
  {
    key: 'general',
    component: GeneralForm,
    api: generalFormApi,
    collapsible: false,
  },
  {
    key: 'submit',
    component: SubmitForm,
    api: submitFormApi,
    collapsible: true,
  },
  {
    key: 'processing',
    component: ProcessingForm,
    api: processingFormApi,
    collapsible: true,
  },
  {
    key: 'polling',
    component: PollingForm,
    api: pollingFormApi,
    collapsible: true,
  },
  {
    key: 'additional',
    component: AdditionalForm,
    api: additionalFormApi,
    collapsible: false,
  },
] as const;

async function resetQueueForm(nameDisabled: boolean) {
  const formValues = toQueueFormValues();
  const formSchemas = createQueueFormSchemas({ nameDisabled });
  await Promise.all(
    forms.map(async (form) => {
      if (form.collapsible) expandedSections[form.key] = true;
      form.api.setState({ schema: formSchemas[form.key] });
      await form.api.reset({
        values: pickQueueFormValues(formValues, form.key),
      });
    }),
  );
}

async function showFormError(
  form: (typeof forms)[number],
  errors: Record<string, string> | string,
) {
  if (form.collapsible) expandedSections[form.key] = true;
  await nextTick();
  form.api.scrollToFirstError(errors);
}

async function getValidatedFormValues() {
  // v-show 保留收起卡片的校验；有错误时先展开，再定位具体字段。
  const results = await Promise.all(
    forms.map(async (form) => ({ form, result: await form.api.validate() })),
  );
  const invalidForm = results.find(({ result }) => !result.valid);
  if (invalidForm) {
    await showFormError(invalidForm.form, invalidForm.result.errors);
    return null;
  }
  const groupValues = await Promise.all(
    forms.map(({ api }) => api.getValues()),
  );
  const formValues: Partial<QueueFormValues> = {};
  for (const group of groupValues) Object.assign(formValues, group);
  const result = createQueueValidationSchema().safeParse(formValues);
  if (!result.success) {
    const [issue] = result.error.issues;
    if (!issue) return null;
    const fieldName = issue.path[0] as keyof QueueFormValues;
    const form = forms.find(({ key }) =>
      (queueFormFields[key] as readonly (keyof QueueFormValues)[]).includes(
        fieldName,
      ),
    );
    if (form) {
      await form.api.setFieldError(fieldName, issue.message);
      await showFormError(form, fieldName);
    }
    return null;
  }
  return result.data;
}

const [Modal, modalApi] = useVbenModal<{ queueId?: string }>({
  async onConfirm() {
    if (modalState.value.submitting) return;
    modalApi.lock();
    try {
      const formValues = await getValidatedFormValues();
      if (!formValues) return;
      const queue = toQueuePayload(formValues, record.value);

      await saveQueue(queue);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { queueId } = modalApi.getData() ?? {};
    record.value = null;
    modalApi.setState({
      title: queueId
        ? $t('settings.features.queues.actions.edit')
        : $t('settings.features.queues.actions.create'),
    });
    modalApi.lock();
    try {
      await resetQueueForm(!!queueId);
      if (queueId) {
        const queue = await getQueueById(queueId);
        record.value = queue;
        const formValues = toQueueFormValues(queue);
        await Promise.all(
          forms.map(({ api, key }) =>
            api.setValues(pickQueueFormValues(formValues, key)),
          ),
        );
      }
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
    <div class="flex min-w-0 flex-col gap-6">
      <template v-for="form in forms" :key="form.key">
        <component
          :is="form.component"
          v-if="!form.collapsible"
          class="form-message-flow"
        />
        <FormSection
          v-else
          v-model:open="expandedSections[form.key]"
          collapsible
          :title="$t(`settings.features.queues.groups.${form.key}`)"
        >
          <component :is="form.component" class="form-message-flow" />
        </FormSection>
      </template>
    </div>
  </Modal>
</template>
