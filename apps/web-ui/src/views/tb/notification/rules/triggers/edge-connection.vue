<script lang="ts" setup>
import type { NotificationRuleTriggerConfig } from '#/api/tb/notification-rule';

import { onMounted } from 'vue';

import { useVbenForm, z } from '#/adapter/form';
import { $t } from '#/locales';

const props = defineProps<{
  config?: NotificationRuleTriggerConfig;
  escalationCount?: number;
}>();

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
        entityType: 'EDGE',
        multiple: true,
        showSearch: true,
        placeholder: $t(
          'notification.features.rule.trigger.edgeConnectionEdgesPlaceholder',
        ),
      },
      defaultValue: [],
      fieldName: 'edges',
      label: $t('notification.features.rule.trigger.edgeConnectionEdges'),
      description: $t(
        'notification.features.rule.trigger.edgeConnectionEdgesHint',
      ),
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        allowClear: true,
        options: [
          {
            label: $t(
              'notification.features.rule.trigger.edgeConnectionConnected',
            ),
            value: 'CONNECTED',
          },
          {
            label: $t(
              'notification.features.rule.trigger.edgeConnectionDisconnected',
            ),
            value: 'DISCONNECTED',
          },
        ],
        placeholder: $t(
          'notification.features.rule.trigger.edgeConnectionAllEvents',
        ),
      },
      defaultValue: [],
      fieldName: 'notifyOn',
      label: $t('notification.features.rule.trigger.edgeConnectionNotifyOn'),
      description: $t(
        'notification.features.rule.trigger.edgeConnectionNotifyOnHint',
      ),
      rules: z.array(z.enum(['CONNECTED', 'DISCONNECTED'])),
    },
  ],
});

async function validate() {
  return formApi.validate();
}

async function getValues(): Promise<NotificationRuleTriggerConfig> {
  const values = await formApi.getValues();
  return {
    edges: values.edges ?? [],
    notifyOn: values.notifyOn ?? [],
  };
}

onMounted(async () => {
  await formApi.setValues({
    edges: props.config?.edges ?? [],
    notifyOn: props.config?.notifyOn ?? [],
  });
});

defineExpose({ validate, getValues });
</script>

<template>
  <section class="rounded-xl border bg-card p-5">
    <div class="mb-5 space-y-1">
      <h3 class="text-sm font-medium">
        {{ $t('notification.features.rule.trigger.edgeConnectionTitle') }}
      </h3>
      <p class="text-muted-foreground text-sm">
        {{ $t('notification.features.rule.trigger.edgeConnectionHint') }}
      </p>
    </div>
    <Form />
  </section>
</template>
