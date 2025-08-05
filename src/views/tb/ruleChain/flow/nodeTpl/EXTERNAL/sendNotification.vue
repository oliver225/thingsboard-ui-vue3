<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <Form.Item :name="['templateId', 'entityType']" v-show="false">
      <Input v-model:value="formState.templateId.entityType" />
    </Form.Item>
    <Form.Item label="模版" :name="['templateId', 'id']" :rules="[{ required: true, message: '请选择模板!' }]">
      <Select v-model:value="formState.templateId.id" placeholder="请选择通知模版">
        <Select.Option v-for="(option, index) in templateOptions" :key="index" :value="option.value">
          {{ option.label }}
          <Tag v-for="(method, index) in option.deliveryMethods" :key="index">
            {{ method }}
          </Tag>
        </Select.Option>
      </Select>
    </Form.Item>
    <Form.Item label="收件人" name="targets" :rules="[{ required: true, message: '请选择收件人!' }]">
      <Select v-model:value="formState.targets" mode="multiple" placeholder="请选择收件人">
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
  import { NotificationType } from '/@/enums/notificationEnum';
  import { notificationTargetList } from '/@/api/tb/notificationTarget';
  import { EntityType } from '/@/enums/entityTypeEnum';

  interface Configuration {
    templateId: EntityId<EntityType.NOTIFICATION_TEMPLATE>;
    targets: [string];
  }

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
