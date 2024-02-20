<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">实体视图详情</span>
        </div>
      </div>
      <Tabs v-model:activeKey="tabActiveKey" class="drawer-title-tabs">
        <TabPane key="DETAIL">
          <template #tab><span>
              <Icon :icon="'ant-design:appstore-outlined'" /> 详情
            </span> </template>
        </TabPane>
        <TabPane key="TELEMETRY">
          <template #tab><span>
              <Icon :icon="'ant-design:line-chart-outlined'" /> 数据
            </span> </template>
        </TabPane>
        <TabPane key="ALARM">
          <template #tab><span>
              <Icon :icon="'ant-design:alert-outlined'" /> 报警
            </span> </template>
        </TabPane>
        <TabPane key="EVENT">
          <template #tab><span>
              <Icon :icon="'ant-design:info-circle-outlined'" /> 事件
            </span> </template>
        </TabPane>
        <TabPane key="RELATION">
          <template #tab><span>
              <Icon :icon="'ant-design:radar-chart-outlined'" /> 关联
            </span> </template>
        </TabPane>
        <TabPane key="AUDIT_LOG" v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
          <template #tab><span>
              <Icon :icon="'ant-design:bars-outlined'" /> 审计日志
            </span> </template>
        </TabPane>
      </Tabs>
    </template>
    <div class="detail-info-card">
      <Relation :entityType="EntityType.ENTITY_VIEW" :entityId="record?.id?.id" v-if="tabActiveKey == 'RELATION'" />
    </div>
    <div class="detail-info-card">
      <Alarm :entityType="EntityType.ENTITY_VIEW" :entityId="record?.id?.id" v-if="tabActiveKey == 'ALARM'" />
    </div>
    <div class="detail-info-card">
      <AuditLog :entityType="EntityType.ENTITY_VIEW" :entityId="record?.id?.id" v-if="tabActiveKey == 'AUDIT_LOG'" />
    </div>
    <div class="telemetry-card">
      <Telemetry :entityType="EntityType.ENTITY_VIEW" :entityId="record?.id?.id" v-if="tabActiveKey == 'TELEMETRY'" />
    </div>
    <div class="-translate-x-6" v-show="tabActiveKey == 'DETAIL'">
      <Space size="middle" class="mb-3">

        <a-button type="primary" @click="handleAssignToPublic"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN && !!!record.customerTitle">
          <Icon :icon="'ant-design:share-alt-outlined'" />设为公开
        </a-button>
        <a-button type="primary" @click="handleAssignCustomer"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN && !!!record.customerTitle">
          <Icon :icon="'ant-design:contacts-outlined'" />分配客户
        </a-button>
        <a-button type="primary" @click="handleUnAssignFromCustomer"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN && !!record.customerTitle">
          <Icon :icon="'ant-design:rollback-outlined'" />取消分配客户
        </a-button>

        <a-button type="primary success" @click="handleEditEntityView"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
          <Icon :icon="'clarity:note-edit-line'" />编辑实体视图
        </a-button>
        <a-button type="primary" danger @click="handleDeleteEntityView"
          v-if="userStore.getAuthority == Authority.TENANT_ADMIN">
          <Icon :icon="'ant-design:delete-outlined'" />删除实体视图
        </a-button>
      </Space>
      <br />
      <Space size="middle" class="mb-3">
        <a-button @click="handleCopyEntityViewId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制实体视图ID
        </a-button>
      </Space>
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
          <Form.Item label="目标设备" :name="['entityId', 'id']" v-if="EntityType.DEVICE == record.entityId?.entityType">
            <Select :value="record.entityId.id" placeholder="请选择目标设备" :options="entityIdOptions">
            </Select>
          </Form.Item>
          <Form.Item label="目标资产" :name="['entityId', 'id']" :rules="[
            { required: true, message: '请选择目标资产!' }]" v-if="EntityType.ASSET == record.entityId?.entityType">
            <Select :value="record.entityId.id" placeholder="请选择目标资产" :options="entityIdOptions">
            </Select>
          </Form.Item>
          </Col>
        </Row>
        <CollapseContainer title="属性传播" class="border border-neutral-300 mb-4">
          <div class="p-4">
            <p class="text-help">每次保存或更新这个实体视图时将自动从目标实体复制指定的属性。</p>
            <p class="text-help">由于性能原因目标实体属性不会在每次属性更改时传递到实体视图。</p>
            <p class="text-help">你可以通过配置"<strong>copy to view</strong>"规则链中的规则节点，并将"<strong>Post
                attributes</strong>"和"<strong>attributes
                Updated</strong>"消息链接到新规则节点，从而启用自动传递。</p>
          </div>
          <Form.Item label="客户端属性" :name="['keys', 'attributes', 'cs']">
            <Select :value="record.keys?.attributes?.cs" mode="tags">
            </Select>
          </Form.Item>
          <Form.Item label="共享属性" :name="['keys', 'attributes', 'sh']">
            <Select :value="record.keys?.attributes?.sh" mode="tags">
            </Select>
          </Form.Item>
          <Form.Item label="服务端属性" :name="['keys', 'attributes', 'ss']">
            <Select :value="record.keys?.attributes?.ss" mode="tags">
            </Select>
          </Form.Item>
        </CollapseContainer>
        <CollapseContainer title="时间序列数据" class="border border-neutral-300 mb-4">
          <div class="p-4">
            <p class="text-help">配置目标实体的 Timeseries 数据键,以便实体视图可以访问这些键。此 Timeseries 数据是只读的。</p>
          </div>
          <Form.Item label="时序数据" :name="['keys', 'timeseries']">
            <Select :value="record.keys?.timeseries" mode="tags">
            </Select>
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

  </BasicDrawer>
