<template>
  <BasicModal
    @register="registerModal"
    :title="isEdit ? t('tb.calculatedField.argument.edit') : t('tb.calculatedField.argument.title')"
    width="600px"
    :showFooter="true"
    @ok="handleSave"
    @cancel="handleCancel"
    :destroy-on-close="true"
    :okText="isEdit ? t('common.saveText') : t('tb.calculatedField.argument.add')"
    :cancelText="t('tb.calculatedField.argument.cancel')"
  >
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item
        :label="t('tb.calculatedField.argument.name')"
        name="name"
        :rules="[
          { required: true, message: t('tb.calculatedField.argument.nameRequired') },
          { pattern: /^[A-Za-z]+$/, message: t('tb.calculatedField.argument.nameInvalid') },
        ]"
      >
        <Input v-model:value="formState.name" :placeholder="t('tb.calculatedField.argument.namePlaceholder')" />
      </Form.Item>
      <Form.Item
        :label="t('tb.calculatedField.argument.entityType')"
        name="entityType"
        :rules="[{ required: true, message: t('tb.calculatedField.argument.entityTypeRequired') }]"
      >
        <Select
          v-model:value="formState.entityType"
          :placeholder="t('tb.calculatedField.argument.entityTypePlaceholder')"
          @change="handleEntityTypeChange"
          :options="ARGUMENT_ENTITY_TYPE_OPTIONS"
        />
      </Form.Item>

      <!-- Device -->
      <Form.Item
        v-if="formState.entityType === ArgumentEntityType.DEVICE"
        :label="t('tb.calculatedField.argument.device')"
        name="refEntityId"
        :rules="[{ required: true, message: t('tb.calculatedField.argument.deviceRequired') }]"
      >
        <Select
          v-model:value="formState.refEntityId"
          :placeholder="entityPlaceholder"
          :options="entityOptions"
          :loading="entityLoading"
          :notFoundContent="entityNotFoundContent"
          show-search
          :filter-option="filterOption"
        />
      </Form.Item>

      <!-- Asset -->
      <Form.Item
        v-if="formState.entityType === ArgumentEntityType.ASSET"
        :label="t('tb.calculatedField.argument.asset')"
        name="refEntityId"
        :rules="[{ required: true, message: t('tb.calculatedField.argument.assetRequired') }]"
      >
        <Select
          v-model:value="formState.refEntityId"
          :placeholder="entityPlaceholder"
          :options="entityOptions"
          :loading="entityLoading"
          :notFoundContent="entityNotFoundContent"
          show-search
          :filter-option="filterOption"
        />
      </Form.Item>

      <!-- Customer -->
      <Form.Item
        v-if="formState.entityType === ArgumentEntityType.CUSTOMER"
        :label="t('tb.calculatedField.argument.customer')"
        name="refEntityId"
        :rules="[{ required: true, message: t('tb.calculatedField.argument.customerRequired') }]"
      >
        <Select
          v-model:value="formState.refEntityId"
          :placeholder="entityPlaceholder"
          :options="entityOptions"
          :loading="entityLoading"
          :notFoundContent="entityNotFoundContent"
          show-search
          :filter-option="filterOption"
        />
      </Form.Item>

      <!-- Argument Type -->
      <Form.Item
        :label="t('tb.calculatedField.argument.type')"
        name="type"
        :rules="[{ required: true, message: t('tb.calculatedField.argument.typeRequired') }]"
      >
        <Select
          v-model:value="formState.type"
          :placeholder="t('tb.calculatedField.argument.typePlaceholder')"
          @change="handleTypeChange"
          :options="ARGUMENT_TYPE_OPTIONS"
        />
      </Form.Item>

      <!-- Key (Time Series / Attribute) -->
      <Form.Item
        v-if="formState.type === ArgumentType.TS_LATEST || formState.type === ArgumentType.ATTRIBUTE"
        :label="keyLabel"
        name="key"
        :rules="keyRules"
      >
        <AutoComplete
          v-model:value="formState.key"
          :placeholder="keyPlaceholder"
          :options="keyOptions"
          :loading="keyLoading"
          :notFoundContent="keyNotFoundContent"
          @focus="handleKeyFocus"
        />
      </Form.Item>
      <!-- {{ showAttributeScope }} -->
      <!-- Attribute Scope -->
      <Form.Item
        v-if="showAttributeScope"
        :label="t('tb.calculatedField.argument.attributeScope')"
        name="scope"
        :rules="[{ required: true, message: t('tb.calculatedField.argument.attributeScopeRequired') }]"
      >
        <Select
          v-model:value="formState.scope"
          :placeholder="t('tb.calculatedField.argument.attributeScopePlaceholder')"
          :options="SCOPE_OPTIONS_SIMPLE"
        />
      </Form.Item>

      <Form.Item :label="t('tb.calculatedField.argument.defaultValue')" name="defaultValue">
        <Input
          v-model:value="formState.defaultValue"
          :placeholder="t('tb.calculatedField.argument.defaultValuePlaceholder')"
        />
      </Form.Item>
    </Form>
  </BasicModal>
