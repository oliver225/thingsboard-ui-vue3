<template>
  <CollapseContainer :title="t('sys.account.notificationTab')" :canExpan="false">
    <template #action>
      <a-button size="small" type="link" :loading="resetting" @click="onResetClick">
        {{ t('common.resetText') }}
      </a-button>
    </template>
    <div v-if="record?.prefs" class="notifiction-container px-[30px]">
      <!-- 表头：左上角复选框控制所有行 + 各列复选框控制整列 -->
      <div class="notifiction-header flex w-full">
        <div class="notifiction-title flex items-center font-bold h-40px text-14px pl-16px w-2/5">
          <Checkbox
            :checked="allRowChecked"
            :indeterminate="allRowIndeterminate"
            @change="(e: any) => onToggleAllRows(e.target.checked)"
          >
            {{ t('tb.notification.recipient.table.type') }}
          </Checkbox>
        </div>
        <div
          v-for="m in DELIVERY_METHODS"
          :key="'header-' + m"
          class="notifiction-delivery flex items-center font-bold h-40px text-14px pl-16px w-1/5"
        >
          <Checkbox
            :checked="columnStatuses[m].checked"
            :indeterminate="columnStatuses[m].indeterminate"
            @change="(e: any) => onToggleColumn(m, e.target.checked)"
          >
            {{ methodLabel(m) }}
          </Checkbox>
        </div>
      </div>

      <!-- 行数据 -->
      <div v-for="(prefs, type) in prefsReactive" :key="type" class="notifiction-row flex w-full">
        <div class="notifiction-title flex items-center h-40px text-14px pl-16px w-2/5">
          <Checkbox
            v-model:checked="prefs.enabled"
            :indeterminate="rowIndeterminate(prefs)"
            @change="(e: any) => onRowEnabledChange(prefs, e.target.checked)"
          >
            {{ NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == type.toString())?.label || type }}
          </Checkbox>
        </div>
        <div
          v-for="m in DELIVERY_METHODS"
          :key="type + '-' + m"
          class="notifiction-delivery flex items-center h-40px text-14px pl-16px w-1/5"
        >
          <Checkbox
            v-model:checked="prefs.enabledDeliveryMethods[m]"
            :disabled="!prefs.enabled"
            @change="() => onMethodChange(prefs)"
          />
        </div>
      </div>

      <div class="notifiction-actions text-right pt-16px pb-8px">
        <a-button @click="handleSubmit" type="primary" :loading="saving">{{ t('common.saveText') }}</a-button>
      </div>
    </div>
  </CollapseContainer>