</template>
<script lang="ts" setup name="EntityViewDetail">
import { ref, unref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { CollapseContainer } from '/@/components/Container'
import dayjs from 'dayjs';
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { EntityViewInfo, getEntityViewInfoById } from '/@/api/things/entityView';
import { Tabs, TabPane, Space, Form, Row, Col, Select, Input } from 'ant-design-vue';
import { useUserStore } from '/@/store/modules/user';
import { Authority } from '/@/enums/authorityEnum';
import Telemetry from '/@/views/things/telemetry/index.vue';
import AuditLog from '/@/views/things/auditLog/list.vue';
import Alarm from '/@/views/things/alarm/list.vue';
import Relation from '/@/views/things/relation/list.vue';

import { EntityType } from '/@/enums/entityTypeEnum';
import { getTenantDeviceInfoList } from '/@/api/things/device';
import { getTenantAssetInfoList } from '/@/api/things/asset';

const userStore = useUserStore();

const emit = defineEmits(['edit', 'delete', 'assignToPublic', 'assignToCustomer', 'unAssignFromCustomer', 'register',]);

const { t } = useI18n('things');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<EntityViewInfo>({} as EntityViewInfo);

const getTitle = computed(() => ({
  icon: meta.icon || 'ant-design:book-outlined',
  value: record.value.name,
}));

const tabActiveKey = ref('DETAIL');

const entityIdOptions = ref<Array<any>>([]);


const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  try {
    setDrawerProps({ loading: true });
    clear();
    record.value = await getEntityViewInfoById(data.id.id);
    await handleEntityTypeChange(record.value.entityId.entityType)
  } catch (error: any) {
    if (error.message) {
      showMessage(error.message, 'error')
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
  const result = EntityType.DEVICE == entityType ? await getTenantDeviceInfoList(params as any) : await getTenantAssetInfoList(params as any);
  entityIdOptions.value = result.data.map((item: any) => ({ label: item.name, value: item.id.id }));
}


function handleCopyEntityViewId() {
  copyToClipboard(record.value.id.id, '复制实体视图ID成功！')
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
<style lang="less">
.telemetry-card {
  .jeesite-basic-table {
    padding: 0;

    .jeesite-basic-table-header__header-top {
      margin-top: 0;
    }
  }
}

.detail-info-card {
  .jeesite-basic-table {
    padding: 0;

    .jeesite-basic-table-header__header-top {
      display: none;
    }
  }
}
</style>