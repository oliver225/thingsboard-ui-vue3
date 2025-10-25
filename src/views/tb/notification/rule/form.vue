<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
      <Steps size="small" v-model:current="currentStep" style="margin-top: 12px">
  <Steps.Step :title="t('tb.notification.rule.form.stepBasic')" />
        <Steps.Step
          :title="NOTIFICATION_TYPE_OPTIONS.find((item) => item.value == triggerType)?.label || triggerType"
        />
      </Steps>
    </template>
    <BasicForm @register="registerForm" v-show="currentStep == 0">
      <template #templateId="{ model, field }">
  <Select v-model:value="model[field]" :placeholder="t('tb.notification.rule.form.notificationTemplate')">
          <Select.Option v-for="(option, index) in templateOptions" :key="index" :value="option.value">
            {{ option.label }}
            <Tag v-for="(method, index) in option.deliveryMethods" :key="index">
              {{ method }}
            </Tag>
          </Select.Option>
        </Select>
      </template>
      <template #escalationTable>
        <div class="ant-form-item">
          <div class="ant-row ant-form-row">
            <div class="ant-col ant-form-item-label">
              <label for="escalationTable" class="ant-form-item-required ant-form-item-no-colon leading-8">{{
                t('tb.notification.rule.form.escalationOrder')
              }}</label>
            </div>
            <div class="ant-col ant-form-item-control">
              <InputGroup compact v-for="(escalation, index) in escalationList" :key="index" style="margin-bottom: 8px">
                <Select
                  v-model:value="escalationList[index].second"
                  :disabled="index == 0"
                  :options="escalationTimeOption"
                  style="width: 25%"
                />
                <Select
                  v-model:value="escalationList[index].targets"
                  mode="multiple"
                  :placeholder="t('tb.notification.rule.form.recipientsGroup')"
                  style="width: 70%"
                  :options="recipientOptions"
                />
                <Tooltip :title="t('tb.notification.rule.form.escalationRemove')" v-if="index > 0">
                  <a-button type="text" shape="circle" @click="handleRemoveEscalation(index)">
                    <Icon icon="ant-design:close-outlined" :size="20" />
                  </a-button>
                </Tooltip>
              </InputGroup>
              <a-button type="primary" size="small" @click="handleAddEscalation">
                <Icon icon="i-fluent:add-12-filled" /> {{ t('tb.notification.rule.form.escalationAddStage') }}
              </a-button>
            </div>
          </div>
        </div>
      </template>
    </BasicForm>
    <div v-show="currentStep == 1">
      <EntitiesLimit v-if="NotificationType.ENTITIES_LIMIT == triggerType" ref="entitiesLimitForm" />
      <NewPlatformVersion v-if="NotificationType.NEW_PLATFORM_VERSION == triggerType" ref="newPlatformVersionForm" />
      <ApiUsageLimit v-if="NotificationType.API_USAGE_LIMIT == triggerType" ref="apiUsageLimitForm" />
      <DeviceActivity v-if="NotificationType.DEVICE_ACTIVITY == triggerType" ref="deviceActivityForm" />
      <EntityAction v-if="NotificationType.ENTITY_ACTION == triggerType" ref="entityActionForm" />
      <Alarm v-if="NotificationType.ALARM == triggerType" ref="alarmForm" />
      <AlarmAssignment v-if="NotificationType.ALARM_ASSIGNMENT == triggerType" ref="alarmAssignmentForm" />
      <AlarmComment v-if="NotificationType.ALARM_COMMENT == triggerType" ref="alarmCommentForm" />
      <ruleEngineLifecycleEvent
        v-if="NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT == triggerType"
        ref="ruleEngineLifecycleForm"
      />
    </div>
    <template #footer>
      <a-button v-if="currentStep > 0" @click="prev" style="float: left">
        <Icon icon="ant-design:left-outlined" />{{ t('tb.notification.common.prev') }}
      </a-button>
      <a-button @click="close">
        <Icon icon="ant-design:close-outlined" />{{ t('tb.notification.common.cancel') }}
      </a-button>
      <a-button :loading="confirmLoading" v-if="currentStep == 0" type="primary" @click="next">
        <Icon icon="ant-design:right-outlined" />{{ t('tb.notification.common.next') }}
      </a-button>
      <a-button :loading="confirmLoading" v-if="currentStep == 1" type="primary" @click="handleSubmit">
        <Icon icon="ant-design:check-outlined" />{{ t('tb.notification.common.ok') }}
      </a-button>
    </template>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbNotificationRuleForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { Tooltip, Select, Tag, Steps, InputGroup } from 'ant-design-vue';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { getNotificationRuleById, saveNotificationRule, NotificationRule } from '/@/api/tb/notificationRule';
  import { Authority } from '/@/enums/authorityEnum';
  import { NOTIFICATION_TYPE_OPTIONS, NotificationType } from '/@/enums/notificationEnum';
  import { notificationTemplateList } from '/@/api/tb/notificationTemplate';
  import { notificationTargetList } from '/@/api/tb/notificationTarget';
  import { isArray, isEmpty } from 'lodash-es';
  import { usePermission } from '/@/hooks/web/usePermission';
  import ApiUsageLimit from './triggerConfig/apiUsageLimit.vue';
  import EntitiesLimit from './triggerConfig/entitiesLimit.vue';
  import NewPlatformVersion from './triggerConfig/newPlatformVersion.vue';
  import DeviceActivity from './triggerConfig/deviceActivity.vue';
  import EntityAction from './triggerConfig/entityAction.vue';
  import Alarm from './triggerConfig/alarm.vue';
  import AlarmAssignment from './triggerConfig/alarmAssignment.vue';
  import AlarmComment from './triggerConfig/alarmComment.vue';
  import ruleEngineLifecycleEvent from './triggerConfig/ruleEngineLifecycleEvent.vue';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { hasPermission } = usePermission();
  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const confirmLoading = ref(false);
  const currentStep = ref(0);
  const record = ref<NotificationRule>({} as NotificationRule);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
  value: record.value.id?.id ? t('tb.notification.rule.action.edit') : t('tb.notification.rule.action.add'),
  }));
  const tenantId = userStore.getUserInfo?.tenantId || { EntityType: 'TENANT', id: '' };

  const entitiesLimitForm = ref<any>(null);
  const newPlatformVersionForm = ref<any>(null);
  const apiUsageLimitForm = ref<any>(null);
  const deviceActivityForm = ref<any>(null);
  const entityActionForm = ref<any>(null);
  const alarmForm = ref<any>(null);
  const alarmAssignmentForm = ref<any>(null);
  const alarmCommentForm = ref<any>(null);
  const ruleEngineLifecycleForm = ref<any>(null);

  const templateOptions = ref<Array<any>>([]);
  const recipientOptions = ref<Array<any>>([]);

  const escalationList = ref([{ second: 0, targets: [] }]);

  const escalationTimeOption = computed(() => [
    { value: 0, label: t('tb.notification.rule.form.firstNotify'), disabled: true },
    { value: 60, label: t('tb.notification.rule.form.minuteLater', { count: 1 }) },
    { value: 120, label: t('tb.notification.rule.form.minuteLater', { count: 2 }) },
    { value: 300, label: t('tb.notification.rule.form.minuteLater', { count: 5 }) },
    { value: 600, label: t('tb.notification.rule.form.minuteLater', { count: 10 }) },
    { value: 900, label: t('tb.notification.rule.form.minuteLater', { count: 15 }) },
    { value: 1800, label: t('tb.notification.rule.form.minuteLater', { count: 30 }) },
    { value: 3600, label: t('tb.notification.rule.form.hourLater', { count: 1 }) },
    { value: 7200, label: t('tb.notification.rule.form.hourLater', { count: 2 }) },
    { value: 18000, label: t('tb.notification.rule.form.hourLater', { count: 5 }) },
    { value: 36000, label: t('tb.notification.rule.form.hourLater', { count: 10 }) },
    { value: 43200, label: t('tb.notification.rule.form.hourLater', { count: 12 }) },
    { value: 86400, label: t('tb.notification.rule.form.dayLater', { count: 1 }) },
  ]);

  const notificationTypeOptions = computed(() => {
    if (hasPermission(Authority.SYS_ADMIN)) {
      return NOTIFICATION_TYPE_OPTIONS.filter(
        (item) =>
          item.value == NotificationType.GENERAL ||
          item.value == NotificationType.ENTITIES_LIMIT ||
          item.value == NotificationType.API_USAGE_LIMIT ||
          item.value == NotificationType.NEW_PLATFORM_VERSION ||
          item.value == NotificationType.RATE_LIMITS ||
          item.value == NotificationType.TASK_PROCESSING_FAILURE ||
          item.value == NotificationType.RESOURCES_SHORTAGE,
      );
    } else {
      return NOTIFICATION_TYPE_OPTIONS.filter(
        (item) =>
          item.value == NotificationType.ALARM ||
          item.value == NotificationType.ALARM_ASSIGNMENT ||
          item.value == NotificationType.ALARM_COMMENT ||
          item.value == NotificationType.DEVICE_ACTIVITY ||
          item.value == NotificationType.ENTITY_ACTION ||
          item.value == NotificationType.RULE_NODE ||
          item.value == NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT ||
          item.value == NotificationType.EDGE_CONNECTION ||
          item.value == NotificationType.EDGE_COMMUNICATION_FAILURE,
      );
    }
  });
  const triggerType = ref<string>(notificationTypeOptions.value[0].value);

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: tenantId, show: false },
    {
      label: t('tb.notification.rule.form.name'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('tb.notification.rule.form.notificationType'),
      field: 'triggerType',
      component: 'Select',
      defaultValue: notificationTypeOptions.value[0].value,
      componentProps: {
        options: notificationTypeOptions,
        onChange: handleTriggerTypeChange,
        disabled: record.value.id?.id,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    { field: 'templateId.entityType', component: 'Input', defaultValue: EntityType.NOTIFICATION_TEMPLATE, show: false },
    {
      label: t('tb.notification.rule.form.notificationTemplate'),
      field: 'templateId.id',
      component: 'Select',
      componentProps: {
  placeholder: t('tb.notification.rule.form.notificationTemplate'),
      },
      slot: 'templateId',
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'recipientsConfig.triggerType',
      component: 'Input',
      defaultValue: notificationTypeOptions.value[0].value,
      show: false,
    },
    {
      label: t('tb.notification.rule.form.recipientsGroup'),
      field: 'recipientsConfig.targets',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
  placeholder: t('tb.notification.rule.form.recipientsGroup'),
        options: recipientOptions,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
  label: t('tb.notification.rule.form.recipientsChain'),
      field: 'recipientsConfig.escalationTable',
      component: 'Select',
      colSlot: 'escalationTable',
      colProps: { lg: 24, md: 24 },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, updateSchema, validate }] = useForm({
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    confirmLoading.value = true;
    setModalProps({ loading: true });
    currentStep.value = 0;
    escalationList.value = [];
    record.value = { ...data } as NotificationRule;
    await resetFields();
    if (data?.id?.id) {
      const res = await getNotificationRuleById(data.id.id);
      record.value = (res || {}) as NotificationRule;
    }
    await updateSchema([
      {
        field: 'triggerType',
        componentProps: {
          disabled: record.value.id?.id,
        },
      },
    ]);

    if (record.value.triggerType === NotificationType.ALARM && record.value?.recipientsConfig?.escalationTable) {
      const escalationTable = record.value.recipientsConfig.escalationTable;
      Object.keys(escalationTable).forEach((key) => {
        escalationList.value.push({ second: Number.parseInt(key), targets: escalationTable[key] });
      });
    }

    await handleTriggerTypeChange(record.value?.triggerType || notificationTypeOptions.value[0].value);

    console.log(record.value);
    setFieldsValue(record.value);
    setModalProps({ loading: false });
    confirmLoading.value = false;
  });

  async function handleSubmit() {
    try {
      let data = await validate();
      let triggerConfig = {};
      if (NotificationType.ENTITIES_LIMIT == triggerType.value && entitiesLimitForm.value) {
        triggerConfig = await entitiesLimitForm.value.validate();
      }
      if (NotificationType.NEW_PLATFORM_VERSION == triggerType.value && newPlatformVersionForm.value) {
        triggerConfig = await newPlatformVersionForm.value.validate();
      }
      if (NotificationType.API_USAGE_LIMIT == triggerType.value && apiUsageLimitForm.value) {
        triggerConfig = await apiUsageLimitForm.value.validate();
      }
      if (NotificationType.DEVICE_ACTIVITY == triggerType.value && deviceActivityForm.value) {
        triggerConfig = await deviceActivityForm.value.validate();
      }
      if (NotificationType.ENTITY_ACTION == triggerType.value && entityActionForm.value) {
        triggerConfig = await entityActionForm.value.validate();
      }
      if (NotificationType.ALARM == triggerType.value && alarmForm.value) {
        triggerConfig = await alarmForm.value.validate();
        escalationList.value;
      }
      if (NotificationType.ALARM_ASSIGNMENT == triggerType.value && alarmAssignmentForm.value) {
        triggerConfig = await alarmAssignmentForm.value.validate();
      }
      if (NotificationType.ALARM_COMMENT == triggerType.value && alarmCommentForm.value) {
        triggerConfig = await alarmCommentForm.value.validate();
      }
      if (
        NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT == triggerType.value &&
        ruleEngineLifecycleForm.value
      ) {
        triggerConfig = await ruleEngineLifecycleForm.value.validate();
      }

      if (triggerType.value == NotificationType.ALARM) {
        let escalationTable = {} as any;
        escalationList.value.forEach((item) => {
          escalationTable[item.second] = item.targets;
        });
        const recipientsConfig = { triggerType: NotificationType.ALARM, escalationTable: escalationTable };
        data.recipientsConfig = recipientsConfig;
      }

      confirmLoading.value = true;
      if (!isEmpty(data.recipientsConfig.targets) && !isArray(data.recipientsConfig.targets)) {
        data.recipientsConfig.targets = data.recipientsConfig.targets.split(',');
      }
      data = { ...data, ...triggerConfig };

      // console.log('submit', params, data, record);
      const res = await saveNotificationRule({ ...data, id: record.value.id });
      showMessage(
        record.value.id?.id
          ? t('tb.notification.rule.form.saveSuccessEdit')
          : t('tb.notification.rule.form.saveSuccessAdd'),
      );
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      confirmLoading.value = false;
    }
  }

  async function handleTriggerTypeChange(type: string) {
    triggerType.value = type;
    const fieldsValue = getFieldsValue();
    setFieldsValue({
      ...fieldsValue,
      templateId: { entityType: EntityType.NOTIFICATION_TEMPLATE, id: null },
      recipientsConfig: { triggerType: type, targets: [] },
    });
    const templateListResult = await notificationTemplateList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      type,
    );
    templateOptions.value = templateListResult.data.map((item) => {
      return {
        value: item.id.id,
        label: item.name,
        deliveryMethods: Object.keys(item.configuration.deliveryMethodsTemplates as any),
      };
    });
    const recipientResult = await notificationTargetList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      type,
    );
    recipientOptions.value = recipientResult.data.map((item) => {
      return { value: item.id.id, label: item.name };
    });
    await updateSchema([
      {
        field: 'recipientsConfig.targets',
        ifShow: EntityType.ALARM != type,
      },
      {
        field: 'recipientsConfig.escalationTable',
        ifShow: EntityType.ALARM == type,
      },
    ]);
    if (EntityType.ALARM == type && escalationList.value.length == 0) {
      escalationList.value = [{ second: 0, targets: [] }];
    }
    if (entitiesLimitForm.value) {
      entitiesLimitForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (newPlatformVersionForm.value) {
      newPlatformVersionForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (apiUsageLimitForm.value) {
      apiUsageLimitForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (deviceActivityForm.value) {
      deviceActivityForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (entityActionForm.value) {
      entityActionForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (alarmForm.value) {
      alarmForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (alarmAssignmentForm.value) {
      alarmAssignmentForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (alarmCommentForm.value) {
      alarmCommentForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
    if (ruleEngineLifecycleForm.value) {
      ruleEngineLifecycleForm.value.setFieldsValue({
        triggerConfig: record.value?.triggerConfig,
        additionalConfig: record.value?.additionalConfig,
      });
    }
  }

  function prev() {
    currentStep.value = currentStep.value - 1;
  }

  function close() {
    closeModal();
  }
  async function next() {
    try {
      await validate();
      currentStep.value = currentStep.value + 1;
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    }
  }

  function handleRemoveEscalation(index: number) {
    escalationList.value.splice(index, 1);
  }

  function handleAddEscalation() {
    escalationList.value.push({ second: 60, targets: [] });
  }
</script>
