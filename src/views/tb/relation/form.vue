<template>
  <BasicModal
    v-bind="$attrs"
    :showFooter="true"
    @register="registerModal"
    @ok="handleSubmit"
    width="40%"
    :show-ok-btn="hasPermission(Authority.TENANT_ADMIN)"
  >
    <template #title>
      <Icon :icon="getTitle.icon" class="pr-1 m-1" />
      <span> {{ getTitle.value }} </span>
    </template>
    <BasicForm @register="registerForm">
      <template #additionalInfo="{ model, field }">
        <div class="border border-solid border-neutral-300">
          <CodeEditor v-model:value="model[field]" />
        </div>
      </template>
    </BasicForm>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbRelationForm">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { CodeEditor } from '/@/components/CodeEditor';

  import { BasicForm, FormSchema, useForm } from '/@/components/Form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { EntityRelation, saveRelation } from '/@/api/tb/relation';
  import { Authority } from '/@/enums/authorityEnum';
  import { RelationTypeGroup } from '/@/enums/relationEnum';
  import { isEmpty } from 'lodash-es';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { ENTITY_TYPE_OPTIONS, EntityType } from '/@/enums/entityTypeEnum';
  import { getTenantDeviceInfoList } from '/@/api/tb/device';
  import { getTenantAssetInfoList } from '/@/api/tb/asset';
  import { getTenantEntityViewInfos } from '/@/api/tb/entityView';
  import { tenantById } from '/@/api/tb/tenant';
  import { customerList } from '/@/api/tb/customer';
  import { userList } from '/@/api/tb/user';
  // import { currentTenantDashboardList } from '/@/api/tb/dashboard';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<EntityRelation>({} as EntityRelation);
  const direction = ref('From');

  const isNewRecord = ref(true);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: isNewRecord.value ? t('新增关联') : t('编辑关联'),
  }));

  const entityTypeOptions = computed(() => {
    return ENTITY_TYPE_OPTIONS.filter((item) => {
      return (
        item.value == EntityType.DEVICE ||
        item.value == EntityType.ASSET ||
        item.value == EntityType.ENTITY_VIEW ||
        item.value == EntityType.TENANT ||
        item.value == EntityType.CUSTOMER ||
        item.value == EntityType.USER ||
        item.value == EntityType.DASHBOARD ||
        item.value == EntityType.EDGE
      );
    });
  });
  const fromIdOptions = ref<Array<any>>([]);
  const toIdOptions = ref<Array<any>>([]);

  const inputFormSchemas: FormSchema[] = [
    { field: 'typeGroup', component: 'Input', defaultValue: RelationTypeGroup.COMMON, show: false },
    {
      label: t('关联类型'),
      field: 'type',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输关联类型',
      },
      required: true,
    },
    {
      label: t('从实体'),
      field: 'from.entityType',
      component: 'Select',
      componentProps: {
        options: entityTypeOptions,
        onChange: (text) => onEntityTypeChange(text, 'From'),
      },
      required: true,
      show: direction.value == 'To',
      colProps: { lg: 8, md: 8 },
    },
    {
      field: 'from.id',
      component: 'Select',
      componentProps: {
        options: fromIdOptions,
      },
      required: true,
      show: direction.value == 'To',
      colProps: { lg: 16, md: 16 },
    },
    {
      label: t('到实体'),
      field: 'to.entityType',
      component: 'Select',
      componentProps: {
        options: entityTypeOptions,
        onChange: (text) => onEntityTypeChange(text, 'To'),
      },
      required: true,
      show: direction.value == 'From',
      colProps: { lg: 8, md: 8 },
    },
    {
      field: 'to.id',
      component: 'Select',
      componentProps: {
        options: toIdOptions,
      },
      required: true,
      show: direction.value == 'From',
      colProps: { lg: 16, md: 16 },
    },

    {
      label: t('附加信息(JSON)'),
      field: 'additionalInfo',
      component: 'InputTextArea',
      componentProps: {
        maxlength: 500,
      },
      slot: 'additionalInfo',
    },
  ];

  const [registerForm, { resetFields, setFieldsValue, getFieldsValue, updateSchema, validate }] = useForm({
    labelWidth: 120,
    schemas: inputFormSchemas,
    baseColProps: { lg: 24, md: 24 },
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    await resetFields();
    direction.value = data.direction;
    record.value = { ...data } as EntityRelation;
    isNewRecord.value = direction.value == 'From' ? isEmpty(record.value.to?.id) : isEmpty(record.value.from?.id);

    await onEntityTypeChange(
      direction.value == 'From' ? record.value.to?.entityType : record.value.from?.entityType,
      direction.value == 'From' ? 'To' : 'From',
    );
    setFieldsValue(record.value);
    updateSchema([
      {
        label: t('关联类型'),
        field: 'type',
        component: 'Input',
        componentProps: {
          maxlength: 100,
          placeholder: '请输关联类型',
          disabled: !isNewRecord.value,
        },
        required: true,
      },
      {
        label: t('从实体'),
        field: 'from.entityType',
        component: 'Select',
        componentProps: {
          options: entityTypeOptions,
          onChange: (text) => onEntityTypeChange(text, 'From'),
          disabled: !isNewRecord.value,
        },
        required: true,
        show: direction.value == 'To',
        colProps: { lg: 8, md: 8 },
      },
      {
        field: 'from.id',
        component: 'Select',
        componentProps: {
          options: fromIdOptions,
          disabled: !isNewRecord.value,
        },
        required: true,
        show: direction.value == 'To',
        colProps: { lg: 16, md: 16 },
      },
      {
        label: t('到实体'),
        field: 'to.entityType',
        component: 'Select',
        componentProps: {
          options: entityTypeOptions,
          onChange: (text) => onEntityTypeChange(text, 'To'),
          disabled: !isNewRecord.value,
        },
        required: true,
        show: direction.value == 'From',
        colProps: { lg: 8, md: 8 },
      },
      {
        field: 'to.id',
        component: 'Select',
        componentProps: {
          options: toIdOptions,
          disabled: !isNewRecord.value,
        },
        required: true,
        show: direction.value == 'From',
        colProps: { lg: 16, md: 16 },
      },
    ]);
    setModalProps({ loading: false });
  });

  async function handleSubmit() {
    try {
      const data = await validate();
      setModalProps({ confirmLoading: true });
      // console.log('submit', params, data, record);
      if (!isEmpty(data.additionalInfo)) {
        try {
          data.additionalInfo = JSON.parse(data.additionalInfo);
        } catch (e) {
          showMessage('附加信息格式错误！请输入JSON格式数据', 'error');
          return;
        }
      }
      const res = await saveRelation({ ...data });
      showMessage(`${isNewRecord.value ? '新增' : '编辑'}关联成功！`);
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

  async function onEntityTypeChange(entityType: EntityType, direction: 'From' | 'To') {
    let options: Array<any> = [];
    switch (entityType) {
      case EntityType.DEVICE:
        const deviceListResult = await getTenantDeviceInfoList({
          pageSize: 50,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        options = deviceListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.ASSET:
        const assetListResult = await getTenantAssetInfoList({
          pageSize: 50,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        options = assetListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.ENTITY_VIEW:
        const entityViewListResult = await getTenantEntityViewInfos({
          pageSize: 50,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        options = entityViewListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.TENANT:
        const tenantResult = await tenantById(userStore.getUserInfo.tenantId.id);
        options = [{ label: tenantResult.title, id: tenantResult.id.id }];
        break;
      case EntityType.CUSTOMER:
        const customerListResult = await customerList({
          pageSize: 50,
          page: 0,
          sortProperty: 'title',
          sortOrder: 'ASC',
        });
        options = customerListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      case EntityType.USER:
        const userListResult = await userList({ pageSize: 50, page: 0, sortProperty: 'email', sortOrder: 'ASC' });
        options = userListResult.data.map((device) => ({ label: device.name, value: device.id.id }));
        break;
      default:
        options = [];
    }
    direction == 'From' ? (fromIdOptions.value = options) : (toIdOptions.value = options);
  }
</script>
