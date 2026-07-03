<script lang="ts" setup>
/**
 * OTA 升级包 新建弹窗
 * 当前仅支持「外部 URL」方式创建(单次 POST /otaPackage,usesUrl=true);
 * 二进制文件上传(POST /otaPackage/{id} multipart)尚未接入 UI,见 api/tb/ota-package.ts。
 * OTA 包创建后不可变,故仅新建、不提供编辑。
 */
import type { OtaPackageInfo } from '#/api/tb/ota-package';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { getDeviceProfileInfos } from '#/api/tb/device-profile';
import { saveOtaPackageInfo } from '#/api/tb/ota-package';
import { EntityType, OtaPackageType, otaPackageTypeOptions } from '#/enums';
import { $t } from '#/locales';

const emit = defineEmits<{ success: [] }>();

async function loadDeviceProfileOptions() {
  const pageData = await getDeviceProfileInfos({ page: 0, pageSize: 100 });
  return pageData.data.map((profile) => ({
    label: profile.name,
    value: profile.id.id,
  }));
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    labelWidth: 100,
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('tb.otaPackage.fields.title'),
      rules: z
        .string()
        .min(1, { message: $t('tb.otaPackage.validation.titleRequired') }),
    },
    {
      component: 'Input',
      fieldName: 'version',
      label: $t('tb.otaPackage.fields.version'),
      rules: z
        .string()
        .min(1, { message: $t('tb.otaPackage.validation.versionRequired') }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        options: otaPackageTypeOptions(),
        style: { width: '100%' },
      },
      defaultValue: OtaPackageType.FIRMWARE,
      fieldName: 'type',
      label: $t('tb.otaPackage.fields.type'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: loadDeviceProfileOptions,
        showSearch: true,
        style: { width: '100%' },
      },
      fieldName: 'deviceProfileId',
      label: $t('tb.otaPackage.fields.deviceProfile'),
      rules: z.string().min(1, {
        message: $t('tb.otaPackage.validation.deviceProfileRequired'),
      }),
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: $t('tb.otaPackage.fields.url'),
      rules: z
        .string()
        .min(1, { message: $t('tb.otaPackage.validation.urlRequired') }),
    },
    {
      component: 'Textarea',
      componentProps: { rows: 3 },
      fieldName: 'description',
      label: $t('tb.otaPackage.fields.description'),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();

    const otaPackage: OtaPackageInfo = {
      additionalInfo: { description: values.description },
      deviceProfileId: {
        entityType: EntityType.DEVICE_PROFILE,
        id: values.deviceProfileId,
      },
      title: values.title,
      type: values.type,
      url: values.url,
      usesUrl: true,
      version: values.version,
    };

    modalApi.lock();
    try {
      await saveOtaPackageInfo(otaPackage);
      message.success($t('tb.common.saveSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    formApi.resetForm();
    modalApi.setState({ title: $t('tb.otaPackage.actions.create') });
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
    <div class="text-muted-foreground px-2 pb-2 text-xs">
      {{ $t('tb.otaPackage.fileUploadHint') }}
    </div>
  </Modal>
</template>
