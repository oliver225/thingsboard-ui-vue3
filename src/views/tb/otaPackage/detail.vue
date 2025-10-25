<template>
  <BasicDrawer
    v-bind="$attrs"
    :showFooter="false"
    @register="registerDrawer"
    width="60%"
    :rootClassName="'tb-detail-wrapper'"
  >
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 tb-detail-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ t('tb.otaPackage.detail.title') }}</span>
        </div>
      </div>
    </template>
    <div class="space-x-4">
      <!-- <a-button type="primary success" @click="handleEditOtaPackage">
                <Icon :icon="'i-clarity:note-edit-line'" />编辑包
            </a-button> -->
      <a-button type="primary" @click="handleDownload" :disabled="!record.dataSize">
        <Icon :icon="'ant-design:download-outlined'" />{{ t('tb.otaPackage.action.download') }}
      </a-button>
      <a-button type="primary" danger @click="handleDeleteOtaPackage">
        <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.otaPackage.action.delete') }}
      </a-button>
    </div>
    <div class="space-x-4 my-4">
      <a-button @click="handleCopyOtaPackageInfoId">
        <Icon :icon="'ant-design:copy-filled'" />
        {{ t('tb.otaPackage.action.copyId') }}
      </a-button>
      <a-button @click="handleCopyChecksum" v-if="!isEmpty(record.checksum)">
        <Icon :icon="'ant-design:copy-filled'" />
        {{ t('tb.otaPackage.action.copyChecksum') }}
      </a-button>
    </div>
    <Descriptions bordered>
      <Descriptions.Item :label="t('tb.otaPackage.table.title')" :span="2">{{ record.title }}</Descriptions.Item>
      <Descriptions.Item :label="t('tb.otaPackage.table.version')">{{ record.version }}</Descriptions.Item>
      <Descriptions.Item :label="t('tb.otaPackage.table.tag')" :span="3">{{ record.tag }}</Descriptions.Item>
      <Descriptions.Item :label="t('tb.otaPackage.table.type')">
        {{ record.type == 'SOFTWARE' ? t('tb.otaPackage.form.software') : t('tb.otaPackage.form.firmware') }}
      </Descriptions.Item>
      <Descriptions.Item :label="t('tb.otaPackage.table.deviceProfile')" :span="2">
        {{ deviceProfile?.name }}
      </Descriptions.Item>
      <template v-if="!isEmpty(record.checksum)">
        <Descriptions.Item :label="t('tb.otaPackage.table.checksumAlgorithm')">
          {{ record.checksumAlgorithm }}
        </Descriptions.Item>
        <Descriptions.Item :label="t('tb.otaPackage.table.checksum')" :span="2">
          {{ record.checksum }}
        </Descriptions.Item>
      </template>
      <template v-if="!isEmpty(record.fileName)">
        <Descriptions.Item :label="t('tb.otaPackage.detail.fileName')">{{ record.fileName }}</Descriptions.Item>
        <Descriptions.Item :label="t('tb.otaPackage.detail.dataSizeBytes')">{{ record.dataSize }}</Descriptions.Item>
        <Descriptions.Item :label="t('tb.otaPackage.detail.contentType')">{{ record.contentType }}</Descriptions.Item>
      </template>

      <Descriptions.Item :label="t('tb.otaPackage.detail.description')" :span="3">{{
        record.additionalInfo?.description
      }}</Descriptions.Item>
    </Descriptions>
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbOtaPackageDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { isEmpty } from 'lodash-es';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { OtaPackageInfo, getOtaPackageInfoById } from '/@/api/tb/otaPackage';
  import { getDeviceProfileInfoById, DeviceProfileInfo } from '/@/api/tb/deviceProfile';
  import { Descriptions } from 'ant-design-vue';

  const emit = defineEmits(['edit', 'delete', 'download', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<OtaPackageInfo>({} as OtaPackageInfo);

  const deviceProfile = ref<DeviceProfileInfo>();

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.title,
  }));

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await getOtaPackageInfoById(data.id.id);
      if (record.value.deviceProfileId?.id) {
        deviceProfile.value = await getDeviceProfileInfoById(record.value.deviceProfileId.id);
      }
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  async function clear() {
    record.value = {} as OtaPackageInfo;
  }

  function handleCopyOtaPackageInfoId() {
    copyToClipboard(record.value.id.id, t('tb.otaPackage.action.copyIdSuccess'));
  }

  function handleCopyChecksum() {
    if (record.value.checksum) {
      copyToClipboard(record.value.checksum, t('tb.otaPackage.action.copyChecksumSuccess'));
    }
  }

  function handleDeleteOtaPackage() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditOtaPackage() {
    emit('edit', record.value);
    closeDrawer();
  }

  function handleDownload() {
    emit('download', record.value);
  }
</script>
