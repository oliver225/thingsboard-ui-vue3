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
          <span class="text-sm">OTA 升级详情</span>
        </div>
      </div>
    </template>
    <div class="space-x-4">
      <!-- <a-button type="primary success" @click="handleEditOtaPackage">
                <Icon :icon="'i-clarity:note-edit-line'" />编辑包
            </a-button> -->
      <a-button type="primary" @click="handleDownload" :disabled="!record.dataSize">
        <Icon :icon="'ant-design:download-outlined'" />下载包
      </a-button>
      <a-button type="primary" danger @click="handleDeleteOtaPackage">
        <Icon :icon="'ant-design:delete-outlined'" />删除包
      </a-button>
    </div>
    <div class="space-x-4 my-4">
      <a-button @click="handleCopyOtaPackageInfoId">
        <Icon :icon="'ant-design:copy-filled'" />
        复制包ID
      </a-button>
      <a-button @click="handleCopyChecksum" v-if="!isEmpty(record.checksum)">
        <Icon :icon="'ant-design:copy-filled'" />
        复制校验和
      </a-button>
    </div>
    <Descriptions bordered>
      <Descriptions.Item label="标题" :span="2">{{ record.title }}</Descriptions.Item>
      <Descriptions.Item label="版本">{{ record.version }}</Descriptions.Item>
      <Descriptions.Item label="版本标签" :span="3">{{ record.tag }}</Descriptions.Item>
      <Descriptions.Item label="包类型">{{ record.type == 'SOFTWARE' ? '软件' : '固件' }}</Descriptions.Item>
      <Descriptions.Item label="设备配置" :span="2">{{ deviceProfile?.name }}</Descriptions.Item>
      <template v-if="!isEmpty(record.checksum)">
        <Descriptions.Item label="校验和算法">{{ record.checksumAlgorithm }}</Descriptions.Item>
        <Descriptions.Item label="校验和" :span="2">{{ record.checksum }}</Descriptions.Item>
      </template>
      <template v-if="!isEmpty(record.fileName)">
        <Descriptions.Item label="文件名">{{ record.fileName }}</Descriptions.Item>
        <Descriptions.Item label="文件大小（以字节为单位）">{{ record.dataSize }}</Descriptions.Item>
        <Descriptions.Item label="内容类型">{{ record.contentType }}</Descriptions.Item>
      </template>

      <Descriptions.Item label="说明" :span="3">{{ record.additionalInfo?.description }}</Descriptions.Item>
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
    copyToClipboard(record.value.id.id, '复制OTA包ID成功！');
  }

  function handleCopyChecksum() {
    if (record.value.checksum) {
      copyToClipboard(record.value.checksum, '复制校验和成功！');
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
