<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">资产详情</span>
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

        <a-button type="primary success" @click="handleEditAsset" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'i-clarity:note-edit-line'" />编辑资产
        </a-button>
        <a-button type="primary" danger @click="handleDeleteAsset" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'ant-design:delete-outlined'" />删除资产
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyAssetId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制资产ID
        </a-button>
      </div>
      <Description @register="register" size="default" />
    </div>

    <Telemetry
      v-if="tabActiveKey == DetailTabItemEnum.TELEMETRY.key"
      :entityType="EntityType.ASSET"
      :entityId="record?.id?.id"
    />

    <Alarm
      v-if="tabActiveKey == DetailTabItemEnum.ALARM.key"
      :entityType="EntityType.ASSET"
      :entityId="record?.id?.id"
    />

    <Event
      v-if="tabActiveKey == DetailTabItemEnum.EVENT.key"
      :entityType="EntityType.ASSET"
      :entityId="record?.id?.id"
    />
    <Relation
      v-if="tabActiveKey == DetailTabItemEnum.RELATION.key"
      :entityType="EntityType.ASSET"
      :entityId="record?.id?.id"
    />

    <AuditLog
      v-if="tabActiveKey == DetailTabItemEnum.AUDIT_LOG.key"
      :entityType="EntityType.ASSET"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbAssetDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { AssetInfo, getAssetInfoById } from '/@/api/tb/asset';
  import { Tabs, TabPane } from 'ant-design-vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { useUserStore } from '/@/store/modules/user';
  import { Authority } from '/@/enums/authorityEnum';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import Alarm from '/@/views/tb/alarm/list.vue';
  import Relation from '/@/views/tb/relation/list.vue';
  import Event from '/@/views/tb/event/index.vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';
  const userStore = useUserStore();
  const { hasPermission } = usePermission();

  const emit = defineEmits([
    'edit',
    'delete',
    'assignToPublic',
    'assignToCustomer',
    'unAssignFromCustomer',
    'register',
  ]);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<AssetInfo>({} as AssetInfo);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = hasPermission(Authority.TENANT_ADMIN)
    ? [
        DetailTabItemEnum.DETAIL,
        DetailTabItemEnum.TELEMETRY,
        DetailTabItemEnum.CALCULATED,
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
  const descSchema: DescItem[] = [
    {
      label: t('资产名称'),
      field: 'name',
      span: 2,
    },
    {
      label: t('标签'),
      field: 'label',
      span: 2,
    },
    {
      label: t('资产配置'),
      field: 'assetProfileName',
      span: 2,
    },
    {
      label: t('分配的客户'),
      field: 'customerTitle',
      span: 4,
      show: () => hasPermission(Authority.TENANT_ADMIN),
    },

    {
      label: t('描述信息'),
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
      clear();
      record.value = await getAssetInfoById(data.id.id);
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
    tabActiveKey.value = 'DETAIL';
    record.value = {} as AssetInfo;
    setDescProps({ data: {} });
  }

  function handleCopyAssetId() {
    copyToClipboard(record.value.id.id, '复制资产ID成功！');
  }

  function handleDeleteAsset() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditAsset() {
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
