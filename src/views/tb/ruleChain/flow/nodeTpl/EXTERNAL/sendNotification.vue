<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :name="['templateId', 'entityType']" v-show="false">
      <Input v-model:value="formState.templateId.entityType" />
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.template')"
      :name="['templateId', 'id']"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.templateRequired') }]"
    >
      <Select v-model:value="formState.templateId.id" :placeholder="t('tb.ruleChain.nodeAction.templatePlaceholder')">
        <Select.Option v-for="(option, index) in templateOptions" :key="index" :value="option.value">
          {{ option.label }}
          <Tag v-for="(method, index) in option.deliveryMethods" :key="index">
            {{ method }}
          </Tag>
        </Select.Option>
      </Select>
    </Form.Item>
    <Form.Item
      :label="t('tb.ruleChain.nodeAction.recipients')"
      name="targets"
      :rules="[{ required: true, message: t('tb.ruleChain.nodeAction.recipientsRequired') }]"
    >
      <Select
        v-model:value="formState.targets"
        mode="multiple"
        :placeholder="t('tb.ruleChain.nodeAction.recipientsPlaceholder')"
      >
        <Select.Option v-for="(option, index) in targetOptions" :key="index" :value="option.value">
          {{ option.label }}
        </Select.Option>
      </Select>
    </Form.Item>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'send-notification',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { Form, Input, Select, Tag } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { notificationTemplateList } from '/@/api/tb/notificationTemplate';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { notificationTargetList } from '/@/api/tb/notificationTarget';
  import { EntityType } from '/@/enums/entityTypeEnum';

  interface Configuration {
    templateId: EntityId<EntityType.NOTIFICATION_TEMPLATE>;
    targets: [string];
  }

  const { t } = useI18n('tb');

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const templateOptions = ref<Array<any>>([]);
  const targetOptions = ref<Array<any>>([]);

  const formRef = ref<FormInstance>();

  const formState = reactive<any>({
    templateId: { entityType: EntityType.NOTIFICATION_TEMPLATE, id: '' },
    targets: [],
  });

  watch(
    () => props.configuration,
    async () => {
      await fetchTemplateList();
      await fetchTargetList();
      formState.templateId = props.configuration.templateId || { entityType: EntityType.NOTIFICATION_TEMPLATE, id: '' };
      formState.targets = props.configuration.targets;
    },
    { immediate: true },
  );

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  async function fetchTemplateList() {
    const templateListResult = await notificationTemplateList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      NotificationType.RULE_NODE,
    );
    templateOptions.value = templateListResult.data.map((item) => {
      return {
        value: item.id.id,
        label: item.name,
        deliveryMethods: Object.keys(item.configuration.deliveryMethodsTemplates as any),
      };
    });
  }

  async function fetchTargetList() {
    const targetListResult = await notificationTargetList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      NotificationType.RULE_NODE,
    );
    targetOptions.value = targetListResult.data.map((item) => ({ value: item.id.id, label: item.name }));
  }

  defineExpose({ getConfiguration });
</script>
