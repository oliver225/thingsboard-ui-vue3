<script lang="ts" setup>
/**
 * 仪表板 新建/编辑 弹窗
 * 仅维护标题(新建得到空仪表板);布局/部件可视化编辑器为独立大模块,暂未实现。
 * 编辑时通过 getDashboardById 取回完整实体并原样保留 configuration。
 */
import type { Dashboard } from '#/api/tb/dashboard';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getDashboardById, saveDashboard } from '#/api/tb/dashboard';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

const record = ref<Dashboard | null>(null);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('tb.dashboard.fields.title'),
      rules: z
        .string()
        .min(1, { message: $t('tb.dashboard.validation.titleRequired') }),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const dashboard = {
      ...record.value,
      title: values.title,
    };

    modalApi.lock();
    try {
      await saveDashboard(dashboard);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { dashboardId } = modalApi.getData<{ dashboardId?: string }>() ?? {};
    record.value = null;
    formApi.resetForm();
    modalApi.setState({
      title: dashboardId
        ? $t('tb.dashboard.actions.edit')
        : $t('tb.dashboard.actions.create'),
    });
    if (dashboardId) {
      const dashboard = await getDashboardById(dashboardId);
      record.value = dashboard;
      await formApi.setValues({ title: dashboard.title });
    }
  },
});
</script>

<template>
  <Modal
    class="w-1/2"
    :centered="true"
    :close-on-click-modal="false"
    :fullscreen-button="false"
  >
    <Form />
  </Modal>
</template>
