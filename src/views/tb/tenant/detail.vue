<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ t('tb.tenant.detail.detail') }}</span>
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
        <a-button type="primary" @click="handleTenantAdmin">
          <Icon :icon="'ant-design:team-outlined'" />{{ t('tb.tenant.action.adminList') }}
        </a-button>
        <a-button type="primary success" @click="handleEditTenant">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.tenant.action.edit') }}
        </a-button>
        <a-button type="primary" danger @click="handleDeleteTenant">
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.tenant.action.delete') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyTenantId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.tenant.detail.copyId') }}
        </a-button>
      </div>
      <Description @register="register" size="default">
        <template #state="{ data }">
          {{ areaList.province_list[data.state] }}/ {{ areaList.city_list[data.city] }}/
          {{ areaList.county_list[data.country] }}
        </template>
      </Description>
    </div>
    <Telemetry
      v-if="tabActiveKey == DetailTabItemEnum.TELEMETRY.key"
      :entityType="EntityType.TENANT"
      :entityId="record?.id?.id"
    />
    <Alarm
      v-if="tabActiveKey == DetailTabItemEnum.ALARM.key"
      :entityType="EntityType.TENANT"
      :entityId="record?.id?.id"
    />
    <Event
      v-if="tabActiveKey == DetailTabItemEnum.EVENT.key"
      :entityType="EntityType.TENANT"
      :entityId="record?.id?.id"
    />
    <Relation
      v-if="tabActiveKey == DetailTabItemEnum.RELATION.key"
      :entityType="EntityType.TENANT"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbTenantDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { TenantInfo, tenantInfoById } from '/@/api/tb/tenant';
  import { areaList } from '@vant/area-data';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { Tabs, TabPane } from 'ant-design-vue';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import Alarm from '/@/views/tb/alarm/list.vue';
  import Relation from '/@/views/tb/relation/list.vue';
  import Event from '/@/views/tb/event/index.vue';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';

  const emit = defineEmits(['edit', 'delete', 'admin', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<TenantInfo>({} as TenantInfo);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.title,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = [
    DetailTabItemEnum.DETAIL,
    DetailTabItemEnum.TELEMETRY,
    DetailTabItemEnum.ALARM,
    DetailTabItemEnum.EVENT,
    DetailTabItemEnum.RELATION,
  ];

  const descSchema: DescItem[] = [
    {
      label: t('tb.tenant.form.title'),
      field: 'title',
      span: 4,
    },
    {
      label: t('tb.tenant.form.tenantProfile'),
      field: 'tenantProfileName',
      span: 2,
    },
    {
      label: t('tb.tenant.form.phone'),
      field: 'phone',
      span: 2,
    },
    {
      label: t('tb.tenant.form.zip'),
      field: 'zip',
      span: 2,
    },
    {
      label: t('tb.tenant.form.email'),
      field: 'email',
      span: 2,
    },
    {
      label: t('tb.tenant.form.area'),
      field: 'state',
      span: 4,
      slot: 'state',
    },

    {
      label: t('tb.tenant.form.address'),
      field: 'address',
      span: 4,
    },
    {
      label: t('tb.tenant.form.address2'),
      field: 'address2',
      span: 4,
    },

    {
      label: t('tb.tenant.form.description'),
      field: 'additionalInfo.description',
      span: 4,
    },
  ];
  const [register, { setDescProps }] = useDescription({
    schema: descSchema,
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await tenantInfoById(data.id.id);
      setDescProps({ data: record.value });
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
    record.value = {} as TenantInfo;
    setDescProps({ data: {} });
  }

  function handleCopyTenantId() {
    copyToClipboard(record.value.id.id, t('tb.tenant.detail.copyIdSuccess'));
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
<style lang="less"></style>
