<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%"
    :rootClassName="'tb-detail-wrapper'">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 tb-detail-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">客户详情</span>
        </div>
      </div>
    </template>
    <Tabs v-model:activeKey="tabActiveKey" class="tb-detail-menu">
      <TabPane key="DETAIL">
        <template #tab><span>
            <Icon :icon="'ant-design:appstore-outlined'" /> 详情
          </span> </template>
        <div class="space-x-4">
          <a-button type="primary" @click="handleCustomerUser" v-if="record.title != 'Public'">
            <Icon :icon="'ant-design:team-outlined'" />客户用户
          </a-button>
          <a-button type="primary success" @click="handleEditCustomer" v-if="record.title != 'Public'">
            <Icon :icon="'i-clarity:note-edit-line'" />编辑客户
          </a-button>
          <a-button type="primary" danger @click="handleDeleteCustomer" v-if="record.title != 'Public'">
            <Icon :icon="'ant-design:delete-outlined'" />删除客户
          </a-button>
        </div>
        <div class="space-x-4  my-4">
          <a-button @click="handleCopyCustomerId">
            <Icon :icon="'ant-design:copy-filled'" />
            复制客户ID
          </a-button>
        </div>
        <Description @register="register" size="default">
          <template #state="{ data }">
            {{ areaList.province_list[data.state] }}/
            {{ areaList.city_list[data.city] }}/
            {{ areaList.county_list[data.country] }}
          </template>
        </Description>
      </TabPane>
      <TabPane key="TELEMETRY">
        <template #tab><span>
            <Icon :icon="'ant-design:line-chart-outlined'" /> 数据
          </span> </template>
        <Telemetry :entityType="EntityType.CUSTOMER" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="ALARM">
        <template #tab><span>
            <Icon :icon="'ant-design:alert-outlined'" /> 报警
          </span> </template>
        <Alarm :entityType="EntityType.CUSTOMER" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="EVENT">
        <template #tab><span>
            <Icon :icon="'ant-design:info-circle-outlined'" /> 事件
          </span> </template>
        <Event :entityType="EntityType.CUSTOMER" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="RELATION">
        <template #tab><span>
            <Icon :icon="'ant-design:radar-chart-outlined'" /> 关联
          </span> </template>
        <Relation :entityType="EntityType.CUSTOMER" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="AUDIT_LOG">
        <template #tab><span>
            <Icon :icon="'ant-design:bars-outlined'" /> 审计日志
          </span> </template>
        <AuditLog :entityType="EntityType.CUSTOMER" :entityId="record?.id?.id" />
      </TabPane>
    </Tabs>

  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbCustomerDetail">
import { ref, unref, computed } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { Customer, getCustomerById } from '/@/api/tb/customer';
import { areaList } from '@vant/area-data';
import { Tabs, TabPane } from 'ant-design-vue';
import { DescItem, Description, useDescription } from '/@/components/Description';
import Telemetry from '/@/views/tb/telemetry/index.vue';
import AuditLog from '/@/views/tb/auditLog/list.vue';
import Alarm from '/@/views/tb/alarm/list.vue';
import Relation from '/@/views/tb/relation/list.vue';
import { EntityType } from '/@/enums/entityTypeEnum';
import Event from '/@/views/tb/event/index.vue';


const emit = defineEmits(['edit', 'delete', 'user', 'register',]);

const { t } = useI18n('tb');
const { showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<Customer>({} as Customer);

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
    record.value = await getCustomerById(data.id.id);
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
  record.value = {} as Customer;
  setDescProps({ data: {} });
}


function handleCopyCustomerId() {
  copyToClipboard(record.value.id.id, '复制客户ID成功！')
}

function handleDeleteCustomer() {
  emit('delete', record.value);
  closeDrawer();
}

function handleEditCustomer() {
  emit('edit', record.value);
  closeDrawer();
}

function handleCustomerUser() {
  emit('user', record.value);
  closeDrawer();
}

</script>
<style lang="less"></style>

