<script lang="ts" setup>
/**
 * 设备配置 新建/编辑 向导(3 步)。
 * 编排三个可复用子表单:设备配置详情 / 传输配置 / 设备预配置。
 * 参照 ui-ngx add-device-profile-dialog 的分步与组装逻辑。
 */
import type { DeviceProfile } from '#/api/tb/device-profile';

import { ref } from 'vue';

import { useVbenModal, VbenButton } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Steps } from 'antdv-next';

import {
  getDeviceProfileById,
  saveDeviceProfile,
} from '#/api/tb/device-profile';
import { EntityType } from '#/enums';
import { $t } from '#/locales';

import DetailsForm from './components/details-form.vue';
import ProvisionForm from './components/provision-form.vue';
import TransportForm from './components/transport-form.vue';

interface StepExpose {
  getValues: () => any;
  validate: () => Promise<boolean>;
}

const emit = defineEmits<{ success: [] }>();

const record = ref<DeviceProfile | null>(null);
const current = ref(0);
const saving = ref(false);

const detailsRef = ref<null | StepExpose>(null);
const transportRef = ref<null | StepExpose>(null);
const provisionRef = ref<null | StepExpose>(null);

const steps = [
  { title: $t('tb.deviceProfile.wizard.details') },
  { title: $t('tb.deviceProfile.wizard.transport') },
  { title: $t('tb.deviceProfile.wizard.provision') },
];

function stepRef(index: number): null | StepExpose {
  return [detailsRef, transportRef, provisionRef][index]?.value ?? null;
}

async function onNext() {
  const ok = await stepRef(current.value)?.validate();
  if (ok && current.value < steps.length - 1) {
    current.value += 1;
  }
}

function onPrev() {
  if (current.value > 0) {
    current.value -= 1;
  }
}

function toEntityId<T extends EntityType>(entityType: T, id?: string) {
  return id ? { entityType, id } : undefined;
}

async function assemble(): Promise<DeviceProfile> {
  const d = await detailsRef.value?.getValues();
  const t = transportRef.value?.getValues();
  const p = provisionRef.value?.getValues();

  // 预配置:把 provisionDeviceKey 提到顶层(对齐 ui-ngx)
  const provisionConfiguration = { ...p.provisionConfiguration };
  const provisionDeviceKey = provisionConfiguration.provisionDeviceKey;
  delete provisionConfiguration.provisionDeviceKey;

  const base = record.value;
  return {
    ...base,
    defaultDashboardId: toEntityId(EntityType.DASHBOARD, d.defaultDashboardId),
    defaultEdgeRuleChainId: toEntityId(
      EntityType.RULE_CHAIN,
      d.defaultEdgeRuleChainId,
    ),
    defaultQueueName: d.defaultQueueName || undefined,
    defaultRuleChainId: toEntityId(EntityType.RULE_CHAIN, d.defaultRuleChainId),
    description: d.description || undefined,
    image: d.image || undefined,
    name: d.name,
    profileData: {
      ...base?.profileData,
      alarms: base?.profileData?.alarms ?? null,
      configuration: base?.profileData?.configuration ?? { type: 'DEFAULT' },
      provisionConfiguration,
      transportConfiguration: t.transportConfiguration,
    },
    provisionDeviceKey: provisionDeviceKey || undefined,
    provisionType: provisionConfiguration.type,
    transportType: t.transportType,
    type: base?.type ?? 'DEFAULT',
  };
}

async function onSubmit() {
  // 逐步校验,失败则跳到对应步骤
  for (let i = 0; i < steps.length; i++) {
    const ok = await stepRef(i)?.validate();
    if (!ok) {
      current.value = i;
      return;
    }
  }

  saving.value = true;
  try {
    await saveDeviceProfile(await assemble());
    message.success($t('tb.common.saveSuccess'));
    modalApi.close();
    emit('success');
  } finally {
    saving.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    current.value = 0;
    record.value = null;
    const { deviceProfileId } =
      modalApi.getData<{ deviceProfileId?: string }>() ?? {};
    modalApi.setState({
      title: deviceProfileId
        ? $t('tb.deviceProfile.actions.edit')
        : $t('tb.deviceProfile.actions.create'),
    });
    if (deviceProfileId) {
      record.value = await getDeviceProfileById(deviceProfileId);
    }
  },
});
</script>

<template>
  <Modal
    class="w-3/5"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Steps :current="current" :items="steps" size="small" class="!mb-6 !px-4" />
    <div class="max-h-[60vh] overflow-y-auto px-1">
      <div v-show="current === 0">
        <DetailsForm ref="detailsRef" :profile="record" />
      </div>
      <div v-show="current === 1">
        <TransportForm ref="transportRef" :profile="record" />
      </div>
      <div v-show="current === 2">
        <ProvisionForm ref="provisionRef" :profile="record" />
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <VbenButton variant="outline" v-if="current > 0" @click="onPrev">
          <template #icon>
            <IconifyIcon icon="lucide:chevron-left" />
          </template>
          {{ $t('tb.deviceProfile.wizard.prev') }}
        </VbenButton>
        <span v-else></span>
        <div class="flex items-center gap-2">
          <VbenButton variant="outline" @click="modalApi.close()">
            {{ $t('tb.common.cancel') }}
          </VbenButton>
          <VbenButton
            v-if="current < steps.length - 1"
            type="primary"
            @click="onNext"
          >
            {{
              $t('tb.deviceProfile.wizard.nextWithLabel', {
                label: steps[current + 1]?.title,
              })
            }}
            <!-- <template #icon>
              <IconifyIcon icon="lucide:chevron-right" />
            </template> -->
          </VbenButton>
          <VbenButton
            v-else
            variant="default"
            :loading="saving"
            @click="onSubmit"
          >
            {{ $t('tb.common.save') }}
          </VbenButton>
        </div>
      </div>
    </template>
  </Modal>
</template>
