<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">实体视图详情</span>
        </div>
      </div>
    </template>
    <template #prependContent>
      <Tabs v-model:active-key="tabActiveKey" class="tb-detail-menu">
        <TabPane v-for="tab in tabList" :key="tab.key">
          <template #tab>
            <Icon :icon="tab.icon" :size="16" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>
    <div v-show="tabActiveKey == DetailTabItemEnum.DETAIL.key">
      <div class="space-x-4">
        <a-button
          type="primary"
          @click="handleAssignToPublic"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
        >
          <Icon :icon="'ant-design:share-alt-outlined'" />设为公开
        </a-button>
        <a-button
          type="primary"
          @click="handleAssignCustomer"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
        >
          <Icon :icon="'ant-design:contacts-outlined'" />分配客户
        </a-button>
        <a-button
          type="primary"
          @click="handleUnAssignFromCustomer"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle"
        >
          <Icon :icon="'ant-design:rollback-outlined'" />取消分配客户
        </a-button>

        <a-button type="primary success" @click="handleEditEntityView" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'i-clarity:note-edit-line'" />编辑实体视图
        </a-button>
        <a-button type="primary" danger @click="handleDeleteEntityView" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'ant-design:delete-outlined'" />删除实体视图
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyEntityViewId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制实体视图ID
        </a-button>
      </div>
      <Form layout="vertical" :disabled="true">
        <Form.Item label="视图名称" name="name">
          <Input :value="record.name" />
        </Form.Item>
        <Form.Item label="视图类型" name="type">
          <Input :value="record.type" />
        </Form.Item>
        <Row :gutter="16">
          <Col :span="6">
            <Form.Item label="目标实体类型" :name="['entityId', 'entityType']">
              <Select :value="record.entityId?.entityType" placeholder="请选择目标实体类型">
                <Select.Option :value="EntityType.DEVICE">设备</Select.Option>
                <Select.Option :value="EntityType.ASSET">资产</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="18">
            <Form.Item
              label="目标设备"
              :name="['entityId', 'id']"
              v-if="EntityType.DEVICE == record.entityId?.entityType"
            >
              <Select :value="record.entityId.id" placeholder="请选择目标设备" :options="entityIdOptions" />
            </Form.Item>
            <Form.Item
              label="目标资产"
              :name="['entityId', 'id']"
              :rules="[{ required: true, message: '请选择目标资产!' }]"
              v-if="EntityType.ASSET == record.entityId?.entityType"
            >
              <Select :value="record.entityId.id" placeholder="请选择目标资产" :options="entityIdOptions" />
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
            <Select :value="record.keys?.attributes?.cs" mode="tags" />
          </Form.Item>
          <Form.Item label="共享属性" :name="['keys', 'attributes', 'sh']">
            <Select :value="record.keys?.attributes?.sh" mode="tags" />
          </Form.Item>
          <Form.Item label="服务端属性" :name="['keys', 'attributes', 'ss']">
            <Select :value="record.keys?.attributes?.ss" mode="tags" />
          </Form.Item>
        </CollapseContainer>
        <CollapseContainer title="时间序列数据" class="border border-solid border-neutral-300 mb-4">
          <div class="p-4">
            <p class="text-help"
              >配置目标实体的 Timeseries 数据键,以便实体视图可以访问这些键。此 Timeseries 数据是只读的。</p
            >
          </div>
          <Form.Item label="遥测数据" :name="['keys', 'timeseries']">
            <Select :value="record.keys?.timeseries" mode="tags" />
          </Form.Item>
        </CollapseContainer>
        <Form.Item label="开始时间" :name="['startTimeMs']">
          <span v-if="record.startTimeMs">
            {{ dayjs(record.startTimeMs).format('YYYY-MM-DD HH:mm') }}
          </span>
        </Form.Item>
        <Form.Item label="结束时间" :name="['endTimeMs']">
          <span v-if="record.endTimeMs">
            {{ dayjs(record.endTimeMs).format('YYYY-MM-DD HH:mm') }}
          </span>
        </Form.Item>
        <Form.Item label="描述信息" :name="['additionalInfo', 'description']">
          {{ record.additionalInfo?.description }}
        </Form.Item>
      </Form>
    </div>

    <Telemetry
      v-if="tabActiveKey == DetailTabItemEnum.TELEMETRY.key"
      :entityType="EntityType.ENTITY_VIEW"
      :entityId="record?.id?.id"
    />

    <Alarm
      v-if="tabActiveKey == DetailTabItemEnum.ALARM.key"
      :entityType="EntityType.ENTITY_VIEW"
      :entityId="record?.id?.id"
    />

    <Event
      v-if="tabActiveKey == DetailTabItemEnum.EVENT.key"
      :entityType="EntityType.ENTITY_VIEW"
      :entityId="record?.id?.id"
    />
    <Relation
      v-if="tabActiveKey == DetailTabItemEnum.RELATION.key"
      :entityType="EntityType.ENTITY_VIEW"
      :entityId="record?.id?.id"
    />

    <AuditLog
      v-if="tabActiveKey == DetailTabItemEnum.AUDIT_LOG.key"
      :entityType="EntityType.ENTITY_VIEW"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbEntityViewDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { CollapseContainer } from '/@/components/Container';
  import dayjs from 'dayjs';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { EntityViewInfo, getEntityViewInfoById } from '/@/api/tb/entityView';
  import { Tabs, TabPane, Form, Row, Col, Select, Input } from 'ant-design-vue';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import Alarm from '/@/views/tb/alarm/list.vue';
  import Relation from '/@/views/tb/relation/list.vue';
  import Event from '/@/views/tb/event/index.vue';

  import { getTenantDeviceInfoList } from '/@/api/tb/device';
  import { getTenantAssetInfoList } from '/@/api/tb/asset';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';

  const userStore = useUserStore();

  const emit = defineEmits([
    'edit',
    'delete',
    'assignToPublic',
    'assignToCustomer',
    'unAssignFromCustomer',
    'register',
  ]);

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<EntityViewInfo>({} as EntityViewInfo);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = hasPermission(Authority.TENANT_ADMIN)
    ? [
        DetailTabItemEnum.DETAIL,
        DetailTabItemEnum.TELEMETRY,
        DetailTabItemEnum.ALARM,
        DetailTabItemEnum.EVENT,
        DetailTabItemEnum.RELATION,
        DetailTabItemEnum.AUDIT_LOG,
      ]
    : [
        DetailTabItemEnum.DETAIL,
        DetailTabItemEnum.TELEMETRY,
        DetailTabItemEnum.ALARM,
        DetailTabItemEnum.EVENT,
        DetailTabItemEnum.RELATION,
      ];
  const entityIdOptions = ref<Array<any>>([]);

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      clear();
      record.value = await getEntityViewInfoById(data.id.id);
      await handleEntityTypeChange(record.value.entityId.entityType);
    } catch (error: any) {
      if (error.message) {
        showMessage(error.message, 'error');
      }
      console.log('error', error);
    } finally {
      setDrawerProps({ loading: false });
    }
  });

  async function clear() {
    tabActiveKey.value = 'DETAIL';
    record.value = {} as EntityViewInfo;
  }

  async function handleEntityTypeChange(entityType: string) {
    const params = { pageSize: 100, page: 0, sortProperty: 'name', sortOrder: 'ASC' };
    const result =
      EntityType.DEVICE == entityType
        ? await getTenantDeviceInfoList(params as any)
        : await getTenantAssetInfoList(params as any);
    entityIdOptions.value = result.data.map((item: any) => ({ label: item.name, value: item.id.id }));
  }

  function handleCopyEntityViewId() {
    copyToClipboard(record.value.id.id, '复制实体视图ID成功！');
  }

  function handleDeleteEntityView() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditEntityView() {
    emit('edit', record.value);
    closeDrawer();
  }

  function handleAssignToPublic() {
    emit('assignToPublic', record.value);
    closeDrawer();
  }

  function handleAssignCustomer() {
    emit('assignToCustomer', record.value);
    closeDrawer();
  }

  function handleUnAssignFromCustomer() {
    emit('unAssignFromCustomer', record.value);
    closeDrawer();
  }
</script>
<style lang="less"></style>
