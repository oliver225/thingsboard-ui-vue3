<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" width="60%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
      <Steps size="small" v-model:current="currentStep" style="margin-top: 12px">
        <Steps.Step v-for="(step, index) in stepItems" :key="index" :title="t(step.title)" />
      </Steps>
    </template>
    <BasicForm @register="registerForm" v-show="stepItems.at(currentStep)?.title == t('tb.deviceProfile.steps.detail')">
      <template #defaultQueueName="{ model, field }">
        <Select
          v-model:value="model[field]"
          :placeholder="t('tb.deviceProfile.form.queuePlaceholder')"
          :allow-clear="true"
        >
          <Select.Option v-for="(option, index) in queueOptions" :key="index" :value="option.value">
            {{ option.label }}
            <p>
              <Tag>
                <small>{{ t('tb.deviceProfile.alarmCondition.and') }}</small>
                {{
                  SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === option.submitStrategy)?.label ||
                  option.submitStrategy
                }}
              </Tag>
              <Tag>
                <small> {{ t('tb.deviceProfile.alarmCondition.and') }}</small>
                {{
                  PROCESSING_STRATEGY_OPTIONS.find((item) => item.value === option.processingStrategy)?.label ||
                  option.processingStrategy
                }}
              </Tag>
            </p>
          </Select.Option>
        </Select>
      </template>
      <template #imageInput="{ model, field }">
        <ImageUrlInput v-model:value="model[field]" />
      </template>
    </BasicForm>
    <TransportForm
      ref="transportFrom"
      v-show="stepItems.at(currentStep)?.title == t('tb.deviceProfile.steps.transport')"
    />
    <AlarmForm ref="alarmFrom" v-show="stepItems.at(currentStep)?.title == t('tb.deviceProfile.steps.alarm')" />
    <ProvisionForm
      ref="provisionFrom"
      v-show="stepItems.at(currentStep)?.title == t('tb.deviceProfile.steps.provision')"
    />
    <template #footer>
      <a-button v-if="currentStep > 0" @click="prev" style="float: left">
        <Icon icon="ant-design:left-outlined" />{{ t('tb.deviceProfile.common.prev') }}
      </a-button>
      <a-button @click="close">
        <Icon icon="ant-design:close-outlined" />{{ t('tb.deviceProfile.common.cancel') }}
      </a-button>
      <a-button :loading="confirmLoading" v-if="currentStep < stepItems.length - 1" type="primary" @click="next">
        <Icon icon="ant-design:right-outlined" />{{ t('tb.deviceProfile.common.next') }}
      </a-button>
      <a-button
        :loading="confirmLoading"
        v-if="currentStep == stepItems.length - 1"
        type="primary"
        @click="handleSubmit"
      >
        <Icon icon="ant-design:check-outlined" />{{ t('tb.deviceProfile.common.confirm') }}
      </a-button>
    </template>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbDeviceProfileForm">
  import { ref, unref, computed, nextTick } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { isEmpty } from 'lodash-es';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { Select, Tag, Steps } from 'ant-design-vue';

  import TransportForm from './transport/transportForm.vue';
  import AlarmForm from './alarm/alarmForm.vue';
  import ProvisionForm from './provisionForm.vue';

  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { currentTenantDashboardList } from '/@/api/tb/dashboard';
  import { queueList } from '/@/api/tb/queue';
  import { ruleChainList } from '/@/api/tb/ruleChain';
  import { TransportType, ProvisionType } from '/@/enums/deviceEnum';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
  import { saveDeviceProfile, getDeviceProfileById, DeviceProfile } from '/@/api/tb/deviceProfile';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import ImageUrlInput from '/@/views/tb/images/ImageUrlInput.vue';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const userStore = useUserStore();
  const { meta } = unref(router.currentRoute);
  const record = ref<DeviceProfile>({} as DeviceProfile);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.deviceProfile.action.edit') : t('tb.deviceProfile.action.add'),
  }));

  const currentStep = ref(0);
  const confirmLoading = ref(false);

  const queueOptions = ref<any[]>([]);

  const stepItems = [
    { title: t('tb.deviceProfile.steps.detail') },
    { title: t('tb.deviceProfile.steps.transport') },
    { title: t('tb.deviceProfile.steps.alarm') },
    { title: t('tb.deviceProfile.steps.provision') },
  ];

  const transportFrom = ref<any>(null);
  const alarmFrom = ref<any>(null);
  const provisionFrom = ref<any>(null);

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo?.tenantId, show: false },
    { field: 'default', component: 'Checkbox', defaultValue: false, show: false },
    { field: 'type', component: 'Input', defaultValue: 'DEFAULT', show: false },
    {
      label: t('tb.deviceProfile.form.name'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: t('tb.deviceProfile.form.namePlaceholder'),
      },
      required: true,
    },

    {
      label: t('tb.deviceProfile.form.defaultRuleChain'),
      field: 'defaultRuleChainId.id',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.deviceProfile.form.defaultRuleChainPlaceholder'),
        immediate: true,
        allowClear: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: (args: any) => ruleChainList(args, 'CORE'),
      },
    },
    {
      label: t('tb.deviceProfile.form.mobileDashboard'),
      field: 'defaultDashboardId.id',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.deviceProfile.form.mobileDashboardPlaceholder'),
        immediate: true,
        allowClear: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'title', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.title, value: item.id.id };
        },
        api: (args: any) => currentTenantDashboardList(args),
      },
    },
    {
      label: t('tb.deviceProfile.form.queue'),
      field: 'defaultQueueName',
      component: 'Select',
      slot: 'defaultQueueName',
    },
    {
      label: t('tb.deviceProfile.form.edgeRuleChain'),
      field: 'defaultEdgeRuleChainId.id',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.deviceProfile.form.edgeRuleChainPlaceholder'),
        allowClear: true,
        immediate: true,
        resultField: 'data',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: (args: any) => ruleChainList(args, 'EDGE'),
      },
    },
    {
      label: t('图片'),
      field: 'image',
      component: 'Input',
      slot: 'imageInput',
    },
    //image
    {
      label: t('tb.deviceProfile.form.description'),
      field: 'description',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    currentStep.value = 0;
    record.value = { ...data } as DeviceProfile;
    await resetFields();
    if (data?.id?.id) {
      const res = await getDeviceProfileById(data.id.id);
      record.value = (res || {}) as DeviceProfile;
    }
    await fetchQueueList();

    nextTick(() => {
      if (transportFrom.value != null) {
        transportFrom.value.setFieldsValue(
          record.value?.profileData?.transportConfiguration || { type: TransportType.DEFAULT },
        );
      }
      if (provisionFrom.value != null) {
        const provisionConfig = record.value?.profileData?.provisionConfiguration;
        provisionFrom.value.setFieldsValue(
          provisionConfig
            ? {
                ...provisionConfig,
                provisionDeviceKey: record.value?.provisionDeviceKey,
              }
            : { type: ProvisionType.DISABLED, provisionDeviceKey: null },
        );
      }
      if (alarmFrom.value != null) {
        alarmFrom.value.setFieldsValue(record.value?.profileData?.alarms || []);
      }
    });

    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      confirmLoading.value = true;
      data.defaultRuleChainId = isEmpty(data.defaultRuleChainId.id)
        ? null
        : { entityType: EntityType.RULE_CHAIN, id: data.defaultRuleChainId.id };
      data.defaultDashboardId = isEmpty(data.defaultDashboardId.id)
        ? null
        : { entityType: EntityType.DASHBOARD, id: data.defaultDashboardId.id };
      data.defaultEdgeRuleChainId = isEmpty(data.defaultEdgeRuleChainId.id)
        ? null
        : { entityType: EntityType.RULE_CHAIN, id: data.defaultEdgeRuleChainId.id };

      //profileData
      const profileData = {
        configuration: { type: 'DEFAULT' },
        transportConfiguration: { type: TransportType.DEFAULT },
        provisionConfiguration: { type: ProvisionType.DISABLED, provisionDeviceKey: null },
        alarms: null,
      };
      profileData.transportConfiguration = await transportFrom.value.validate();
      profileData.provisionConfiguration = await provisionFrom.value.validate();
      profileData.alarms = await alarmFrom.value.validate();

      // console.log('submit', params, data, record);
      const res = await saveDeviceProfile({
        ...data,
        id: record.value.id,
        transportType: profileData.transportConfiguration.type,
        provisionType: profileData.provisionConfiguration.type,
        provisionDeviceKey: profileData.provisionConfiguration.provisionDeviceKey,
        profileData: profileData,
      });
      showMessage(
        record.value.id?.id ? t('tb.deviceProfile.action.editSuccess') : t('tb.deviceProfile.action.addSuccess'),
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
      setModalProps({ confirmLoading: false });
    }
  }

  async function fetchQueueList() {
    const queueListResult = await queueList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      'TB_RULE_ENGINE',
    );
    queueOptions.value = queueListResult.data.map((item) => {
      return {
        value: item.name,
        label: item.name,
        submitStrategy: item.submitStrategy?.type,
        processingStrategy: item.processingStrategy?.type,
      };
    });
  }

  async function next() {
    try {
      if (currentStep.value == 0) {
        await validate();
      }

      if (stepItems.at(currentStep.value)?.title == t('tb.deviceProfile.steps.transport')) {
        await transportFrom.value.validate();
      }
      if (stepItems.at(currentStep.value)?.title == t('tb.deviceProfile.steps.alarm')) {
        await alarmFrom.value.validate();
      }
      if (stepItems.at(currentStep.value)?.title == t('tb.deviceProfile.steps.provision')) {
        await provisionFrom.value.validate();
      }
      currentStep.value = currentStep.value + 1;
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    }
  }

  function prev() {
    currentStep.value = currentStep.value - 1;
  }

  function close() {
    closeModal();
  }
</script>