</template>

<script lang="ts" setup name="ArgumentModal">
  import { ref, computed, watch } from 'vue';
  import { Form, Input, Select, AutoComplete } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { cloneDeep } from 'lodash-es';
  import { getTenantDeviceInfoList } from '/@/api/tb/device';
  import { getTenantAssetInfoList } from '/@/api/tb/asset';
  import { customerList } from '/@/api/tb/customer';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { useUserStore } from '/@/store/modules/user';
  import { SCOPE_OPTIONS_SIMPLE, Scope } from '/@/enums/telemetryEnum';
  import { findEntityKeyByQuery } from '/@/api/tb/entityQuery';
  import {
    ArgumentEntityType,
    ArgumentType,
    ARGUMENT_ENTITY_TYPE_OPTIONS,
    ARGUMENT_TYPE_OPTIONS,
  } from '/@/enums/calculatedFieldEnum';

  interface ArgumentData {
    name: string;
    entityType: string;
    type?: string;
    key?: string;
    defaultValue?: string;
    refEntityId?: any;
    targetEntityName?: string;
    scope?: Scope;
  }

  const emit = defineEmits(['register', 'success']);
  const { t } = useI18n();
  const userStore = useUserStore();

  const formRef = ref<FormInstance>();
  const isEdit = ref(false);
  const editIndex = ref<number>(-1);
  const entityOptions = ref<any[]>([]);
  const entityLoading = ref(false);
  const keyOptions = ref<any[]>([]);
  const keyLoading = ref(false);

  const entityId = ref();

  const init = {
    name: '',
    entityType: ArgumentEntityType.CURRENT_ENTITY,
    type: ArgumentType.TS_LATEST,
    key: '',
    defaultValue: '',
    refEntityId: undefined,
    scope: undefined,
  };

  const formState = ref<ArgumentData>(cloneDeep(init));

  // 是否显示属性范围字段
  const showAttributeScope = computed(() => {
    console.log('formState.type :>> ', formState.value.type);
    console.log('formState.entityType :>> ', formState.value.entityType);
    console.log('formState.type === ArgumentType.ATTRIBUTE :>> ', formState.value.type === ArgumentType.ATTRIBUTE);
    console.log(
      ' [ArgumentEntityType.DEVICE, ArgumentEntityType.CURRENT_ENTITY].includes(formState.entityType as ArgumentEntityType), :>> ',
      [ArgumentEntityType.DEVICE, ArgumentEntityType.CURRENT_ENTITY].includes(
        formState.value.entityType as ArgumentEntityType,
      ),
    );
    return (
      formState.value.type === ArgumentType.ATTRIBUTE &&
      [ArgumentEntityType.DEVICE, ArgumentEntityType.CURRENT_ENTITY].includes(
        formState.value.entityType as ArgumentEntityType,
      )
    );
  });

  // 实体选择器的 placeholder
  const entityPlaceholder = computed(() => {
    if (entityLoading.value) return t('tb.calculatedField.argument.loading');

    switch (formState.value.entityType) {
      case ArgumentEntityType.DEVICE:
        return t('tb.calculatedField.argument.devicePlaceholder');
      case ArgumentEntityType.ASSET:
        return t('tb.calculatedField.argument.assetPlaceholder');
      case ArgumentEntityType.CUSTOMER:
        return t('tb.calculatedField.argument.customerPlaceholder');
      default:
        return '';
    }
  });

  // 实体选择器的空状态提示
  const entityNotFoundContent = computed(() => {
    if (entityLoading.value) return t('tb.calculatedField.argument.loading');

    switch (formState.value.entityType) {
      case ArgumentEntityType.DEVICE:
        return t('tb.calculatedField.argument.noDevice');
      case ArgumentEntityType.ASSET:
        return t('tb.calculatedField.argument.noAsset');
      case ArgumentEntityType.CUSTOMER:
        return t('tb.calculatedField.argument.noCustomer');
      default:
        return '';
    }
  });

  // 动态 Key 文案与校验/空态
  const keyLabel = computed(() =>
    formState.value.type === ArgumentType.TS_LATEST
      ? t('tb.calculatedField.argument.timeSeriesKey')
      : t('tb.calculatedField.argument.attributeKey'),
  );
  const keyPlaceholder = computed(() =>
    formState.value.type === ArgumentType.TS_LATEST
      ? t('tb.calculatedField.argument.timeSeriesKeyPlaceholder')
      : t('tb.calculatedField.argument.attributeKeyPlaceholder'),
  );
  const keyRequiredMessage = computed(() =>
    formState.value.type === ArgumentType.TS_LATEST
      ? t('tb.calculatedField.argument.timeSeriesKeyRequired')
      : t('tb.calculatedField.argument.attributeKeyRequired'),
  );
  const keyNotFoundContent = computed(() =>
    keyLoading.value ? t('tb.calculatedField.argument.loading') : t('tb.calculatedField.argument.noKeys'),
  );
  const keyRules = computed(() => [{ required: true, message: keyRequiredMessage.value }]);

  // 监听实体类型变化，加载相应的实体列表
  watch(
    () => formState.value.entityType,
    async (newType, oldType) => {
      console.log('entityType changed:', { newType, oldType });

      if (
        [ArgumentEntityType.DEVICE, ArgumentEntityType.ASSET, ArgumentEntityType.CUSTOMER].includes(
          newType as ArgumentEntityType,
        )
      ) {
        // 清空已有选项并显示 loading
        entityOptions.value = [];
        await loadEntityList(newType);
      } else {
        // 如果切换到不需要加载实体的类型，清空选项
        entityOptions.value = [];
      }
    },
  );

  // 监听实体选择变化，清空 key 列表
  watch(
    () => formState.value.refEntityId,
    (newVal, oldVal) => {
      console.log('refEntityId changed:', { newVal, oldVal });
      console.log('refEntityId newValue :>> ', newVal);
      console.log('refEntityId oldVal :>> ', oldVal);
      if (newVal && oldVal) {
        keyOptions.value = [];
        formState.value.key = '';
      }
    },
  );

  // 监听 scope 变化，清空 key 列表
  watch(
    () => formState.value.scope,
    (newVal, oldVal) => {
      console.log('scope changed:', { newVal, oldVal });
      console.log('scope newValue :>> ', newVal);
      console.log('scope oldVal :>> ', oldVal);
      if (newVal && oldVal) {
        keyOptions.value = [];
        formState.value.key = '';
      }
    },
  );

  const [registerModal, { closeModal }] = useModalInner(
    async (data: { argument?: any; index?: number; entityId?: string }) => {
      // 清空选项列表
      keyOptions.value = [];
      entityOptions.value = [];

      if (data?.argument) {
        // 编辑模式
        isEdit.value = true;
        editIndex.value = data.index ?? -1;
        console.log('argument :>> ', data?.argument);
        const arg = cloneDeep(data.argument);

        console.log('编辑参数，原始数据:', arg);

        // 处理 refEntityId (可能是完整的对象或只是 id)
        if (arg.refEntityId) {
          if (typeof arg.refEntityId === 'object' && arg.refEntityId.id) {
            arg.refEntityId = arg.refEntityId.id; // 只保存 id 用于Select
          }
        }

        // 先赋值所有数据（不调用 resetFields 避免清空数据）
        formState.value.name = arg.name || '';
        formState.value.entityType = arg.entityType || ArgumentEntityType.CURRENT_ENTITY;
        formState.value.type = arg.type || ArgumentType.TS_LATEST;
        formState.value.key = arg.key || '';
        formState.value.defaultValue = arg.defaultValue || '';
        formState.value.refEntityId = arg.refEntityId;
        formState.value.scope = arg.scope;

        console.log('编辑参数，formState.key:', formState.value.key, 'formState:', formState.value);

        // 如果有实体引用，加载实体列表
        if (
          arg.entityType &&
          [ArgumentEntityType.DEVICE, ArgumentEntityType.ASSET, ArgumentEntityType.CUSTOMER].includes(arg.entityType)
        ) {
          await loadEntityList(arg.entityType);
        }
      } else {
        // 新增模式
        isEdit.value = false;
        editIndex.value = -1;

        formState.value.name = '';
        formState.value.entityType = ArgumentEntityType.CURRENT_ENTITY;
        formState.value.type = ArgumentType.TS_LATEST;
        formState.value.key = '';
        formState.value.defaultValue = '';
        formState.value.refEntityId = undefined;
        formState.value.scope = undefined;
      }

      entityId.value = data.entityId;
      formRef.value?.clearValidate();
    },
  );

  async function loadEntityList(entityType: string) {
    try {
      entityLoading.value = true;
      let options: any[] = [];

      switch (entityType) {
        case ArgumentEntityType.DEVICE:
          const deviceListResult = await getTenantDeviceInfoList({
            pageSize: 50,
            page: 0,
            sortProperty: 'name',
            sortOrder: 'ASC',
          });
          options = deviceListResult.data.map((item) => ({
            label: item.name,
            value: item.id.id,
            entityData: item,
          }));
          break;

        case ArgumentEntityType.ASSET:
          const assetListResult = await getTenantAssetInfoList({
            pageSize: 50,
            page: 0,
            sortProperty: 'name',
            sortOrder: 'ASC',
          });
          options = assetListResult.data.map((item) => ({
            label: item.name,
            value: item.id.id,
            entityData: item,
          }));
          break;

        case ArgumentEntityType.CUSTOMER:
          const customerListResult = await customerList({
            pageSize: 50,
            page: 0,
            sortProperty: 'title',
            sortOrder: 'ASC',
          });
          options = customerListResult.data.map((item) => ({
            label: item.title,
            value: item.id.id,
            entityData: item,
          }));
          break;
      }

      entityOptions.value = options;
    } catch (error) {
      console.error('Failed to load entity list:', error);
    } finally {
      entityLoading.value = false;
    }
  }

  async function handleKeyFocus() {
    // 检查是否需要加载 keys
    if (
      [ArgumentEntityType.DEVICE, ArgumentEntityType.ASSET, ArgumentEntityType.CUSTOMER].includes(
        formState.value.entityType as ArgumentEntityType,
      ) &&
      !formState.value.refEntityId
    ) {
      // 如果是设备/资产/客户类型，但还没选择具体的实体，则不加载
      return;
    }

    // 如果是属性类型，需要先选择 scope（对于需要 scope 的实体类型）
    if (formState.value.type === ArgumentType.ATTRIBUTE && showAttributeScope.value && !formState.value.scope) {
      return;
    }

    await loadKeys();
  }

  async function loadKeys() {
    try {
      keyLoading.value = true;

      // 构建查询参数
      const isTimeSeries = formState.value.type === ArgumentType.TS_LATEST;
      const isAttribute = formState.value.type === ArgumentType.ATTRIBUTE;

      const params: any = {
        attributes: isAttribute,
        timeseries: isTimeSeries,
      };

      // 如果是属性且有 scope，添加 scope 参数
      if (isAttribute && formState.value.scope) {
        params.scope = formState.value.scope;
      }

      // 构建查询数据
      const queryData: any = {
        pageLink: { page: 0, pageSize: 100 },
      };

      // 根据实体类型构建 singleEntity
      if (formState.value.entityType === ArgumentEntityType.CURRENT_ENTITY) {
        console.log('entityId.value :>> ', entityId.value);
        queryData.entityFilter = {
          type: 'singleEntity',
          singleEntity: entityId.value,
        };
      } else if (formState.value.entityType === ArgumentEntityType.CURRENT_TENANT) {
        // 当前租户
        queryData.entityFilter = {
          type: 'singleEntity',
          singleEntity: {
            entityType: EntityType.TENANT,
            id: userStore.getUserInfo.tenantId.id,
          },
        };
      } else if (
        [ArgumentEntityType.DEVICE, ArgumentEntityType.ASSET, ArgumentEntityType.CUSTOMER].includes(
          formState.value.entityType as ArgumentEntityType,
        ) &&
        formState.value.refEntityId
      ) {
        // 选中的设备/资产/客户
        const selectedEntity = entityOptions.value.find((item) => item.value === formState.value.refEntityId);
        if (selectedEntity) {
          queryData.entityFilter = {
            type: 'singleEntity',
            singleEntity: selectedEntity.entityData.id,
          };
        }
      }

      const result = await findEntityKeyByQuery(params, queryData);

      // 根据类型从返回结果中提取对应的 keys
      let keys: string[] = [];
      if (result) {
        if (isTimeSeries && result.timeseries) {
          keys = result.timeseries;
        } else if (isAttribute && result.attribute) {
          keys = result.attribute;
        }
      }

      keyOptions.value = keys.map((key: string) => ({ value: key, label: key }));
    } catch (error) {
      console.error('Failed to load keys:', error);
      keyOptions.value = [];
    } finally {
      keyLoading.value = false;
    }
  }

  function handleEntityTypeChange() {
    // 当实体类型改变时，清空相关字段
    formState.value.refEntityId = undefined;
    formState.value.key = '';
    formState.value.scope = undefined;
    keyOptions.value = [];
    formRef.value?.clearValidate(['refEntityId', 'key', 'type', 'scope']);
  }

  function handleTypeChange() {
    // 当参数类型改变时，清空 key 和 scope
    formState.value.key = '';
    formState.value.scope = undefined;
    keyOptions.value = [];
    formRef.value?.clearValidate(['key', 'scope']);
  }

  function filterOption(input: string, option: any) {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  }

  async function handleSave() {
    try {
      await formRef.value?.validate();

      // 构建保存的数据
      const saveData: any = {
        name: formState.value.name,
        entityType: formState.value.entityType,
        defaultValue: formState.value.defaultValue || '',
      };

      // 根据实体类型构建不同的数据结构
      if (formState.value.entityType === ArgumentEntityType.CURRENT_ENTITY) {
        // 当前实体：只有 refEntityKey
        saveData.refEntityKey = {
          key: formState.value.key,
          type: formState.value.type,
        };

        // 如果是属性且有 scope
        if (formState.value.type === ArgumentType.ATTRIBUTE && formState.value.scope) {
          saveData.refEntityKey.scope = formState.value.scope;
        }
      } else if (formState.value.entityType === ArgumentEntityType.CURRENT_TENANT) {
        // 当前租户
        saveData.refEntityId = {
          entityType: EntityType.TENANT,
          id: userStore.getUserInfo.tenantId.id,
        };
        saveData.refEntityKey = {
          key: formState.value.key,
          type: formState.value.type,
        };
      } else if (
        [ArgumentEntityType.DEVICE, ArgumentEntityType.ASSET, ArgumentEntityType.CUSTOMER].includes(
          formState.value.entityType as ArgumentEntityType,
        )
      ) {
        // 设备/资产/客户
        const selectedEntity = entityOptions.value.find((item) => item.value === formState.value.refEntityId);
        if (selectedEntity) {
          saveData.refEntityId = selectedEntity.entityData.id;
          saveData.targetEntityName = selectedEntity.label;

          // 这些类型也需要 refEntityKey
          saveData.refEntityKey = {
            key: formState.value.key,
            type: formState.value.type,
          };

          // 如果是属性且有 scope
          if (formState.value.type === ArgumentType.ATTRIBUTE && formState.value.scope) {
            saveData.refEntityKey.scope = formState.value.scope;
          }
        }
      }

      // 保存 type、key 和 scope 用于编辑时回显
      saveData.type = formState.value.type;
      saveData.key = formState.value.key;
      saveData.scope = formState.value.scope;

      emit('success', {
        argument: cloneDeep(saveData),
        index: editIndex.value,
        isEdit: isEdit.value,
      });
      closeModal();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }

  function handleCancel() {
    formState.value = cloneDeep(init);
    formRef.value?.resetFields();
    closeModal();
  }
</script>
