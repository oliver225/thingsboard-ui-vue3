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
    <Form ref="formRef" :model="formState" layout="vertical">
      <Form.Item label="视图名称" name="name" :rules="[{ required: true, message: '请输入实体视图名称!' }]">
        <Input v-model:value="formState.name" placeholder="请输入实体视图名称" />
      </Form.Item>
      <Form.Item label="视图类型" name="type" :rules="[{ required: true, message: '请输入实体视图类型!' }]">
        <Input v-model:value="formState.type" placeholder="请输入实体视图类型" />
      </Form.Item>
      <Row :gutter="16">
        <Col :span="6">
          <Form.Item
            label="目标实体类型"
            :name="['entityId', 'entityType']"
            :rules="[{ required: true, message: '请选择目标实体类型!' }]"
          >
            <Select
              v-model:value="formState.entityId.entityType"
              placeholder="请选择目标实体类型"
              @change="handleEntityTypeChange"
            >
              <Select.Option :value="EntityType.DEVICE">设备</Select.Option>
              <Select.Option :value="EntityType.ASSET">资产</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="18">
          <Form.Item
            label="目标设备"
            :name="['entityId', 'id']"
            :rules="[{ required: true, message: '请选择目标设备!' }]"
            v-if="EntityType.DEVICE == formState.entityId?.entityType"
          >
            <Select
              v-model:value="formState.entityId.id"
              placeholder="请选择目标设备"
              :options="entityIdOptions"
              :loading="selectFetchLoading"
            >
            </Select>
          </Form.Item>
          <Form.Item
            label="目标资产"
            :name="['entityId', 'id']"
            :rules="[{ required: true, message: '请选择目标资产!' }]"
            v-if="EntityType.ASSET == formState.entityId?.entityType"
          >
            <Select
              v-model:value="formState.entityId.id"
              placeholder="请选择目标资产"
              :options="entityIdOptions"
              :loading="selectFetchLoading"
            >
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <CollapseContainer title="属性传播" class="border border-solid border-neutral-300 mb-4">
        <div class="p-4">
          <p class="text-help">每次保存或更新这个实体视图时将自动从目标实体复制指定的属性。</p>
          <p class="text-help">由于性能原因目标实体属性不会在每次属性更改时传递到实体视图。</p>
          <p class="text-help"
            >你可以通过配置"<strong>copy to view</strong>"规则链中的规则节点，并将"<strong>Post attributes</strong
            >"和"<strong>attributes Updated</strong>"消息链接到新规则节点，从而启用自动传递。</p
          >
        </div>

        <Form.Item label="客户端属性" :name="['keys', 'attributes', 'cs']">
          <Select
            v-model:value="formState.keys.attributes.cs"
            :options="clientScopeOptions"
            :mode="'tags'"
            :loading="selectFetchLoading"
            @focus="fetchClientScopeAttribute"
            :allow-clear="true"
            placeholder="请选择客户端属性"
          >
          </Select>
        </Form.Item>
        <Form.Item label="共享属性" :name="['keys', 'attributes', 'sh']">
          <Select
            v-model:value="formState.keys.attributes.sh"
            :options="sharedScopeOptions"
            :mode="'tags'"
            :loading="selectFetchLoading"
            @focus="fetchSharedScopeAttribute"
            :allow-clear="true"
            placeholder="请选择共享属性"
          >
          </Select>
        </Form.Item>
        <Form.Item label="服务端属性" :name="['keys', 'attributes', 'ss']">
          <Select
            v-model:value="formState.keys.attributes.ss"
            :options="serverScopeOptions"
            :mode="'tags'"
            :loading="selectFetchLoading"
            @focus="fetchServerScopeAttribute"
            :allow-clear="true"
            placeholder="请选择服务端属性"
          >
          </Select>
        </Form.Item>
      </CollapseContainer>
      <CollapseContainer title="时间序列数据" class="border border-solid border-neutral-300 mb-4">
        <div class="p-4">
          <p class="text-help"
            >配置目标实体的 Timeseries 数据键,以便实体视图可以访问这些键。此 Timeseries 数据是只读的。</p
          >
        </div>
        <Form.Item label="遥测数据" :name="['keys', 'timeseries']">
          <Select
            v-model:value="formState.keys.timeseries"
            :options="timeseriesOptions"
            :mode="'tags'"
            :loading="selectFetchLoading"
            :allow-clear="true"
            @focus="fetchTimeseriesAttribute"
            placeholder="请选择遥测数据"
          >
          </Select>
        </Form.Item>
      </CollapseContainer>
      <Form.Item label="开始时间" :name="['startTimeMs']">
        <DatePicker
          v-model:value="formState.startTimeMs"
          :showTime="{ format: 'HH:mm' }"
          :format="'YYYY-MM-DD HH:mm'"
          placeholder="开始时间"
        >
        </DatePicker>
      </Form.Item>
      <Form.Item label="结束时间" :name="['endTimeMs']">
        <DatePicker
          v-model:value="formState.endTimeMs"
          :showTime="{ format: 'HH:mm' }"
          :format="'YYYY-MM-DD HH:mm'"
          placeholder="结束时间"
        >
        </DatePicker>
      </Form.Item>

      <Form.Item label="描述信息" :name="['additionalInfo', 'description']">
        <Textarea v-model:value="formState.additionalInfo.description" placeholder="输入实体视图描述信息" :rows="3" />
      </Form.Item>
    </Form>
  </BasicModal>
