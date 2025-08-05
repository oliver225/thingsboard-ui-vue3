<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" width="50%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
      <Steps size="small" v-model:current="currentStep" style="margin-top: 12px">
        <Steps.Step v-for="(step, index) in stepItems" :key="index" :title="getDeliveryMethodLabel(step.title)" />
      </Steps>
    </template>
    <BasicForm @register="registerForm" v-show="stepItems.at(currentStep)?.title == '组合'">
      <template #uesTemplate="{ model, field }">
        <div class="w-full flex">
          <Radio.Group
            v-model:value="model[field]"
            button-style="solid"
            style="margin: 1px auto"
            @change="handleUesTemplateChange"
          >
            <Radio.Button value="false">从头开始</Radio.Button>
            <Radio.Button value="true">使用模板</Radio.Button>
          </Radio.Group>
        </div>
      </template>
      <template #templateId="{ model, field }">
        <Select v-model:value="model[field]" placeholder="请选择通知模版">
          <Select.Option v-for="(option, index) in templateOptions" :key="index" :value="option.value">
            {{ option.label }}
            <Tag v-for="(method, index) in option.deliveryMethods" :key="index">
              {{ method }}
            </Tag>
          </Select.Option>
        </Select>
      </template>
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
    <Review ref="previewRef" v-show="stepItems.at(currentStep)?.title == '预览'" />
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
        <Icon icon="ant-design:send-outlined" />发送
      </a-button>
    </template>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbNotificationRequestForm">
  import { Radio, Select, Steps, Switch, Tag } from 'ant-design-vue';
  import { isArray, isEmpty } from 'lodash-es';
  import { computed, nextTick, ref, unref } from 'vue';
  import EMAIL from '../template/deliveryMethod/email.vue';
  import SLACK from '../template/deliveryMethod/slack.vue';
  import SMS from '../template/deliveryMethod/sms.vue';
  import WEB from '../template/deliveryMethod/web.vue';
  import Review from './review.vue';
  import {
    NotificationRequest,
    createNotificationRequest,
    getNotificationRequestById,
    getNotificationRequestPreview,
  } from '/@/api/tb/notification';
  import { notificationTargetList } from '/@/api/tb/notificationTarget';
  import { notificationTemplateList } from '/@/api/tb/notificationTemplate';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { Icon } from '/@/components/Icon';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { NotificationType } from '/@/enums/notificationEnum';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { useUserStore } from '/@/store/modules/user';
  import { buildUUID } from '/@/utils/uuid';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);
  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const confirmLoading = ref(false);
  const currentStep = ref(0);
  const record = ref<NotificationRequest>({} as NotificationRequest);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('重新发送通知') : t('发送通知'),
  }));

  const templateOptions = ref<Array<any>>([]);

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
  const previewRef = ref<any>(null);

  const stepItems = computed(() => {
    const items = Object.keys(deliveryMethodEnable.value)
      .filter((key) => deliveryMethodEnable.value[key] == true)
      .map((method) => {
        return { title: method };
      });
    items.unshift({ title: '组合' });
    items.push({ title: '预览' });
    if (items.length - 1 < currentStep.value) {
      currentStep.value = items.length - 1;
    }
    return items;
  });

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo?.tenantId, show: false },
    {
      field: 'uesTemplate',
      component: 'RadioButtonGroup',
      defaultValue: 'false',
      slot: 'uesTemplate',
      colProps: { lg: 24, md: 24 },
    },
    {
      field: 'templateId.entityType',
      component: 'Input',
      defaultValue: EntityType.NOTIFICATION_TEMPLATE,
      ifShow: false,
    },
    {
      label: t('通知模版'),
      field: 'templateId.id',
      component: 'Select',
      componentProps: {
        placeholder: '请选择通知模版',
      },
      slot: 'templateId',
      ifShow: false,
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('通知接收组'),
      field: 'targets',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        immediate: true,
        resultField: 'data',
        placeholder: '请选择通知接收组',
        params: { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
        mapFn: (item) => {
          return { label: item.name, value: item.id.id };
        },
        api: (arg: any) => notificationTargetList(arg, NotificationType.GENERAL),
      },
      required: true,
      colProps: { lg: 24, md: 24 },
    },
    {
      label: t('接收方式'),
      subLabel: '至少选择一种',
      field: 'deliveryMethods',
      component: 'Input',
      ifShow: false,
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
      WEB: false,
      EMAIL: false,
      SMS: false,
      SLACK: false,
    };
    record.value = { ...data } as NotificationRequest;
    await resetFields();
    if (data?.id?.id) {
      const res = await getNotificationRequestById(data.id.id);
      record.value = (res || {}) as NotificationRequest;
    }
    await fetchTemplateList();

    if (isEmpty(record.value?.templateId?.id)) {
      handleUesTemplateChange({ target: { value: 'false' } });
      record.value.uesTemplate = 'false';
      if (record.value?.template?.configuration?.deliveryMethodsTemplates) {
        const deliveryMethodsTemplates = record.value?.template?.configuration?.deliveryMethodsTemplates;
        (
          Object.keys(deliveryMethodsTemplates).filter((key) => deliveryMethodsTemplates[key].enabled == true) || [
            'WEB',
          ]
        ).forEach((key) => {
          deliveryMethodEnable.value[key] = true;
        });
      }
    } else {
      handleUesTemplateChange({ target: { value: 'true' } });
      record.value.uesTemplate = 'true';
    }

    nextTick(() => {
      if (deliverMethodWebForm.value != null) {
        deliverMethodWebForm.value.setFieldsValue(
          record.value?.template?.configuration?.deliveryMethodsTemplates?.WEB || {},
        );
      }
      if (deliverMethodSMSForm.value != null) {
        deliverMethodSMSForm.value.setFieldsValue(
          record.value?.template?.configuration?.deliveryMethodsTemplates?.SMS || {},
        );
      }
      if (deliverMethodEmailForm.value != null) {
        deliverMethodEmailForm.value.setFieldsValue(
          record.value?.template?.configuration?.deliveryMethodsTemplates?.EMAIL || {},
        );
      }
      if (deliverMethodSlackForm.value != null) {
        deliverMethodSlackForm.value.setFieldsValue(
          record.value?.template?.configuration?.deliveryMethodsTemplates?.SLACK || {},
        );
      }
    });
    setFieldsValue(record.value);
    setModalProps({ loading: false });
    confirmLoading.value = false;
  });

  async function validateAndData() {
    try {
      let data = await validate();

      if (isEmpty(data?.templateId?.id)) {
        data.templateId = null;
        data.template = {
          name: buildUUID(),
          notificationType: NotificationType.GENERAL,
          configuration: { deliveryMethodsTemplates: {} },
        };
        if (deliverMethodWebForm.value != null) {
          data.template.configuration.deliveryMethodsTemplates.WEB = await deliverMethodWebForm.value.validate();
        }
        if (deliverMethodSMSForm.value != null) {
          data.template.configuration.deliveryMethodsTemplates.SMS = await deliverMethodSMSForm.value.validate();
        }
        if (deliverMethodEmailForm.value != null) {
          data.template.configuration.deliveryMethodsTemplates.EMAIL = await deliverMethodEmailForm.value.validate();
        }
        if (deliverMethodSlackForm.value != null) {
          data.template.configuration.deliveryMethodsTemplates.SLACK = await deliverMethodSlackForm.value.validate();
        }
      } else {
        data.template = null;
      }
      if (!isEmpty(data.targets) && !isArray(data.targets)) {
        data.targets = data.targets.split(',');
      }
      return data;
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    }
  }

  async function handleSubmit() {
    try {
      let data = await validateAndData();
      setModalProps({ loading: true });
      confirmLoading.value = true;

      // console.log('submit', params, data, record);
      const res = await createNotificationRequest({ ...data, id: null });
      showMessage('发送通知成功！');
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      confirmLoading.value = false;
      setModalProps({ loading: false });
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
      if (stepItems.value.at(currentStep.value + 1)?.title == '预览') {
        const data = await validateAndData();
        if (data) {
          await preview(data);
        }
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

  async function handleUesTemplateChange({ target: { value: uesTemplate } }) {
    await updateSchema([
      {
        field: 'templateId.id',
        ifShow: uesTemplate == 'true',
      },
      {
        field: 'templateId.entityType',
        show: false,
        ifShow: uesTemplate == 'true',
      },
      {
        field: 'deliveryMethods',
        ifShow: uesTemplate == 'false',
      },
    ]);
  }

  async function fetchTemplateList() {
    const templateListResult = await notificationTemplateList(
      { pageSize: 50, page: 0, sortProperty: 'name', sortOrder: 'ASC' },
      NotificationType.GENERAL,
    );
    templateOptions.value = templateListResult.data.map((item) => {
      return {
        value: item.id.id,
        label: item.name,
        deliveryMethods: Object.keys(item.configuration.deliveryMethodsTemplates as any),
      };
    });
  }

  async function preview(data: Recordable) {
    try {
      confirmLoading.value = true;
      setModalProps({ loading: true });
      const previewData = await getNotificationRequestPreview(data);
      previewRef.value.setValue(previewData);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      confirmLoading.value = false;
      setModalProps({ loading: false });
    }
  }
</script>
