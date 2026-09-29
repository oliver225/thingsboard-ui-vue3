<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

const lifecycleEvents = ['STARTED', 'UPDATED', 'STOPPED'] as const;
const lifecycleEventOptions = lifecycleEvents.map((event) => ({
  label: $t(`notification.features.rule.trigger.lifecycleEvent${event}`),
  value: event,
}));

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  commonConfig: {
    colon: false,
    componentProps: { class: 'w-full' },
    labelClass: 'text-sm font-medium',
    formItemClass: 'min-w-0 pb-5',
  },
  wrapperClass: 'grid-cols-1 gap-x-5',
  showDefaultActions: false,
  schema: [
    {
      component: 'EntityInput',
      componentProps: {
        entityType: 'RULE_CHAIN',
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.rule.trigger.lifecycleRuleChainsPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'ruleChains',
      label: $t('notification.features.rule.trigger.lifecycleRuleChains'),
      description: $t(
        'notification.features.rule.trigger.lifecycleRuleChainsHint',
      ),
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        allowClear: true,
        options: lifecycleEventOptions,
        placeholder: $t(
          'notification.features.rule.trigger.lifecycleAllEvents',
        ),
      },
      defaultValue: [],
      fieldName: 'ruleChainEvents',
      label: $t('notification.features.rule.trigger.lifecycleRuleChainEvents'),
      description: $t('notification.features.rule.trigger.lifecycleEventsHint'),
      rules: z.array(z.enum(lifecycleEvents)),
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t(
          'notification.features.rule.trigger.lifecycleOnlyRuleChainFailures',
        ),
        description: $t(
          'notification.features.rule.trigger.lifecycleOnlyFailuresHint',
        ),
      },
      defaultValue: false,
      fieldName: 'onlyRuleChainLifecycleFailures',
      hideLabel: true,
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t(
          'notification.features.rule.trigger.lifecycleTrackRuleNodeEvents',
        ),
        description: $t(
          'notification.features.rule.trigger.lifecycleTrackRuleNodeEventsHint',
        ),
      },
      defaultValue: false,
      fieldName: 'trackRuleNodeEvents',
      formItemClass: 'border-t border-border pt-5',
      hideLabel: true,
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        allowClear: true,
        options: lifecycleEventOptions,
        placeholder: $t(
          'notification.features.rule.trigger.lifecycleAllEvents',
        ),
      },
      defaultValue: [],
      fieldName: 'ruleNodeEvents',
      label: $t('notification.features.rule.trigger.lifecycleRuleNodeEvents'),
      description: $t('notification.features.rule.trigger.lifecycleEventsHint'),
      rules: z.array(z.enum(lifecycleEvents)),
      dependencies: {
        triggerFields: ['trackRuleNodeEvents'],
        resolve: ({ values }) => ({ if: Boolean(values.trackRuleNodeEvents) }),
      },
    },
    {
      component: 'TbSwitch',
      componentProps: {
        title: $t(
          'notification.features.rule.trigger.lifecycleOnlyRuleNodeFailures',
        ),
        description: $t(
          'notification.features.rule.trigger.lifecycleOnlyFailuresHint',
        ),
      },
      defaultValue: false,
      fieldName: 'onlyRuleNodeLifecycleFailures',
      hideLabel: true,
      dependencies: {
        triggerFields: ['trackRuleNodeEvents'],
        resolve: ({ values }) => ({ if: Boolean(values.trackRuleNodeEvents) }),
      },
    },
  ],
});

async function validate() {
  return formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  return {
    ruleChains: values.ruleChains ?? [],
    ruleChainEvents: values.ruleChainEvents ?? [],
    onlyRuleChainLifecycleFailures: Boolean(
      values.onlyRuleChainLifecycleFailures,
    ),
    trackRuleNodeEvents: Boolean(values.trackRuleNodeEvents),
    ruleNodeEvents: values.ruleNodeEvents ?? [],
    onlyRuleNodeLifecycleFailures: Boolean(
      values.onlyRuleNodeLifecycleFailures,
    ),
  };
}

onMounted(async () => {
  const config = props.config;
  await formApi.setValues({
    ruleChains: config?.ruleChains ?? [],
    ruleChainEvents: config?.ruleChainEvents ?? [],
    onlyRuleChainLifecycleFailures:
      config?.onlyRuleChainLifecycleFailures ?? false,
    trackRuleNodeEvents: config?.trackRuleNodeEvents ?? false,
    ruleNodeEvents: config?.ruleNodeEvents ?? [],
    onlyRuleNodeLifecycleFailures:
      config?.onlyRuleNodeLifecycleFailures ?? false,
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.lifecycleTitle') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.lifecycleHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
