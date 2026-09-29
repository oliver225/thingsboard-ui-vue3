<script lang="ts" setup>
import type { TenantProfileFormValues } from './form-data';

import type { TenantProfile } from '#/api/tb/tenant-profile';

import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  getTenantProfileById,
  saveTenantProfile,
} from '#/api/tb/tenant-profile';
import { FormSection } from '#/components/form-section';
import { $t } from '#/locales';

import ConfigurationFields from './configuration-fields.vue';
import {
  createDefaultQueueFormValues,
  toTenantProfileFormValues,
  toTenantProfilePayload,
} from './form-data';
import {
  createTenantProfileFormSchema,
  validateTenantProfileValues,
} from './form-schema';
import QueueFields from './queue-fields.vue';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<null | TenantProfile>(null);

const isQueueChanging = ref(false);
const savedQueueNames = computed(() =>
  (record.value?.profileData?.queueConfiguration ?? []).map(
    (queue) => queue.name ?? '',
  ),
);
const expandedSections = reactive({ configuration: true, queues: true });
const expandedQueues = ref<Record<number, boolean>>({});
const validationError = ref<{ fieldName: string }>();
const [Form, formApi] = useVbenForm<TenantProfileFormValues>({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-4',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: createTenantProfileFormSchema(),
});

async function resetTenantProfileForm() {
  validationError.value = undefined;
  expandedSections.configuration = true;
  expandedSections.queues = true;
  expandedQueues.value = {};
  formApi.setState({ schema: createTenantProfileFormSchema() });
  await formApi.reset({ values: toTenantProfileFormValues() });
}

function canRemoveQueue(
  formValues: Readonly<TenantProfileFormValues>,
  index: number,
) {
  return (
    formValues.queues.length > 1 &&
    !!formValues.queues[index] &&
    formValues.queues[index]?.source?.name !== 'Main'
  );
}

async function handleCreate() {
  if (isQueueChanging.value) return;
  isQueueChanging.value = true;
  try {
    const formValues = await formApi.getValues();
    await formApi.setFieldValue('queues', [
      ...formValues.queues,
      createDefaultQueueFormValues(),
    ]);
  } finally {
    isQueueChanging.value = false;
  }
}

async function handleDelete(index: number) {
  if (isQueueChanging.value) return;
  isQueueChanging.value = true;
  try {
    const formValues = await formApi.getValues();
    if (!canRemoveQueue(formValues, index)) return;
    await formApi.setFieldValue(
      'queues',
      formValues.queues.filter((_, queueIndex) => queueIndex !== index),
    );
    await nextTick();
    await formApi.clearValidation();
    expandedQueues.value = {};
    validationError.value = undefined;
  } finally {
    isQueueChanging.value = false;
  }
}

async function showFormError(fieldName: string) {
  if (fieldName.startsWith('configuration.'))
    expandedSections.configuration = true;
  if (fieldName === '_queues' || fieldName.startsWith('queues[')) {
    expandedSections.queues = true;
    const queueIndex = /^queues\[(\d+)\]/.exec(fieldName)?.[1];
    if (queueIndex !== undefined)
      expandedQueues.value[Number(queueIndex)] = true;
  }
  // 每次创建新对象，重复校验同一字段时也能重新展开子分块。
  validationError.value = { fieldName };
  await nextTick();
  formApi.scrollToFirstError(fieldName);
}

async function getValidatedFormValues() {
  const formValues = await formApi.getValues();
  const [issue] = validateTenantProfileValues(formValues);
  const { valid, errors } = await formApi.validate();
  if (issue) {
    await formApi.setFieldError(issue.fieldName, issue.message);
    await showFormError(issue.fieldName);
    return null;
  }
  const fieldName = Object.keys(errors)[0];
  if (!valid && fieldName) await showFormError(fieldName);
  return valid ? formValues : null;
}

const [Modal, modalApi] = useVbenModal<{ tenantProfileId?: string }>({
  async onConfirm() {
    if (modalState.value.submitting) return;
    modalApi.lock();
    try {
      const formValues = await getValidatedFormValues();
      if (!formValues) return;
      const tenantProfile = toTenantProfilePayload(formValues, record.value);

      await saveTenantProfile(tenantProfile);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { tenantProfileId } = modalApi.getData() ?? {};
    record.value = null;
    modalApi.setState({
      title: tenantProfileId
        ? $t('tenant-profile.actions.edit')
        : $t('tenant-profile.actions.create'),
    });
    modalApi.lock();
    try {
      await resetTenantProfileForm();
      if (tenantProfileId) {
        const tenantProfile = await getTenantProfileById(tenantProfileId);
        record.value = tenantProfile;
        // 配置和队列由插槽注册，回填时保留主 schema 之外的嵌套字段。
        await formApi.setValues(
          toTenantProfileFormValues(tenantProfile),
          false,
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
    <Form class="tenant-profile-form form-message-flow">
      <template #_queues="{ values: formValues }">
        <FormSection
          v-if="formValues.isolatedTbRuleEngine"
          v-model:open="expandedSections.queues"
          collapsible
          :title="
            $t('tenant-profile.sections.groups.queues', {
              count: formValues.queues?.length ?? 0,
            })
          "
          class="w-full"
        >
          <div class="tenant-profile-section-stack">
            <FormSection
              v-for="(queue, index) in formValues.queues"
              :key="String(queue.source?.id ?? index)"
              v-model:open="expandedQueues[index]"
              collapsible
              :title="
                queue.name ||
                $t('tenant-profile.features.form.unnamedQueue', {
                  index: index + 1,
                })
              "
            >
              <template #actions>
                <VbenButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive -my-2 size-8"
                  :disabled="
                    isQueueChanging || !canRemoveQueue(formValues, index)
                  "
                  :aria-label="$t('tenant-profile.features.form.removeQueue')"
                  @click="handleDelete(index)"
                >
                  <IconifyIcon icon="lucide:trash-2" class="size-4" />
                </VbenButton>
              </template>
              <QueueFields
                :index="index"
                :validation-error="validationError"
                :name-disabled="
                  queue.source?.name === 'Main' ||
                  savedQueueNames.includes(queue.source?.name ?? '')
                "
              />
            </FormSection>
            <VbenButton
              type="button"
              variant="outline"
              :disabled="isQueueChanging"
              @click="handleCreate"
            >
              <IconifyIcon icon="lucide:plus" class="mr-1 size-4" />
              {{ $t('tenant-profile.features.form.addQueue') }}
            </VbenButton>
          </div>
        </FormSection>
      </template>
      <template #_configuration>
        <ConfigurationFields
          v-model:open="expandedSections.configuration"
          :validation-error="validationError"
          class="w-full"
        />
      </template>
    </Form>
  </Modal>
</template>

<style scoped>
/* 仅收紧租户配置表单，公共 FormSection 和其他页面保留原有尺寸。 */
.tenant-profile-form :deep(.form-section-header) {
  padding: 12px 16px;
}

.tenant-profile-form :deep(.form-section-content) {
  padding: 0 16px 12px;
}

.tenant-profile-form :deep(.tenant-profile-section-stack) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