</template>
<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { Checkbox } from 'ant-design-vue';
  import { CollapseContainer } from '/@/components/Container';
  import { useI18n } from '/@/hooks/web/useI18n';
  import {
    getUserNotificationSettings,
    NotificationSettings,
    saveUserNotificationSettings,
  } from '/@/api/tb/notification';
  import { NOTIFICATION_TYPE_OPTIONS } from '/@/enums/notificationEnum';
  import { useMessage } from '/@/hooks/web/useMessage';
  const { t } = useI18n();
  const { showMessage, createConfirm } = useMessage();
  const resetting = ref(false);

  const record = ref<NotificationSettings>();
  // 支持的通知投递方式
  const DELIVERY_METHODS = ['WEB', 'EMAIL', 'SMS'] as const;
  type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

  interface NotificationPref {
    enabled: boolean;
    enabledDeliveryMethods: Record<DeliveryMethod | string, boolean>;
    [k: string]: any;
  }

  type PrefsRecord = Record<string, NotificationPref>;

  // 国际化 key 映射
  const METHOD_I18N_KEYS: Record<DeliveryMethod, string> = {
    WEB: 'tb.notification.template.method.web',
    EMAIL: 'tb.notification.template.method.email',
    SMS: 'tb.notification.template.method.sms',
  };
  const methodLabel = (m: DeliveryMethod) => t(METHOD_I18N_KEYS[m] || m);

  // 将 Map 兼容为普通对象以便 v-model 双向绑定
  function normalizeSettings(settings: NotificationSettings): NotificationSettings {
    const s: any = settings;
    const rawPrefs: any = s.prefs instanceof Map ? Object.fromEntries(s.prefs.entries()) : s.prefs || {};
    const normalized: PrefsRecord = {};
    Object.keys(rawPrefs).forEach((k) => {
      const pref = rawPrefs[k];
      const rawMethods =
        pref.enabledDeliveryMethods instanceof Map
          ? Object.fromEntries(pref.enabledDeliveryMethods.entries())
          : pref.enabledDeliveryMethods || {};
      normalized[k] = {
        ...pref,
        enabled: !!pref.enabled,
        enabledDeliveryMethods: { ...rawMethods },
      };
      // 确保所有 method key 存在（便于 v-model）
      DELIVERY_METHODS.forEach((m) => {
        if (normalized[k].enabledDeliveryMethods[m] == null) normalized[k].enabledDeliveryMethods[m] = false;
      });
    });
    s.prefs = normalized;
    return s;
  }

  const prefsReactive = computed<PrefsRecord>(() => (record.value as any)?.prefs || {});
  const prefsList = computed(() => Object.values(prefsReactive.value));

  // 顶部所有行 checkbox 状态
  const allRowChecked = computed(() => prefsList.value.length > 0 && prefsList.value.every((p) => p.enabled));
  const allRowIndeterminate = computed(() => !allRowChecked.value && prefsList.value.some((p) => p.enabled));

  function rowIndeterminate(prefs: NotificationPref) {
    const values = DELIVERY_METHODS.map((m) => !!prefs.enabledDeliveryMethods[m]);
    const anyTrue = values.some(Boolean);
    const allTrue = values.every(Boolean);
    return prefs.enabled && anyTrue && !allTrue;
  }

  // 所有列状态一次性计算，避免重复计算
  const columnStatuses = computed(() => {
    const result: Record<DeliveryMethod, { checked: boolean; indeterminate: boolean }> = {
      WEB: { checked: false, indeterminate: false },
      EMAIL: { checked: false, indeterminate: false },
      SMS: { checked: false, indeterminate: false },
    } as any;
    DELIVERY_METHODS.forEach((m) => {
      const list = prefsList.value;
      if (!list.length) return;
      const values = list.map((p) => !!p.enabledDeliveryMethods?.[m]);
      const checked = values.length > 0 && values.every(Boolean);
      const indeterminate = !checked && values.some(Boolean);
      result[m] = { checked, indeterminate };
    });
    return result;
  });

  // 事件：切换所有行
  function onToggleAllRows(checked: boolean) {
    prefsList.value.forEach((p) => {
      p.enabled = checked;
      DELIVERY_METHODS.forEach((m) => (p.enabledDeliveryMethods[m] = checked));
    });
  }

  // 事件：切换列
  function onToggleColumn(method: string, checked: boolean) {
    prefsList.value.forEach((p) => {
      if (checked) {
        p.enabled = true;
        p.enabledDeliveryMethods[method] = true;
      } else {
        p.enabledDeliveryMethods[method] = false;
        const allFalse = DELIVERY_METHODS.every((m) => !p.enabledDeliveryMethods[m]);
        if (allFalse) p.enabled = false;
      }
    });
  }

  // 事件：行启用/禁用
  function onRowEnabledChange(prefs: NotificationPref, checked: boolean) {
    if (!checked) {
      DELIVERY_METHODS.forEach((m) => (prefs.enabledDeliveryMethods[m] = false));
      return;
    }
    const allFalse = DELIVERY_METHODS.every((m) => !prefs.enabledDeliveryMethods[m]);
    if (allFalse) {
      // 默认全开（可按需只开 WEB）
      DELIVERY_METHODS.forEach((m) => (prefs.enabledDeliveryMethods[m] = true));
    }
  }

  // 事件：单个方法更改
  function onMethodChange(prefs: NotificationPref) {
    const anyTrue = DELIVERY_METHODS.some((m) => prefs.enabledDeliveryMethods[m]);
    prefs.enabled = anyTrue; // 所有都关则行也关
  }

  async function fetch() {
    const data = await getUserNotificationSettings();
    record.value = normalizeSettings(data);
  }

  onMounted(async () => {
    await fetch();
  });

  const saving = ref(false);

  function buildSubmitData() {
    const source = prefsReactive.value;
    const prefs: Record<string, { enabled: boolean; enabledDeliveryMethods: Record<DeliveryMethod, boolean> }> = {};
    Object.keys(source).forEach((type) => {
      const pref = source[type];
      const enabledDeliveryMethods = {} as Record<DeliveryMethod, boolean>;
      DELIVERY_METHODS.forEach((m) => {
        enabledDeliveryMethods[m] = !!pref.enabledDeliveryMethods?.[m];
      });
      prefs[type] = { enabled: !!pref.enabled, enabledDeliveryMethods };
    });
    return { prefs };
  }

  async function handleSubmit() {
    if (!record.value) return;
    try {
      saving.value = true;
      const submitData = buildSubmitData();
      await saveUserNotificationSettings(submitData);
      showMessage(t('sys.account.updateUserInfoSuccess'));
    } catch (error: any) {
      showMessage(error?.message || t('common.validateError'));
      console.error('save notification settings error', error);
    } finally {
      saving.value = false;
    }
  }

  function onResetClick() {
    createConfirm({
      iconType: 'warning',
      title: t('common.resetText'),
      content: '确定要重置并重新加载所有通知配置吗？未保存的更改将丢失。',
      okText: t('common.okText'),
      cancelText: t('common.cancelText'),
      onOk: async () => {
        try {
          resetting.value = true;
          await fetch();
          showMessage('已重置');
        } finally {
          resetting.value = false;
        }
      },
    });
  }
</script>
<style lang="less">
  /* 仅保留依赖 less 变量的颜色和边框，其余用 UnoCSS 工具类 */
  .notifiction-header {
    border: 1px solid @border-color-base;
    background-color: @border-color-dark;
  }
  .notifiction-row {
    border: 1px solid @border-color-base;
  }
</style>