</template>
<script lang="ts" setup name="ViewsTbEntityViewForm">
  import { ref, unref, computed, reactive } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { CollapseContainer } from '/@/components/Container';
  import { usePermission } from '/@/hooks/web/usePermission';

  import { Select, Row, Col, DatePicker, Textarea, Form, Input } from 'ant-design-vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { useUserStore } from '/@/store/modules/user';
  import { EntityViewInfo, getEntityViewById, saveEntityView } from '/@/api/tb/entityView';
  import { getAttributeKeysByScope, getTimeseriesKeys } from '/@/api/tb/telemetry';
  import { getTenantAssetInfoList } from '/@/api/tb/asset';
  import { getTenantDeviceInfoList } from '/@/api/tb/device';
  import { Scope } from '/@/enums/telemetryEnum';
  import { FormInstance } from 'ant-design-vue/lib/form';
  import { isEmpty, isNumber } from 'lodash-es';
  import dayjs from 'dayjs';
  import { Authority } from '/@/enums/authorityEnum';
  import { EntityType } from '/@/enums/entityTypeEnum';

  const emit = defineEmits(['success', 'register']);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const userStore = useUserStore();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const selectFetchLoading = ref(false);
  const formRef = ref<FormInstance>();
  const record = ref<EntityViewInfo>({} as EntityViewInfo);
  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.id?.id ? t('编辑实体视图') : t('新增实体视图'),
  }));

  const entityIdOptions = ref<Array<any>>([]);
  const clientScopeOptions = ref<Array<any>>([]);
  const serverScopeOptions = ref<Array<any>>([]);
  const sharedScopeOptions = ref<Array<any>>([]);
  const timeseriesOptions = ref<Array<any>>([]);

  const formState = reactive<EntityViewInfo>({
    name: undefined,
    type: undefined,
    entityId: { entityType: EntityType.DEVICE, id: '' },
    keys: { timeseries: new Array(), attributes: { cs: new Array(), ss: new Array(), sh: new Array() } },
    startTimeMs: undefined,
    endTimeMs: undefined,
    additionalInfo: { description: undefined },
  } as EntityViewInfo);

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    setModalProps({ loading: true });
    record.value = { ...data } as EntityViewInfo;
    clear();
    if (data?.id?.id) {
      const res = await getEntityViewById(data.id.id);
      record.value = (res || {}) as EntityViewInfo;
      await handleEntityTypeChange(record.value.entityId?.entityType || EntityType.DEVICE);
      if (isEmpty(record.value.keys)) {
        record.value.keys = { timeseries: [], attributes: { cs: [], ss: [], sh: [] } };
      }
      if (isEmpty(record.value.additionalInfo)) {
        record.value.additionalInfo = { description: undefined };
      }
      if (isNumber(record.value.startTimeMs)) {
        record.value.startTimeMs = dayjs(record.value.startTimeMs).unix();
      }
      if (isNumber(record.value.endTimeMs)) {
        record.value.endTimeMs = dayjs(record.value.endTimeMs).unix();
      }
      Object.keys(record.value).forEach((key) => {
        formState[key] = record.value[key];
      });
    } else {
      await handleEntityTypeChange(EntityType.DEVICE);
    }

    setModalProps({ loading: false });
  });

  function clear() {
    formState.name = undefined;
    formState.type = undefined;
    formState.entityId = { entityType: EntityType.DEVICE, id: '' };
    formState.keys = { timeseries: [], attributes: { cs: [], ss: [], sh: [] } };
    formState.startTimeMs = undefined;
    formState.endTimeMs = undefined;
    formState.additionalInfo = { description: undefined };
  }

  async function handleSubmit() {
    try {
      const data = await formRef.value?.validate();
      if (data == undefined) {
        throw new Error('数据为空');
      }
      setModalProps({ confirmLoading: true });
      data.keys.timeseries = formState.keys.timeseries;
      data.keys.attributes.cs = formState.keys.attributes.cs;
      data.keys.attributes.ss = formState.keys.attributes.ss;
      data.keys.attributes.sh = formState.keys.attributes.sh;
      if (!isEmpty(data.startTimeMs) && !isNumber(data.startTimeMs)) {
        data.startTimeMs = dayjs(data.startTimeMs, 'YYYY-MM-DD HH:mm').valueOf();
      }
      if (!isEmpty(data.endTimeMs) && !isNumber(data.endTimeMs)) {
        data.endTimeMs = dayjs(data.endTimeMs, 'YYYY-MM-DD HH:mm').valueOf();
      }
      const res = await saveEntityView({ ...data, id: record.value.id });
      showMessage(`${record.value.id?.id ? '编辑' : '新增'}实体视图成功！`);
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

  async function handleEntityTypeChange(entityType: any) {
    formState.entityId.id = undefined;
    selectFetchLoading.value = true;
    const params = { pageSize: 100, page: 0, sortProperty: 'name', sortOrder: 'ASC' };
    const result =
      EntityType.DEVICE == entityType
        ? await getTenantDeviceInfoList(params as any)
        : await getTenantAssetInfoList(params as any);
    entityIdOptions.value = result.data.map((item: any) => ({ label: item.name, value: item.id.id }));
    selectFetchLoading.value = false;
  }

  async function fetchClientScopeAttribute() {
    if (isEmpty(formState.entityId.id)) {
      clientScopeOptions.value = [];
      return;
    }
    selectFetchLoading.value = true;
    const result = await getAttributeKeysByScope(formState.entityId, Scope.CLIENT_SCOPE);
    clientScopeOptions.value = result.map((item) => ({ label: item, value: item }));
    selectFetchLoading.value = false;
  }

  async function fetchSharedScopeAttribute() {
    if (isEmpty(formState.entityId.id)) {
      sharedScopeOptions.value = [];
      return;
    }
    selectFetchLoading.value = true;
    const result = await getAttributeKeysByScope(formState.entityId, Scope.SHARED_SCOPE);
    sharedScopeOptions.value = result.map((item) => ({ label: item, value: item }));
    selectFetchLoading.value = false;
  }

  async function fetchServerScopeAttribute() {
    if (isEmpty(formState.entityId.id)) {
      serverScopeOptions.value = [];
      return;
    }
    selectFetchLoading.value = true;
    const result = await getAttributeKeysByScope(formState.entityId, Scope.SERVER_SCOPE);
    serverScopeOptions.value = result.map((item) => ({ label: item, value: item }));
    selectFetchLoading.value = false;
  }

  async function fetchTimeseriesAttribute() {
    if (isEmpty(formState.entityId.id)) {
      timeseriesOptions.value = [];
      return;
    }
    selectFetchLoading.value = true;
    const result = await getTimeseriesKeys(formState.entityId);
    timeseriesOptions.value = result.map((item) => ({ label: item, value: item }));
    selectFetchLoading.value = false;
  }
</script>
