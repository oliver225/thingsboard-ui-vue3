<template>
  <BasicModal @register="registerModal" width="90%">
    <template #title>RPC debug terminal</template>
    <div style="height: 60vh">
      <Terminal
        ref="shellTerminalRef"
        class="shell-terminal"
        name="shell-terminal"
        :context="gatewayName"
        :show-header="false"
        :theme="theme"
        :init-log="initLog"
        :command-store="commandStore"
        :enableDefaultCommand="true"
        @exec-cmd="onExecCmd"
      />
    </div>
  </BasicModal>
</template>

<script setup lang="ts" name="RpcTerminalModal">
  import { Terminal, type FailedFunc, type SuccessFunc, type Message } from 'vue-web-terminal';
  import { computed, ref, unref } from 'vue';
  import { useRoute } from 'vue-router';

  import { BasicModal, useModalInner } from '/@/components/Modal';

  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';

  import { rpcSendTwoway } from '/@/api/tb/gateways/rpc';

  import { COMMAND_OPTIONS } from './enum';

  const props = defineProps({
    gatewayName: { type: String, default: () => '' },
  });

  const [registerModal] = useModalInner(() => {
    if (shellTerminalRef.value) {
      shellTerminalRef.value?.focus(true);
    }
  });

  const route = useRoute();
  const gatewayId = route.params.gatewayId as string;

  const { getDarkMode } = useRootSetting();
  const shellTerminalRef = ref<InstanceType<typeof Terminal>>();

  const commandStore = [
    {
      key: 'gateway',
      title: 'gateway',
      group: 'local',
      usage: 'gateway_[pattern]',
      description: 'Show command document.',
      example: COMMAND_OPTIONS.map((item) => {
        return {
          des: item.label,
          cmd: item.value,
        };
      }),
    },
  ];

  const valueColorClass = computed(() => (theme.value === 'dark' ? 'text-white' : 'text-gray-900'));
  const initLog = computed<Message[]>(() => [
    { type: 'html', content: '<span class="text-gray-400">Welcome to ThingsBoard RPC remote shell.</span>' },
    {
      type: 'html',
      content: `<span class=\"text-gray-400\">Current target device for RPC terminal: </span> <span class=\"${valueColorClass.value} font-bold\">${props.gatewayName}</span>`,
    },
    {
      type: 'html',
      content: `<span class="text-gray-400">Please type <span  class=\"${valueColorClass.value} font-bold\">helps</span> to see usage.</span>`,
    },
  ]);

  const theme = computed(() => (unref(getDarkMode) === ThemeEnum.DARK ? 'dark' : 'dark'));

  const onExecCmd = async (key: string, command: string, success: SuccessFunc, failed: FailedFunc) => {
    const cmd = (command || '').trim();
    if (!cmd) return success({ type: 'normal', content: '' });

    if (key === 'helps') {
      return success([
        { type: 'html', content: `<span  class=\"${valueColorClass.value} font-bold\">Usage:</span> ` },
        {
          type: 'html',
          content: `<span class="text-gray-400">   <method> [params body]] </span>`,
        },
        { type: 'html', content: `<span  class=\"${valueColorClass.value} font-bold\">Example 1:</span> ` },
        {
          type: 'html',
          content: `<span class="text-gray-400">   myRemoteMethod1 myText </span>`,
        },
        { type: 'html', content: `<span  class=\"${valueColorClass.value} font-bold\">Example 2:</span> ` },
        {
          type: 'html',
          content: `<span class="text-gray-400">   myOtherRemoteMethod "{\"key1\": 2, \"key2\": \"myVal\"}" </span>`,
        },
      ]);
    }

    try {
      const resSend = await rpcSendTwoway(gatewayId, {
        method: cmd,
        params: undefined,
        timeout: 5000,
        persistent: false,
        retries: null,
      });

      return success({ type: 'ansi', content: JSON.stringify(resSend ?? '') });
    } catch (e: any) {
      return failed(e?.message || 'Execute command error.');
    }
  };
</script>
