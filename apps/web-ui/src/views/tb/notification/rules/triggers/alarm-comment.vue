<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm } from '#/adapter/form';
import {
  AlarmSearchStatus,
  alarmSearchStatusOptions,
  AlarmSeverity,
  alarmSeverityLabel,
} from '#/enums';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const alarmSeverities = [
  AlarmSeverity.CRITICAL,
  AlarmSeverity.MAJOR,
  AlarmSeverity.MINOR,
  AlarmSeverity.WARNING,
  AlarmSeverity.INDETERMINATE,
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
      formItemClass: 'sm:col-span-2',
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
        options: alarmSearchStatusOptions().filter(
          ({ value }) => value !== AlarmSearchStatus.ANY,
        ),
        placeholder: $t('notification.features.rule.trigger.alarmAnyStatus'),
      },
      defaultValue: [],
      fieldName: 'alarmStatuses',
      label: $t('notification.features.rule.trigger.alarmStatuses'),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('notification.features.rule.trigger.onlyUserComments'),
        description: $t(
          'notification.features.rule.trigger.onlyUserCommentsHint',
        ),
      },
      defaultValue: false,
      fieldName: 'onlyUserComments',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t('notification.features.rule.trigger.notifyOnCommentUpdate'),
        description: $t(
          'notification.features.rule.trigger.notifyOnCommentUpdateHint',
        ),
      },
      defaultValue: false,
      fieldName: 'notifyOnCommentUpdate',
      hideLabel: true,
      formItemClass: 'sm:col-span-2',
    },
  ],
});

async function validate() {
  return await formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  const alarmTypes = [
    ...new Set<string>(
      (values.alarmTypes ?? [])
        .map((value: string) => value.trim())
        .filter(Boolean),
    ),
  ];
  return {
    alarmTypes: alarmTypes.length > 0 ? alarmTypes : null,
    alarmSeverities: values.alarmSeverities ?? [],
    alarmStatuses: values.alarmStatuses ?? [],
    onlyUserComments: Boolean(values.onlyUserComments),
    notifyOnCommentUpdate: Boolean(values.notifyOnCommentUpdate),
  };
}

onMounted(async () => {
  await formApi.setValues({
    alarmTypes: props.config?.alarmTypes ?? [],
    alarmSeverities: props.config?.alarmSeverities ?? [],
    alarmStatuses: props.config?.alarmStatuses ?? [],
    onlyUserComments: props.config?.onlyUserComments ?? false,
    notifyOnCommentUpdate: props.config?.notifyOnCommentUpdate ?? false,
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.alarmCommentTitle') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.alarmCommentHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
