<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <!-- Max number of workers -->
    <FormItem
      :label="t('tb.gateway.details.mqtt.workers.maxWorkers')"
      name="maxNumberOfWorkers"
      :rules="[{ required: true, message: t('tb.gateway.details.mqtt.workers.maxWorkersRequired') }]"
    >
      <div class="flex items-center gap-2">
        <InputNumber
          v-model:value="formState.maxNumberOfWorkers"
          :min="1"
          :max="1000"
          placeholder="100"
          class="flex-1"
        />
        <Tooltip :title="t('tb.gateway.details.mqtt.workers.maxWorkersTooltip')">
          <Icon :icon="'ant-design:info-circle-outlined'" class="text-gray-400" />
        </Tooltip>
      </div>
    </FormItem>

    <!-- Max messages queue per worker -->
    <FormItem
      :label="t('tb.gateway.details.mqtt.workers.maxMessagesQueue')"
      name="maxMessageNumberPerWorker"
      :rules="[{ required: true, message: t('tb.gateway.details.mqtt.workers.maxMessagesQueueRequired') }]"
    >
      <div class="flex items-center gap-2">
        <InputNumber
          v-model:value="formState.maxMessageNumberPerWorker"
          :min="1"
          :max="1000"
          placeholder="10"
          class="flex-1"
        />
        <Tooltip :title="t('tb.gateway.details.mqtt.workers.maxMessagesQueueTooltip')">
          <Icon :icon="'ant-design:info-circle-outlined'" class="text-gray-400" />
        </Tooltip>
      </div>
    </FormItem>
  </Form>
</template>

<script lang="ts" setup name="Workers">
  import { ref, watch, PropType } from 'vue';
  import { Form, FormItem, InputNumber, Tooltip } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { cloneDeep } from 'lodash-es';

  import { Icon } from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';

  interface WorkersConfig {
    maxNumberOfWorkers: number;
    maxMessageNumberPerWorker: number;
  }

  const props = defineProps({
    config: {
      type: Object as PropType<Partial<WorkersConfig>>,
      default: () => ({}),
    },
  });

  const formRef = ref<FormInstance>();
  const { t } = useI18n();

  const initialState: WorkersConfig = {
    maxNumberOfWorkers: 100,
    maxMessageNumberPerWorker: 10,
  };

  const formState = ref<WorkersConfig>(cloneDeep(initialState));

  watch(
    () => [props.config],
    () => {
      formState.value = cloneDeep(initialState);
      if (props.config) {
        formState.value = {
          ...formState.value,
          ...props.config,
        };
      }
    },
    { immediate: true, deep: true },
  );

  async function getConfiguration() {
    const data = await formRef.value?.validate();
    if (!data) {
      throw new Error(t('tb.gateway.details.mqtt.workers.validationFailed'));
    }

    return {
      configurationJson: {
        broker: {
          maxNumberOfWorkers: formState.value.maxNumberOfWorkers,
          maxMessageNumberPerWorker: formState.value.maxMessageNumberPerWorker,
        },
      },
    };
  }

  defineExpose({ getConfiguration });
</script>

<style scoped>
  .flex-1 {
    flex: 1;
  }
</style>
