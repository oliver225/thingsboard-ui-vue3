<template>
  <div class="shell-wrap h-full pb-4" :class="themeClass">
    <Terminal
      ref="shellTerminalRef"
      class="shell-terminal"
      name="shell-terminal"
      :context="gatewayName"
      :show-header="false"
      :theme="theme"
      :context-suffix="contextSuffix"
      :init-log="initLog"
      @exec-cmd="onExecCmd"
    />
  </div>
</template>

<script setup lang="ts">
  import { Terminal, type FailedFunc, type SuccessFunc, type Message } from 'vue-web-terminal';
  import { computed, onMounted, ref, unref } from 'vue';
  import { useRoute } from 'vue-router';

  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { ThemeEnum } from '/@/enums/appEnum';

  import { RpcSendResult, rpcSendTwoway } from '/@/api/tb/gateways/rpc';

  const props = defineProps({
    gatewayName: { type: String, default: () => '' },
  });

  const route = useRoute();
  const gatewayId = route.params.gatewayId as string;

  const { getDarkMode } = useRootSetting();
  const { t } = useI18n('');
  const shellTerminalRef = ref<InstanceType<typeof Terminal>>();

  const termInfo = ref<RpcSendResult>();

  const contextSuffix = computed(() => ` ${termInfo.value?.cwd ?? '/'}>`);

  const valueColorClass = computed(() => (theme.value === 'dark' ? 'text-white' : 'text-gray-900'));
  const initLog = computed<Message[]>(() => [
    { type: 'html', content: `<span class="text-gray-400">${t('tb.gateway.details.shell.welcome')}</span>` },
    {
      type: 'html',
      content: `<span class=\"text-gray-400\">${t('tb.gateway.details.shell.currentTarget')} </span> <span class=\"${valueColorClass.value} font-bold\">${props.gatewayName}</span>`,
    },
    { type: 'html', content: `<span class="text-gray-400">${t('tb.gateway.details.shell.remotePlatformInfo')}</span>` },
  ]);

  const theme = computed(() => (unref(getDarkMode) === ThemeEnum.DARK ? 'dark' : 'dark'));
  const themeClass = computed(() => (theme.value === 'dark' ? 'theme-dark' : 'theme-light'));

  onMounted(async () => {
    await fetchTermInfo(true);
    shellTerminalRef.value?.focus(true);
  });

  async function fetchTermInfo(pushInfo = false) {
    try {
      const res = await rpcSendTwoway(gatewayId, { method: 'getTermInfo', params: undefined, timeout: 5000 });
      termInfo.value = res;
      if (pushInfo) {
        // 推送平台信息
        shellTerminalRef.value?.pushMessage([
          {
            type: 'html',
            content: `<span class=\"text-gray-400\">${t('tb.gateway.details.shell.os')}</span> <span class=\"${valueColorClass.value} font-bold\">${termInfo.value?.platform ?? ''}</span>`,
          },
          {
            type: 'html',
            content: `<span class=\"text-gray-400\">${t('tb.gateway.details.shell.release')}</span> <span class=\"${valueColorClass.value} font-bold\">${termInfo.value?.release ?? ''}</span>`,
          },
        ]);
      }
    } catch (e) {
      shellTerminalRef.value?.pushMessage({
        type: 'normal',
        class: 'error',
        content: t('tb.gateway.details.shell.failedToGetInfo'),
      });
    }
  }

  const onExecCmd = async (key: string, command: string, success: SuccessFunc, failed: FailedFunc) => {
    const cmd = (command || '').trim();
    if (!cmd) return success({ type: 'normal', content: '' });

    try {
      const resSend = await rpcSendTwoway(gatewayId, {
        method: 'sendCommand',
        params: { command: cmd, cwd: termInfo.value?.cwd ?? '' },
        timeout: 5000,
      });

      if (!resSend?.ok) return failed(t('tb.gateway.details.shell.commandFailed'));

      // 获取执行结果（一次性拉取；如需流式可做轮询/WS）
      const resStatus = await rpcSendTwoway(gatewayId, { method: 'getCommandStatus', timeout: 5000 });
      const lines: string[] = (resStatus?.data ?? []).map((i: any) => i?.stdout || i?.stderr || '').filter(Boolean);
      const output = lines.join('\n');

      termInfo.value!.cwd = resStatus?.cwd;
      return success({ type: 'ansi', content: output || '' });
    } catch (e: any) {
      return failed(e?.message || t('tb.gateway.details.shell.executeError'));
    }
  };
</script>

<style scoped>
  .shell-wrap {
    height: 100%;
  }
  .shell-terminal {
    height: 100%;
  }

  /* 优化终端外观 */
  ::v-deep(.t-container) {
    box-shadow: none !important;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
  }
  ::v-deep(.t-main) {
    padding: 6px 8px;
  }
  ::v-deep(.t-terminal) {
    font-family: Menlo, Consolas, SFMono-Regular, ui-monospace, monospace;
    font-size: 13px;
    line-height: 1.5;
  }
  ::v-deep(.t-body) {
    padding: 6px 8px;
  }
  ::v-deep(.t-input) {
    padding: 6px 8px;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
  }
</style>
