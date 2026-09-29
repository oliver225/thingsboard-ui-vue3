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

const alarmAssignmentActions = ['ASSIGNED', 'UNASSIGNED'] as const;
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
        options: alarmStatuses.map((value) => ({
          label: $t(`alarm.options.searchStatus.${value}`),
          value,
        })),
        placeholder: $t('notification.features.rule.trigger.alarmAnyStatus'),
      },
      defaultValue: [],
      fieldName: 'alarmStatuses',
      label: $t('notification.features.rule.trigger.alarmStatuses'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        optionFilterProp: 'label',
        options: alarmAssignmentActions.map((value) => ({
          label: $t(
            `notification.features.rule.trigger.alarmAssignmentAction${value}`,
          ),
          value,
        })),
        placeholder: $t(
          'notification.features.rule.trigger.alarmAssignmentNotifyOnRequired',
        ),
      },
      defaultValue: ['ASSIGNED'],
      fieldName: 'notifyOn',
      label: $t('notification.features.rule.trigger.alarmNotifyOn'),
      rules: z.array(z.enum(alarmAssignmentActions)).min(1, {
        message: $t(
          'notification.features.rule.trigger.alarmAssignmentNotifyOnRequired',
        ),
      }),
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
    alarmStatuses: values.alarmStatuses ?? [],
    notifyOn: values.notifyOn,
  };
}

onMounted(async () => {
  await formApi.setValues({
    alarmTypes: props.config?.alarmTypes ?? [],
    alarmSeverities: props.config?.alarmSeverities ?? [],
    alarmStatuses: props.config?.alarmStatuses ?? [],
    notifyOn: props.config?.notifyOn ?? ['ASSIGNED'],
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5 shadow-sm">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.alarmAssignmentSettings') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{
          $t('notification.features.rule.trigger.alarmAssignmentSettingsHint')
        }}
      </p>
    </div>
    <Form />
  </section>
</template>
