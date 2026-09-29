<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { AlarmSearchStatus, AlarmSeverity, alarmSeverityLabel } from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const alarmActions = [
  'CREATED',
  'SEVERITY_CHANGED',
  'ACKNOWLEDGED',
  'CLEARED',
] as const;
const alarmSeverities = [
  AlarmSeverity.CRITICAL,
  AlarmSeverity.MAJOR,
  AlarmSeverity.MINOR,
  AlarmSeverity.WARNING,
  AlarmSeverity.INDETERMINATE,
];
const alarmStatuses = [
  AlarmSearchStatus.ACTIVE,
  AlarmSearchStatus.CLEARED,
  AlarmSearchStatus.ACK,
  AlarmSearchStatus.UNACK,
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5 sm:grid-cols-2',
  showDefaultActions: false,
  schema: [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'tags',
        options: [],
        placeholder: $t('notification.features.rule.trigger.alarmAnyType'),
      },
      defaultValue: [],
      fieldName: 'alarmTypes',
      label: $t('notification.features.rule.trigger.alarmTypes'),
      description: $t('notification.features.rule.trigger.alarmTypesHint'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        optionFilterProp: 'label',
        options: alarmSeverities.map((value) => ({
          label: alarmSeverityLabel(value),
          value,
        })),
        placeholder: $t('notification.features.rule.trigger.alarmAnySeverity'),
      },
      defaultValue: [],
      fieldName: 'alarmSeverities',
      label: $t('notification.features.rule.trigger.alarmSeverities'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        optionFilterProp: 'label',
        options: alarmActions.map((value) => ({
          label: $t(`notification.features.rule.trigger.alarmAction${value}`),
          value,
        })),
        placeholder: $t(
          'notification.features.rule.trigger.alarmNotifyOnRequired',
        ),
      },
      defaultValue: ['CREATED'],
      fieldName: 'notifyOn',
      label: $t('notification.features.rule.trigger.alarmNotifyOn'),
      formItemClass: 'sm:col-span-2',
      rules: z.array(z.enum(alarmActions)).min(1, {
        message: $t('notification.features.rule.trigger.alarmNotifyOnRequired'),
      }),
    },
    {
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        disabled: (props.escalationCount ?? 0) <= 1,
        mode: 'multiple',
        optionFilterProp: 'label',
        options: alarmStatuses.map((value) => ({
          label: $t(`alarm.options.searchStatus.${value}`),
          value,
        })),
        placeholder: $t('notification.features.rule.trigger.alarmAnyStatus'),
      }),
      defaultValue: [],
      fieldName: 'clearAlarmStatuses',
      label: $t('notification.features.rule.trigger.alarmStopEscalation'),
      description: $t(
        'notification.features.rule.trigger.alarmStopEscalationHint',
      ),
      formItemClass: 'sm:col-span-2',
    },
  ],
});

async function validate() {
  return formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  return {
    alarmTypes: [
      ...new Set<string>(
        (values.alarmTypes ?? [])
          .map((value: string) => value.trim())
          .filter(Boolean),
      ),
    ],
    alarmSeverities: values.alarmSeverities ?? [],
    notifyOn: values.notifyOn,
    ...((props.escalationCount ?? 0) > 1
      ? { clearRule: { alarmStatuses: values.clearAlarmStatuses ?? [] } }
      : {}),
  };
}

onMounted(async () => {
  await formApi.setValues({
    alarmTypes: props.config?.alarmTypes ?? [],
    alarmSeverities: props.config?.alarmSeverities ?? [],
    notifyOn: props.config?.notifyOn ?? ['CREATED'],
    clearAlarmStatuses: props.config?.clearRule?.alarmStatuses ?? [],
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5 shadow-sm">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.alarmSettings') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.alarmSettingsHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
