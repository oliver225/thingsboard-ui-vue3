<template>
  <BasicModal v-bind="$attrs" :showFooter="true" @register="registerModal" @ok="handleSubmit" width="40%">
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #defaultQueueName="{ model, field }">
        <Select
          v-model:value="model[field]"
          :placeholder="t('tb.assetProfile.form.queuePlaceholder')"
          :allow-clear="true"
        >
          <Select.Option v-for="(option, index) in queueOptions" :key="index" :value="option.value">
            {{ option.label }}
            <p>
              <Tag>
                <small>{{ t('tb.assetProfile.form.queueSubmitStrategy') }}</small>
                {{
                  SUBMIT_STRATEGY_OPTIONS.find((item) => item.value === option.submitStrategy)?.label ||
                  option.submitStrategy
                }}
              </Tag>
              <Tag>
                <small>{{ t('tb.assetProfile.form.queueProcessingStrategy') }}</small>
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
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbAssetProfileForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useUserStore } from '/@/store/modules/user';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { Select, Tag } from 'ant-design-vue';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { EntityType } from '/@/enums/entityTypeEnum';
  // import { currentTenantDashboardList } from '/@/api/things/dashboard';
  import { ruleChainList } from '/@/api/tb/ruleChain';
  import { queueList } from '/@/api/tb/queue';
  import { saveAssetProfile, getAssetProfileById, AssetProfile } from '/@/api/tb/assetProfile';
  import { PROCESSING_STRATEGY_OPTIONS, SUBMIT_STRATEGY_OPTIONS } from '/@/enums/queueEnum';
  import { isEmpty } from 'lodash-es';
  import { currentTenantDashboardList } from '/@/api/tb/dashboard';
  import ImageUrlInput from '/@/views/tb/images/ImageUrlInput.vue';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<AssetProfile>({} as AssetProfile);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('tb.assetProfile.action.edit') : t('tb.assetProfile.action.add'),
  }));

  const queueOptions = ref<any[]>([]);

  const inputFormSchemas: FormSchema[] = [
    { field: 'tenantId', component: 'Input', defaultValue: userStore.getUserInfo?.tenantId, show: false },
    { field: 'default', component: 'Checkbox', defaultValue: false, show: false },
    {
      label: t('tb.assetProfile.form.name'),
      field: 'name',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: t('tb.assetProfile.form.namePlaceholder'),
      },
      required: true,
    },

    {
      label: t('tb.assetProfile.form.defaultRuleChain'),
      field: 'defaultRuleChainId.id',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.assetProfile.form.defaultRuleChainPlaceholder'),
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
      label: t('tb.assetProfile.form.mobileDashboard'),
      field: 'defaultDashboardId.id',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.assetProfile.form.mobileDashboardPlaceholder'),
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
      label: t('tb.assetProfile.form.queue'),
      field: 'defaultQueueName',
      component: 'Select',
      slot: 'defaultQueueName',
    },
    {
      label: t('tb.assetProfile.form.edgeRuleChain'),
      field: 'defaultEdgeRuleChainId.id',
      component: 'Select',
      componentProps: {
        placeholder: t('tb.assetProfile.form.edgeRuleChainPlaceholder'),
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
      label: t('tb.assetProfile.form.description'),
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
    record.value = { ...data } as AssetProfile;
    await resetFields();
    if (data?.id?.id) {
      const res = await getAssetProfileById(data.id.id);
      record.value = (res || {}) as AssetProfile;
    }
    await fetchQueueList();

    setFieldsValue(record.value);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });

      data.defaultRuleChainId = isEmpty(data.defaultRuleChainId.id)
        ? null
        : { entityType: EntityType.RULE_CHAIN, id: data.defaultRuleChainId.id };
      data.defaultDashboardId = isEmpty(data.defaultDashboardId.id)
        ? null
        : { entityType: EntityType.DASHBOARD, id: data.defaultDashboardId.id };
      data.defaultEdgeRuleChainId = isEmpty(data.defaultEdgeRuleChainId.id)
        ? null
        : { entityType: EntityType.RULE_CHAIN, id: data.defaultEdgeRuleChainId.id };

      const res = await saveAssetProfile({ ...data, id: record.value.id });
      showMessage(
        record.value.id?.id ? t('tb.assetProfile.action.editSuccess') : t('tb.assetProfile.action.addSuccess'),
      );
      setTimeout(closeModal);
      emit('success', data);
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
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
</script>
