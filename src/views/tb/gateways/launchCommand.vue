<template>
  <BasicModal v-bind="$attrs" :showFooter="false" @register="registerModal" width="680px">
    <template #title>
      <Icon icon="ant-design:play-circle-outlined" class="pr-1 m-1" />
      <span>{{ t('tb.gateway.action.startCommand') }}</span>
    </template>

    <div class="tip mb-4">
      {{ t('tb.gateway.launch.runTip') }}
    </div>

    <div class="space-y-4">
      <!-- Section 1: Install tools -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">
            <Icon icon="i-ant-design:tool-outlined" class="mr-2 text-primary" />
            {{ t('tb.gateway.launch.installTools') }}
          </div>
          <a-button type="default" @click="openDocs">
            <Icon icon="i-ant-design:file-text-outlined" /> {{ t('tb.gateway.launch.docs') }}
          </a-button>
        </div>
        <div class="note">Use the instructions to download, install and setup docker compose</div>
      </div>

      <!-- Section 2: Download compose -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">
            <Icon icon="i-ant-design:cloud-download-outlined" class="mr-2 text-primary" />
            {{ t('tb.gateway.launch.downloadConfig') }}
          </div>
          <a-button type="primary" @click="handleDownload" :loading="downloading">
            <Icon icon="i-ant-design:download-outlined" /> {{ t('tb.gateway.launch.download') }}
          </a-button>
        </div>
        <div class="note">{{ t('tb.gateway.launch.downloadNote') }}</div>
      </div>

      <!-- Section 3: Launch command -->
      <div class="section">
        <div class="section-title mb-1">
          <Icon icon="i-ant-design:play-circle-outlined" class="mr-2 text-primary" /> {{ t('tb.gateway.launch.title') }}
        </div>
        <div class="note mb-2">
          {{ t('tb.gateway.launch.note') }}
        </div>
        <div class="flex items-center">
          <Textarea :value="launchCmd" readonly auto-size class="codebox" />
          <a-button shape="circle" class="ml-2" @click="copyCmd" :title="t('common.copyText') || 'Copy'">
            <Icon icon="i-ant-design:copy-outlined" />
          </a-button>
        </div>
      </div>
    </div>
  </BasicModal>
</template>

<script lang="ts" setup name="ViewsTbGatewayLaunchCommand">
  import { ref } from 'vue';
  import { Textarea } from 'ant-design-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Icon } from '/@/components/Icon';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { downloadGatewayDockerCompose } from '/@/api/tb/gateways/list';
  import { copyToClipboard } from '/@/utils';

  const emit = defineEmits(['register']);
  const { t } = useI18n('tb');
  const { showMessage } = useMessage();

  const record = ref<any>({});
  const downloading = ref(false);
  const launchCmd = ref('docker compose up');

  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({ loading: false });
    record.value = data || {};
  });

  function openDocs() {
    window.open('https://docs.docker.com/compose/install/', '_blank');
  }

  async function handleDownload() {
    try {
      downloading.value = true;
      await downloadGatewayDockerCompose(record.value?.entityId?.id);
    } catch (e) {
      console.error(e);
      showMessage(t('tb.gateway.launch.downloadError'), 'error');
    } finally {
      downloading.value = false;
    }
  }

  async function copyCmd() {
    try {
      copyToClipboard(launchCmd.value, t('common.copySuccess'));
    } catch (e) {
      console.error(e);
    }
  }
</script>
<style lang="less" scoped>
  .tip {
    color: @text-color-secondary;
  }

  .section {
    border: 1px solid @border-color-base;
    border-radius: @border-radius-base;
    padding: 16px;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
    }

    .note {
      color: @text-color-secondary;
      font-size: 12px;
    }

    .codebox {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      background-color: @input-bg;
      color: @text-color;
      border-radius: @border-radius-base;
      resize: none;

      &:hover {
        border-color: @primary-color-hover;
      }
    }
  }
</style>
