<script lang="ts" setup>
import type { DeviceProfile } from '#/api/tb/device-profile';

import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Steps } from 'antdv-next';

import {
  getDeviceProfileById,
  saveDeviceProfile,
} from '#/api/tb/device-profile';
import { $t } from '#/locales';

import DetailsForm from './components/details-form.vue';
import ProvisionForm from './components/provision-form.vue';
import TransportForm from './components/transport-form.vue';
import { toDeviceProfilePayload } from './form-data';

const emit = defineEmits<{ success: [] }>();

const route = useRoute();
const record = ref<DeviceProfile | null>(null);
const currentStep = ref(0);
const isReady = ref(false);
const detailsFormRef = ref<InstanceType<typeof DetailsForm> | null>(null);
const transportFormRef = ref<InstanceType<typeof TransportForm> | null>(null);
const provisionFormRef = ref<InstanceType<typeof ProvisionForm> | null>(null);
const steps = computed(() => [
  {
    title: $t('device-profile.features.wizard.details'),
    disabled: modalState.value.submitting || !isReady.value,
  },
  {
    title: $t('device-profile.features.wizard.transport'),
    disabled: modalState.value.submitting || !isReady.value,
  },
  {
    title: $t('device-profile.features.wizard.provision'),
    disabled: modalState.value.submitting || !isReady.value,
  },
]);

async function isStepValid(step: number) {
  const form = [
    detailsFormRef.value,
    transportFormRef.value,
    provisionFormRef.value,
  ][step];
  return (await form?.validate()) ?? false;
}

async function handleStepChange(step: number) {
  if (modalState.value.submitting || !isReady.value) return;
  for (let index = currentStep.value; index < step; index++) {
    if (!(await isStepValid(index))) {
      currentStep.value = index;
      return;
    }
  }
  currentStep.value = step;
}

async function handleConfirm() {
  if (modalState.value.submitting || !isReady.value) return;
  modalApi.lock();
  try {
    for (let step = 0; step < steps.value.length; step++) {
      if (!(await isStepValid(step))) {
        currentStep.value = step;
        return;
      }
    }
    const details = await detailsFormRef.value?.getValues();
    const transport = await transportFormRef.value?.getValues();
    const provision = await provisionFormRef.value?.getValues();
    if (!details || !transport || !provision) return;
    const deviceProfile = toDeviceProfilePayload(
      { details, transport, provision },
      record.value,
    );
    await saveDeviceProfile(deviceProfile);
    message.success($t('tb.common.saveSuccess'));
    modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal<{ deviceProfileId?: string }>({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { deviceProfileId } = modalApi.getData() ?? {};
    isReady.value = false;
    currentStep.value = 0;
    record.value = null;
    modalApi.setState({
      title: deviceProfileId
        ? $t('device-profile.actions.edit')
        : $t('device-profile.actions.create'),
    });
    modalApi.lock();
    try {
      // 等待旧子表单卸载，再用本次实体初始化各步骤。
      await nextTick();
      if (deviceProfileId)
        record.value = await getDeviceProfileById(deviceProfileId);
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
    <Steps
      :current="currentStep"
      :items="steps"
      :aria-label="$t('device-profile.features.wizard.steps')"
      size="small"
      class="mb-6 shrink-0"
      @change="handleStepChange"
    />
    <div v-if="isReady" class="min-h-0 flex-1 overflow-y-auto px-1">
      <div v-show="currentStep === 0">
        <DetailsForm
          ref="detailsFormRef"
          :profile="record"
          :disabled="modalState.submitting"
        />
      </div>
      <div v-show="currentStep === 1">
        <TransportForm
          ref="transportFormRef"
          :profile="record"
          :disabled="modalState.submitting"
        />
      </div>
      <div v-show="currentStep === 2">
        <ProvisionForm
          ref="provisionFormRef"
          :profile="record"
          :disabled="modalState.submitting"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <VbenButton
          v-if="currentStep > 0"
          variant="outline"
          :disabled="modalState.submitting"
          @click="handleStepChange(currentStep - 1)"
        >
          <IconifyIcon icon="lucide:chevron-left" class="mr-1 size-4" />
          {{ $t('device-profile.features.wizard.prev') }}
        </VbenButton>
        <span v-else></span>
        <div class="flex items-center gap-2">
          <VbenButton
            variant="outline"
            :disabled="modalState.submitting"
            @click="modalApi.close()"
          >
            {{ $t('tb.common.cancel') }}
          </VbenButton>
          <VbenButton
            v-if="currentStep < steps.length - 1"
            :disabled="modalState.submitting || !isReady"
            @click="handleStepChange(currentStep + 1)"
          >
            {{ $t('device-profile.features.wizard.next') }}
            <IconifyIcon icon="lucide:chevron-right" class="ml-1 size-4" />
          </VbenButton>
          <VbenButton
            v-else
            :loading="modalState.submitting"
            :disabled="!isReady"
            @click="handleConfirm"
          >
            {{ $t('tb.common.save') }}
          </VbenButton>
        </div>
      </div>
    </template>
  </Modal>
</template>
