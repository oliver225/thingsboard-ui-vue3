<template>
  <div class="debug-setting">
    <Popconfirm
      :ok-text="t('tb.ruleChain.debugSetting.apply')"
      :cancel-text="t('tb.ruleChain.debugSetting.cancel')"
      placement="left"
      :disabled="!props.editAble"
      @cancel="handleCancel"
      @confirm="handleConfirm"
    >
      <template #title> {{ t('tb.ruleChain.debugSetting.title') }} </template>
      <template #icon>
        <Icon icon="i-ant-design:bug-filled" :size="16" />
      </template>
      <template #description>
        <div class="w-90">
          <Alert type="success">
            <template #message>
              <span class="text-xs"> {{ t('tb.ruleChain.debugSetting.rateLimitTip') }} </span>
            </template>
          </Alert>
          <div class="mt-4 flex items-center">
            <Switch size="small" v-model:checked="status.failuresEnabled" />
            <span class="ml-4">{{ t('tb.ruleChain.debugSetting.onlyFailures', { duration: '24/7' }) }}</span>
            <Tooltip placement="right" :title="t('tb.ruleChain.debugSetting.onlyFailuresTip')">
              <Icon :icon="'ant-design:info-circle-outlined'" />
            </Tooltip>
          </div>
          <div class="mt-2 flex items-center">
            <Switch size="small" v-model:checked="status.allEnabled" @change="handleAllEnableChange" />
            <span class="ml-4">
              {{
                t('tb.ruleChain.debugSetting.allMessages', {
                  minutes: maxDebugModeDurationMinutes,
                })
              }}
            </span>
            <Tooltip placement="right" :title="t('tb.ruleChain.debugSetting.allMessagesTip')">
              <Icon :icon="'ant-design:info-circle-outlined'" />
            </Tooltip>
          </div>
        </div>
      </template>
      <Button type="primary" ghost class="debug-button">
        <Icon icon="i-ant-design:bug-filled" :size="16" />
        <span>{{ label }}</span>
      </Button>
    </Popconfirm>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onUnmounted, reactive, onMounted } from 'vue';
  import { Button, Popconfirm, Alert, Switch, Tooltip } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStore } from '/@/store/modules/user';
  import { DebugSettings } from '/#/store';

  const userStore = useUserStore();

  const { t } = useI18n();

  /** 最大调试模式持续时间（分钟） */
  const maxDebugModeDurationMinutes = ref(15);

  /** Props 定义 */
  const props = defineProps<{ value: DebugSettings | undefined; editAble?: boolean }>();
  /** Emits 定义 */
  const emit = defineEmits<{ (e: 'update:value', value: DebugSettings): void }>();

  /** 当前时间（秒级刷新）用于倒计时显示 */
  const now = ref(Date.now());

  const status = reactive({
    failuresEnabled: false, // 失败开关
    allEnabled: false, // 所有消息开关（由外部状态+倒计时推导 / 手动覆盖）
    allEnabledUntil: 0, // 外部传入的截止时间戳（ms）
    manualAllEnabledLocked: false, // 手动修改后锁定，倒计时不再自动覆盖 allEnabled
  });

  let tickTimer: number | null = null;

  /** 启动 1s tick */
  function startTick() {
    stopTick();
    tickTimer = window.setInterval(refreshStatusFromTime, 1000);
  }
  /** 停止 tick */
  function stopTick() {
    if (tickTimer) {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  /** 从外部 props 同步内部状态（不触发 emit） */
  function syncFromExternal(val: DebugSettings | undefined) {
    const until = val?.allEnabledUntil || 0;
    status.allEnabledUntil = until;
    status.allEnabled = val?.allEnabled === true || until > Date.now();
    status.failuresEnabled = val?.failuresEnabled === true;
    status.manualAllEnabledLocked = false; // 新外部值到来，解除手动锁
  }

  /** 每秒刷新：更新时间并根据倒计时自动更新 allEnabled（除非被手动锁定） */
  function refreshStatusFromTime() {
    now.value = Date.now();
    if (status.manualAllEnabledLocked) return; // 手动锁定后不再自动覆盖
    const externalAllEnabled = props.value?.allEnabled === true;
    if (externalAllEnabled) {
      status.allEnabled = true; // 永久开启
    } else if (status.allEnabledUntil > now.value) {
      status.allEnabled = true; // 倒计时内视为开启
    } else {
      status.allEnabled = false; // 已过期
    }
  }

  onMounted(() => {
    userStore.getSystemParams().then((res) => {
      maxDebugModeDurationMinutes.value = res.maxDebugModeDurationMinutes || 15;
    });
  });

  // 监听外部 value 变化
  watch(
    () => props.value,
    (val) => {
      syncFromExternal(val);
      startTick();
    },
    { immediate: true },
  );

  onUnmounted(stopTick);

  /** 手动切换 “所有消息” 开关 */
  // Ant Design Vue Switch @change 传入 (checked: boolean | string | number, event)
  function handleAllEnableChange(checked: boolean | string | number) {
    status.manualAllEnabledLocked = true; // 锁定，倒计时不覆盖该手动值
    status.allEnabled = !!checked;
  }

  /** Popconfirm 取消：还原外部真实状态 */
  function handleCancel() {
    syncFromExternal(props.value);
  }

  /** Popconfirm 确认：向外发送更新（保持现有业务逻辑：allEnabledUntil 重置为 0） */
  function handleConfirm() {
    emit('update:value', {
      failuresEnabled: status.failuresEnabled,
      allEnabled: status.allEnabled,
      allEnabledUntil: 0,
    });
  }

  /** 剩余时间文案（国际化） */
  const remainingText = computed(() => {
    const until = status.allEnabledUntil;
    if (until > now.value) {
      const diff = until - now.value;
      if (diff >= 60_000) return t('tb.ruleChain.debugSetting.minutes', { count: Math.ceil(diff / 60_000) });
      if (diff > 0) return t('tb.ruleChain.debugSetting.seconds', { count: Math.ceil(diff / 1_000) });
      return '';
    }
    return t('tb.ruleChain.debugSetting.minutes', { count: maxDebugModeDurationMinutes.value });
  });

  /** 按钮标签文案 */
  const label = computed(() => {
    if (status.allEnabledUntil > now.value)
      return t('tb.ruleChain.debugSetting.remaining', { time: remainingText.value });
    if (status.allEnabled)
      return t('tb.ruleChain.debugSetting.remaining', {
        time: t('tb.ruleChain.debugSetting.minutes', { count: maxDebugModeDurationMinutes.value }),
      });
    if (status.failuresEnabled) return t('tb.ruleChain.debugSetting.failures');
    return t('tb.ruleChain.debugSetting.disabled');
  });
</script>
<style lang="less">
  .debug-setting {
    .debug-button {
      border-radius: 25rem !important;
      color: @primary-color !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      padding: 0 1.6rem !important;
    }
  }
</style>
