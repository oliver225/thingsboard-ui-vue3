<template>
  <Form ref="formRef" :model="formState" layout="vertical">
    <div class="border border-neutral-400 p-2 rounded">
      <p class="text-base font-bold">关系搜索参数</p>
      <div class="p-2">
        <Form.Item label="方向" name="direction">
          <Select v-model:value="formState.direction">
            <Select.Option value="FROM">从 发起者</Select.Option>
            <Select.Option value="TO">到 发起者</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="关联类型" name="relationType" :rules="[{ required: true, message: '请选择关联类型!' }]">
          <Select
            v-model:value="formState.relationType"
            :options="relationTypeOptions.map((item) => ({ value: item }))"
          >
            <template #dropdownRender="{ menuNode: menu }">
              <v-nodes :vnodes="menu" />
              <Divider style="margin: 4px 0" />
              <Space style="padding: 4px 8px">
                <Input ref="inputRef" v-model:value="addName" placeholder="请输入关联关系" />
                <Button type="text" @click="addRelationType">
                  <template #icon>
                    <plus-outlined />
                  </template>
                  添加关联关系
                </Button>
              </Space>
            </template>
          </Select>
        </Form.Item>
        <Form.Item name="checkAllKeys">
          <Checkbox v-model:checked="formState.checkForSingleEntity"> 检查与特定实体的关系 </Checkbox>
        </Form.Item>
        <Row :gutter="20" v-if="formState.checkForSingleEntity == true">
          <Col :span="12">
            <Form.Item label="实体类型" name="entityType">
              <Select
                v-model:value="formState.entityType"
                :options="entityTypeOptions"
                @change="handleEntityTypeChange"
              ></Select>
            </Form.Item>
          </Col>
          <Col :span="12" v-if="formState.entityType">
            <Form.Item
              :label="ENTITY_TYPE_OPTIONS.find((type) => type.value == formState.entityType)?.label"
              name="entityId"
            >
              <Select v-model:value="formState.entityId" :options="entityIdOptions"></Select>
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  </Form>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'check-relation-presence',
  });
</script>
<script lang="ts" setup>
  import { ref, watch, defineComponent, reactive } from 'vue';
  import { PlusOutlined } from '@ant-design/icons-vue';
  import { Form, Select, Checkbox, Divider, Space, Input, Row, Col, Button } from 'ant-design-vue';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { useUserStore } from '/@/store/modules/user';
  import { ENTITY_TYPE_OPTIONS } from '/@/enums/entityTypeEnum';
  import { tenantById } from '/@/api/tb/tenant';
  import { customerList } from '/@/api/tb/customer';
  import { userList } from '/@/api/tb/user';
  import { currentTenantDashboardList } from '/@/api/tb/dashboard';
  import { getTenantAssetList } from '/@/api/tb/asset';
  import { getTenantEntityViews } from '/@/api/tb/entityView';
  import { getTenantDeviceList } from '/@/api/tb/device';

  interface Configuration {
    direction: string;
    relationType: string;
    checkForSingleEntity: boolean;
    entityType: EntityType;
    entityId: string;
  }

  const VNodes = defineComponent({
    props: {
      vnodes: {
        type: Object,
        required: true,
      },
    },
    render() {
      return this.vnodes;
    },
  });

  const props = defineProps({
    configuration: {
      type: Object as PropType<Configuration>,
      required: true,
    },
    ruleChainId: { type: String, default: '' },
  });

  const userStore = useUserStore();

  const addName = ref();
  const inputRef = ref();
  const formRef = ref<FormInstance>();
  const relationTypeOptions = ref(['Contains', 'Manages']);
  const entityIdOptions = ref();

  const entityTypeOptions = ENTITY_TYPE_OPTIONS.filter((item) => {
    return (
      item.value == EntityType.TENANT ||
      item.value == EntityType.CUSTOMER ||
      item.value == EntityType.USER ||
      item.value == EntityType.DASHBOARD ||
      item.value == EntityType.ASSET ||
      item.value == EntityType.ENTITY_VIEW ||
      item.value == EntityType.DEVICE
    );
    //TODO edge;
  });

  const formState = reactive<any>({
    direction: 'FROM',
    relationType: 'Contains',
    checkForSingleEntity: true,
    entityType: undefined,
    entityId: undefined,
  });

  watch(
    () => props.configuration,
    async () => {
      formState.direction = props.configuration.direction;
      formState.relationType = props.configuration.relationType;
      formState.checkForSingleEntity = props.configuration.checkForSingleEntity;
      formState.entityType = props.configuration.entityType;
      formState.entityId = props.configuration.entityId;
      if (formState.entityType) {
        await handleEntityTypeChange(formState.entityType);
      }
    },
    { immediate: true },
  );

  function addRelationType(e) {
    e.preventDefault();
    relationTypeOptions.value.push(addName.value);
    addName.value = '';
    setTimeout(() => {
      inputRef.value?.focus();
    }, 0);
  }

  async function handleEntityTypeChange(entityType) {
    formState.entityId = undefined;
    switch (entityType) {
      case EntityType.TENANT:
        const tenant = await tenantById(userStore.getUserInfo.tenantId.id);
        entityIdOptions.value = [{ value: tenant.id.id, label: tenant.title }];
        break;
      case EntityType.CUSTOMER:
        const customerResult = await customerList({ pageSize: 1000, page: 0, sortProperty: 'title', sortOrder: 'ASC' });
        entityIdOptions.value = customerResult.data.map((item) => ({ value: item.id.id, label: item.title }));
        break;
      case EntityType.USER:
        const userResultList = await userList({ pageSize: 1000, page: 0, sortProperty: 'email', sortOrder: 'ASC' });
        entityIdOptions.value = userResultList.data.map((item) => ({ value: item.id.id, label: item.name }));
        break;
      case EntityType.DASHBOARD:
        const dashboardList = await currentTenantDashboardList({
          pageSize: 1000,
          page: 0,
          sortProperty: 'title',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = dashboardList.data.map((item) => ({ value: item.id.id, label: item.title }));
        break;
      case EntityType.ASSET:
        const assetResultList = await getTenantAssetList({
          pageSize: 1000,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = assetResultList.data.map((item) => ({ value: item.id.id, label: item.name }));
        break;
      case EntityType.ENTITY_VIEW:
        const entityViewList = await getTenantEntityViews({
          pageSize: 1000,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = entityViewList.data.map((item) => ({ value: item.id.id, label: item.name }));
        break;
      case EntityType.DEVICE:
        const deviceList = await getTenantDeviceList({
          pageSize: 1000,
          page: 0,
          sortProperty: 'name',
          sortOrder: 'ASC',
        });
        entityIdOptions.value = deviceList.data.map((item) => ({ value: item.id.id, label: item.name }));
        break;
    }
    //TODO edge;
  }

  async function getConfiguration() {
    try {
      return await formRef.value?.validate();
    } catch (error: any) {
      throw error;
    }
  }

  defineExpose({ getConfiguration });
</script>
