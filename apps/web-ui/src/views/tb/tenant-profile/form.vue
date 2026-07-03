<script lang="ts" setup>
import type { TenantProfile } from '#/api/tb/tenant-profile';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  getTenantProfileById,
  saveTenantProfile,
} from '#/api/tb/tenant-profile';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<null | TenantProfile>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 100,
    colon: true,
  },
  // TODO: 表单项待补充(name / description / isolatedTbRuleEngine / profileData 等)
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const tenantProfile = {
      ...record.value,
      ...values,
    } as TenantProfile;

    modalApi.lock();
    try {
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
    const { tenantProfileId } =
      modalApi.getData<{ tenantProfileId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: tenantProfileId
        ? $t('tb.tenantProfile.actions.edit')
        : $t('tb.tenantProfile.actions.create'),
    });
    if (tenantProfileId) {
      const tenantProfile = await getTenantProfileById(tenantProfileId);
      record.value = tenantProfile;
      await formApi.setValues({
        // TODO: 随表单项补充回填字段
      });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :fullscreen-button="false"
    :close-on-click-modal="false"
  >
    <Form />
  </Modal>
</template>
