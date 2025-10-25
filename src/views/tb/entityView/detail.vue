<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ t('tb.entityView.detail.detail') }}</span>
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
          <Icon :icon="'ant-design:share-alt-outlined'" />{{ t('tb.entityView.detail.setPublic') }}
        </a-button>
        <a-button
          type="primary"
          @click="handleAssignCustomer"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!!record.customerTitle"
        >
          <Icon :icon="'ant-design:contacts-outlined'" />{{ t('tb.entityView.detail.assignCustomer') }}
        </a-button>
        <a-button
          type="primary"
          @click="handleUnAssignFromCustomer"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!record.customerTitle"
        >
          <Icon :icon="'ant-design:rollback-outlined'" />{{ t('tb.entityView.detail.unassignCustomer') }}
        </a-button>

        <a-button type="primary success" @click="handleEditEntityView" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.entityView.detail.editEntityView') }}
        </a-button>
        <a-button type="primary" danger @click="handleDeleteEntityView" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.entityView.detail.deleteEntityView') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyEntityViewId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.entityView.detail.copyEntityViewId') }}
        </a-button>
      </div>
      <Form layout="vertical" :disabled="true">
        <Form.Item :label="t('tb.entityView.form.name')" name="name">
          <Input :value="record.name" />
        </Form.Item>
        <Form.Item :label="t('tb.entityView.form.type')" name="type">
          <Input :value="record.type" />
        </Form.Item>
        <Row :gutter="16">
          <Col :span="6">
            <Form.Item :label="t('tb.entityView.form.entityType')" :name="['entityId', 'entityType']">
              <Select :value="record.entityId?.entityType" :placeholder="t('tb.entityView.form.entityTypePlaceholder')">
                <Select.Option :value="EntityType.DEVICE">{{ t('tb.device.title') }}</Select.Option>
                <Select.Option :value="EntityType.ASSET">{{ t('tb.asset.title') }}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col :span="18">
            <Form.Item
              :label="t('tb.entityView.form.targetDevice')"
              :name="['entityId', 'id']"
              v-if="EntityType.DEVICE == record.entityId?.entityType"
            >
              <Select
                :value="record.entityId.id"
                :placeholder="t('tb.entityView.form.targetDevicePlaceholder')"
                :options="entityIdOptions"
              />
            </Form.Item>
            <Form.Item
              :label="t('tb.entityView.form.targetAsset')"
              :name="['entityId', 'id']"
              :rules="[{ required: true, message: t('tb.entityView.form.assetRequired') }]"
              v-if="EntityType.ASSET == record.entityId?.entityType"
            >
              <Select
                :value="record.entityId.id"
                :placeholder="t('tb.entityView.form.targetAssetPlaceholder')"
                :options="entityIdOptions"
              />
            </Form.Item>
          </Col>
        </Row>
        <CollapseContainer
          :title="t('tb.entityView.form.attributesPropagation')"
          class="border border-solid border-neutral-300 mb-4"
        >
          <div class="p-4">
            <p class="text-help">{{ t('tb.entityView.form.help.attr1') }}</p>
            <p class="text-help">{{ t('tb.entityView.form.help.attr2') }}</p>
            <p class="text-help" v-html="t('tb.entityView.form.help.attr3')"></p>
          </div>
          <Form.Item :label="t('tb.entityView.form.clientAttributes')" :name="['keys', 'attributes', 'cs']">
            <Select :value="record.keys?.attributes?.cs" mode="tags" />
          </Form.Item>
          <Form.Item :label="t('tb.entityView.form.sharedAttributes')" :name="['keys', 'attributes', 'sh']">
            <Select :value="record.keys?.attributes?.sh" mode="tags" />
          </Form.Item>
          <Form.Item :label="t('tb.entityView.form.serverAttributes')" :name="['keys', 'attributes', 'ss']">
            <Select :value="record.keys?.attributes?.ss" mode="tags" />
          </Form.Item>
        </CollapseContainer>
        <CollapseContainer
          :title="t('tb.entityView.form.timeseriesData')"
          class="border border-solid border-neutral-300 mb-4"
        >
          <div class="p-4">
            <p class="text-help">{{ t('tb.entityView.form.help.ts') }}</p>
          </div>
          <Form.Item :label="t('tb.entityView.form.telemetry')" :name="['keys', 'timeseries']">
            <Select :value="record.keys?.timeseries" mode="tags" />
          </Form.Item>
        </CollapseContainer>
        <Form.Item :label="t('tb.entityView.form.startTime')" :name="['startTimeMs']">
          <span v-if="record.startTimeMs">
            {{ dayjs(record.startTimeMs).format('YYYY-MM-DD HH:mm') }}
          </span>
        </Form.Item>
        <Form.Item :label="t('tb.entityView.form.endTime')" :name="['endTimeMs']">
          <span v-if="record.endTimeMs">
            {{ dayjs(record.endTimeMs).format('YYYY-MM-DD HH:mm') }}
          </span>
        </Form.Item>
        <Form.Item :label="t('tb.entityView.form.description')" :name="['additionalInfo', 'description']">
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
    copyToClipboard(record.value.id.id, t('tb.entityView.action.copyEntityViewIdSuccess'));
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
