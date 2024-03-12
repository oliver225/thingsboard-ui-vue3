<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">租户详情</span>
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
      </Tabs>
    </template>
    <div class="detail-info-card">
      <Relation :entityType="EntityType.TENANT" :entityId="record?.id?.id" v-if="tabActiveKey == 'RELATION'" />
    </div>
    <div class="detail-info-card">
      <Alarm :entityType="EntityType.TENANT" :entityId="record?.id?.id" v-if="tabActiveKey == 'ALARM'" />
    </div>
    <div class="telemetry-card">
      <Telemetry :entityType="EntityType.TENANT" :entityId="record?.id?.id" v-if="tabActiveKey == 'TELEMETRY'" />
    </div>
    <div class="event-card">
      <Event :entityType="EntityType.TENANT" :entityId="record?.id?.id" v-if="tabActiveKey == 'EVENT'" />
    </div>
    <div class="-translate-x-6" v-show="tabActiveKey == 'DETAIL'">
      <Space size="middle" class="mb-3">
        <a-button type="primary" @click="handleTenantAdmin">
          <Icon :icon="'ant-design:team-outlined'" />租户管理员
        </a-button>
        <a-button type="primary success" @click="handleEditTenant">
          <Icon :icon="'clarity:note-edit-line'" />编辑租户
        </a-button>
        <a-button type="primary" danger @click="handleDeleteTenant">
          <Icon :icon="'ant-design:delete-outlined'" />租删租户
        </a-button>
      </Space>
      <br />
      <Space size="middle" class="mb-3">
        <a-button @click="handleCopyTenantId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制租户ID
        </a-button>
      </Space>
      <Description @register="register" size="default">
        <template #state="{ data }">
          {{ areaList.province_list[data.state] }}/
          {{ areaList.city_list[data.city] }}/
          {{ areaList.county_list[data.country] }}
        </template>
      </Description>
    </div>

  </BasicDrawer>
</template>
<script lang="ts" setup name="TenantDetail">
import { ref, unref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { TenantInfo, tenantInfoById } from '/@/api/things/tenant';
import { areaList } from '@vant/area-data';
import { Tabs, TabPane, Space } from 'ant-design-vue';
import { DescItem, Description, useDescription } from '/@/components/Description';
import Telemetry from '/@/views/things/telemetry/index.vue';
import Alarm from '/@/views/things/alarm/list.vue';
import Relation from '/@/views/things/relation/list.vue';
import Event from '/@/views/things/event/index.vue';

import { EntityType } from '/@/enums/entityTypeEnum';


const emit = defineEmits(['edit', 'delete', 'admin', 'register',]);

const { t } = useI18n('things');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<TenantInfo>({} as TenantInfo);

const getTitle = computed(() => ({
  icon: meta.icon || 'ant-design:book-outlined',
  value: record.value.title,
}));

const tabActiveKey = ref('DETAIL');

const descSchema: DescItem[] = [
  {
    label: t('租户名称'),
    field: 'title',
    span: 4,
  },
  {
    label: t('租户配置'),
    field: 'tenantProfileName',
    span: 2,

  },
  {
    label: t('手机号码'),
    field: 'phone',
    span: 2,
  },
  {
    label: t('邮政编码'),
    field: 'zip',
    span: 2,

  },
  {
    label: t('邮箱地址'),
    field: 'email',
    span: 2,

  },
  {
    label: t('省市区域'),
    field: 'state',
    span: 4,
    slot: 'state',
  },

  {
    label: t('详细地址'),
    field: 'address',
    span: 4,
  },
  {
    label: t('备用地址'),
    field: 'address2',
    span: 4,
  },

  {
    label: t('描述信息'),
    field: 'additionalInfo.description',
    span: 4,
  },
];
const [register, { setDescProps }] = useDescription({
  schema: descSchema,
})



const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  try {
    setDrawerProps({ loading: true });
    await clear();
    record.value = await tenantInfoById(data.id.id);
    setDescProps({ data: record.value });
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
  record.value = {} as TenantInfo;
  setDescProps({ data: {} });
}


function handleCopyTenantId() {
  copyToClipboard(record.value.id.id, '复制租户ID成功！')
}

function handleDeleteTenant() {
  emit('delete', record.value);
  closeDrawer();
}

function handleEditTenant() {
  emit('edit', record.value);
  closeDrawer();
}

function handleTenantAdmin() {
  emit('admin', record.value);
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
