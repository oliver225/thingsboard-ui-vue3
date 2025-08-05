<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
      <Steps size="small" v-model:current="currentStep" style="margin-top: 12px">
        <Steps.Step v-for="(step, index) in stepItems" :key="index" :title="getDeliveryMethodLabel(step.title)" />
      </Steps>
    </template>
    <BasicForm @register="registerForm" v-show="stepItems.at(currentStep)?.title == '基础'">
      <template #deliveryMethods>
        <div class="grid grid-cols-2 gap-2 w-full">
          <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
            <Switch v-model:checked="deliveryMethodEnable.WEB" size="small" />
            <span class="ml-4">Web</span>
          </div>
          <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
            <Switch v-model:checked="deliveryMethodEnable.EMAIL" size="small" />
            <span class="ml-4">Email</span>
          </div>
          <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
            <Switch v-model:checked="deliveryMethodEnable.SMS" size="small" />
            <span class="ml-4">短信</span>
          </div>
          <div class="border border-solid border-neutral-300 rounded-md py-3 px-4">
            <Switch v-model:checked="deliveryMethodEnable.SLACK" size="small" :disabled="true" />
            <span class="ml-4">Slack</span>
          </div>
        </div>
      </template>
    </BasicForm>
    <WEB
      ref="deliverMethodWebForm"
      v-if="deliveryMethodEnable.WEB"
      v-show="stepItems.at(currentStep)?.title == 'WEB'"
    />
    <SMS
      ref="deliverMethodSMSForm"
      v-if="deliveryMethodEnable.SMS"
      v-show="stepItems.at(currentStep)?.title == 'SMS'"
    />
    <EMAIL
      ref="deliverMethodEmailForm"
      v-if="deliveryMethodEnable.EMAIL"
      v-show="stepItems.at(currentStep)?.title == 'EMAIL'"
    />
    <SLACK
      ref="deliverMethodSlackForm"
      v-if="deliveryMethodEnable.SLACK"
      v-show="stepItems.at(currentStep)?.title == 'SLACK'"
    />
    <template #footer>
      <a-button v-if="currentStep > 0" @click="prev" style="float: left">
        <Icon icon="ant-design:left-outlined" />上一步
      </a-button>
      <a-button @click="close"> <Icon icon="ant-design:close-outlined" />取消 </a-button>
      <a-button :loading="confirmLoading" v-if="currentStep < stepItems.length - 1" type="primary" @click="next">
        <Icon icon="ant-design:right-outlined" />下一步
      </a-button>
      <a-button
        :loading="confirmLoading"
        v-if="currentStep == stepItems.length - 1"
        type="primary"
        @click="handleSubmit"
      >
        <Icon icon="ant-design:check-outlined" />确定
      </a-button>
    </template>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbNotificationTemplateForm">
  import { Steps, Switch } from 'ant-design-vue';
  import { computed, ref, unref, nextTick } from 'vue';
  import {
    NotificationTemplate,
    getNotificationTemplateById,
    saveNotificationTemplate,
  } from '/@/api/tb/notificationTemplate';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { Icon } from '/@/components/Icon';
  import { useUserStore } from '/@/store/modules/user';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { Authority } from '/@/enums/authorityEnum';
  import { NOTIFICATION_TYPE_OPTIONS, NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { usePermission } from '/@/hooks/web/usePermission';
  import WEB from './deliveryMethod/web.vue';
  import SMS from './deliveryMethod/sms.vue';
  import EMAIL from './deliveryMethod/email.vue';
  import SLACK from './deliveryMethod/slack.vue';

  const emit = defineEmits(['success', 'register']);
  const { hasPermission } = usePermission();
  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const confirmLoading = ref(false);
  const currentStep = ref(0);
  const record = ref<NotificationTemplate>({} as NotificationTemplate);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑通知模版') : t('新增通知模版'),
  }));

  const tenantId = userStore.getUserInfo?.tenantId || { EntityType: 'TENANT', id: '' };

  const deliveryMethodEnable = ref({
    WEB: false,
    EMAIL: false,
    SMS: false,
    SLACK: false,
  });

  const deliverMethodWebForm = ref<any>(null);
  const deliverMethodSMSForm = ref<any>(null);
  const deliverMethodEmailForm = ref<any>(null);
  const deliverMethodSlackForm = ref<any>(null);

  const stepItems = computed(() => {
    const items = Object.keys(deliveryMethodEnable.value)
      .filter((key) => deliveryMethodEnable.value[key] == true)
      .map((method) => {
        return { title: method };
      });
    items.unshift({ title: '基础' });
    if (items.length - 1 < currentStep.value) {
      currentStep.value = items.length - 1;
    }
    return items;
  });

  const notificationTypeOptions = computed(() => {
    if (hasPermission(Authority.SYS_ADMIN)) {
      return NOTIFICATION_TYPE_OPTIONS.filter(
        (item) =>
          item.value == NotificationType.GENERAL ||
          item.value == NotificationType.ENTITIES_LIMIT ||
          item.value == NotificationType.API_USAGE_LIMIT ||
          item.value == NotificationType.NEW_PLATFORM_VERSION,
      );
    } else {
      return NOTIFICATION_TYPE_OPTIONS.filter(
        (item) =>
          item.value == NotificationType.GENERAL ||
          item.value == NotificationType.ALARM ||
          item.value == NotificationType.ALARM_ASSIGNMENT ||
          item.value == NotificationType.ALARM_COMMENT ||
          item.value == NotificationType.DEVICE_ACTIVITY ||
          item.value == NotificationType.ENTITY_ACTION ||
          item.value == NotificationType.RULE_NODE ||
          item.value == NotificationType.RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT,
      );
    }
  });

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: tenantId, show: false },
    {
      label: t('模板名称'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('通知类型'),
      field: 'notificationType',
      component: 'Select',
      defaultValue: NotificationType.GENERAL,
      componentProps: {
        options: notificationTypeOptions,
        disabled: !!!record.value.id?.id,
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('接收方式'),
      subLabel: '至少选择一种',
      field: 'deliveryMethods',
      component: 'Input',
      slot: 'deliveryMethods',
      colProps: { lg: 24, md: 24 },
      rules: [
        {
          validator(_rule) {
            return new Promise((resolve, reject) => {
              if (
                Object.keys(deliveryMethodEnable.value).filter((key) => deliveryMethodEnable.value[key] == true)
                  .length > 0
              ) {
                return resolve();
              }
              reject(t('至少选择一种接收方式'));
            });
          },
          trigger: ['change', 'blur'],
        },
      ],
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, updateSchema, getFieldsValue, validate }] = useForm({
    layout: 'vertical',
    schemas: inputFormSchemas,
    baseColProps: { lg: 12, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    confirmLoading.value = true;
    setModalProps({ loading: true });
    currentStep.value = 0;
    deliveryMethodEnable.value = {
      WEB: true,
      EMAIL: false,
      SMS: false,
      SLACK: false,
    };
    record.value = { ...data } as NotificationTemplate;
    await resetFields();
    if (data?.id?.id) {
      const res = await getNotificationTemplateById(data.id.id);
      record.value = (res || {}) as NotificationTemplate;
    }

    if (record.value?.configuration?.deliveryMethodsTemplates) {
      const deliveryMethodsTemplates = record.value?.configuration?.deliveryMethodsTemplates;
      (
        Object.keys(deliveryMethodsTemplates).filter((key) => deliveryMethodsTemplates[key].enabled == true) || ['WEB']
      ).forEach((key) => {
        deliveryMethodEnable.value[key] = true;
      });
    }
    nextTick(() => {
      if (deliverMethodWebForm.value != null) {
        deliverMethodWebForm.value.setFieldsValue(record.value?.configuration?.deliveryMethodsTemplates?.WEB || {});
      }
      if (deliverMethodSMSForm.value != null) {
        deliverMethodSMSForm.value.setFieldsValue(record.value?.configuration?.deliveryMethodsTemplates?.SMS || {});
      }
      if (deliverMethodEmailForm.value != null) {
        deliverMethodEmailForm.value.setFieldsValue(record.value?.configuration?.deliveryMethodsTemplates?.EMAIL || {});
      }
      if (deliverMethodSlackForm.value != null) {
        deliverMethodSlackForm.value.setFieldsValue(record.value?.configuration?.deliveryMethodsTemplates?.SLACK || {});
      }
    });
    setFieldsValue(record.value);
    updateSchema([
      {
        field: 'notificationType',
        componentProps: {
          disabled: !!record.value.id?.id,
        },
      },
    ]);
    setModalProps({ loading: false });
    confirmLoading.value = false;
  });

  async function handleSubmit() {
    try {
      let data = await validate();
      data.configuration = { deliveryMethodsTemplates: {} };
      if (deliverMethodWebForm.value != null) {
        data.configuration.deliveryMethodsTemplates.WEB = await deliverMethodWebForm.value.validate();
      }
      if (deliverMethodSMSForm.value != null) {
        data.configuration.deliveryMethodsTemplates.SMS = await deliverMethodSMSForm.value.validate();
      }
      if (deliverMethodEmailForm.value != null) {
        data.configuration.deliveryMethodsTemplates.EMAIL = await deliverMethodEmailForm.value.validate();
      }
      if (deliverMethodSlackForm.value != null) {
        data.configuration.deliveryMethodsTemplates.SLACK = await deliverMethodSlackForm.value.validate();
      }
      confirmLoading.value = true;

      // console.log('submit', params, data, record);
      const res = await saveNotificationTemplate({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}通知模版成功！`);
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

  async function next() {
    try {
      if (currentStep.value == 0) {
        await validate();
      }
      if (stepItems.value.at(currentStep.value)?.title == 'WEB') {
        await deliverMethodWebForm.value.validate();
      }
      if (stepItems.value.at(currentStep.value)?.title == 'SMS') {
        await deliverMethodSMSForm.value.validate();
      }
      if (stepItems.value.at(currentStep.value)?.title == 'EMAIL') {
        await deliverMethodEmailForm.value.validate();
      }
      if (stepItems.value.at(currentStep.value)?.title == 'SLACK') {
        await deliverMethodSlackForm.value.validate();
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

  function getDeliveryMethodLabel(deliveryMethod: string) {
    if ('WEB' == deliveryMethod) {
      return 'Web';
    } else if ('EMAIL' == deliveryMethod) {
      return 'Email';
    } else if ('SMS' == deliveryMethod) {
      return '短信';
    } else if ('SLACK' == deliveryMethod) {
      return 'Slack';
    } else {
      return deliveryMethod;
    }
  }
</script>
