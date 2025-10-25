<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ t('tb.dashboard.detail.title') }}</span>
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
          v-if="hasPermission(Authority.TENANT_ADMIN) && !isPublic"
        >
          <Icon :icon="'ant-design:share-alt-outlined'" />{{ t('tb.dashboard.action.setPublic') }}
        </a-button>
        <a-button
          type="primary"
          @click="handleUnAssignToPublic"
          v-if="hasPermission(Authority.TENANT_ADMIN) && !!isPublic"
        >
          <Icon :icon="'ant-design:rollback-outlined'" />{{ t('tb.dashboard.action.setSelf') }}
        </a-button>
        <a-button type="primary" @click="handleAssignCustomer" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'ant-design:contacts-outlined'" />{{ t('tb.dashboard.action.assignCustomer') }}
        </a-button>

        <a-button type="primary success" @click="handleEditAsset" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'i-clarity:note-edit-line'" />{{ t('tb.dashboard.action.edit') }}
        </a-button>
        <a-button type="primary" danger @click="handleDeleteAsset" v-if="hasPermission(Authority.TENANT_ADMIN)">
          <Icon :icon="'ant-design:delete-outlined'" />{{ t('tb.dashboard.action.delete') }}
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyAssetId">
          <Icon :icon="'ant-design:copy-filled'" />
          {{ t('tb.dashboard.action.copyId') }}
        </a-button>
      </div>
      <Description @register="register" size="default">
        <template #assignedCustomers="{ val }">
          <template v-if="Array.isArray(val)">
            <template v-if="val.some((c) => !c.public)">
              <Tag v-for="c in val.filter((c) => !c.public)" :key="c.customerId?.id || c.title">
                {{ c.title }}
              </Tag>
            </template>
            <span v-else>-</span>
          </template>
          <span v-else>-</span>
        </template>
        <template #customerIsPublic="{ val }">
          <div>
            <span>
              {{ publicLink }}
            </span>
          </div>
        </template>
        <template #imagePreview="{ val }">
          <div v-if="val" class="w-full h-48">
            <img :src="val" :alt="record.name" class="img-content-clip" />
          </div>
        </template>
      </Description>
    </div>
    <AuditLog
      v-if="tabActiveKey == DetailTabItemEnum.AUDIT_LOG.key"
      :entityType="EntityType.DASHBOARD"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="ViewsTbDashboardDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Tabs, TabPane, Tag } from 'ant-design-vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import { Authority } from '/@/enums/authorityEnum';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import { usePermission } from '/@/hooks/web/usePermission';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';
  import { Dashboard, getDashboardById } from '/@/api/tb/dashboard';
  import { imagePreview } from '/@/api/tb/images';
  import { useGlobSetting } from '/@/hooks/setting';
  const { hasPermission } = usePermission();

  const emit = defineEmits(['edit', 'delete', 'assignToPublic', 'assignToCustomer', 'unAssignToPublic', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<Dashboard>({} as Dashboard);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = hasPermission(Authority.TENANT_ADMIN)
    ? [DetailTabItemEnum.DETAIL, DetailTabItemEnum.AUDIT_LOG]
    : [DetailTabItemEnum.DETAIL];

  const isPublic = computed(() => {
    return Array.isArray(record.value.assignedCustomers) && record.value.assignedCustomers.some((c) => c.public);
  });

  const publicLink = computed(() => {
    if (isPublic.value) {
      const { tbBaseUrl } = useGlobSetting();
      const proxyLink = `${tbBaseUrl}/dashboard/${record.value.id.id}?publicId=${record.value.assignedCustomers?.find((c) => c.public)?.customerId?.id}`;
      return proxyLink;
    }
    return '';
  });

  async function fetchPreviewImage(record: Recordable) {
    return new Promise((resolve) => {
      const link = record.image.replace('tb-image;', '');
      imagePreview(link).then((file) => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          resolve(e.target?.result);
        };
        fileReader.readAsDataURL(file);
      });
    });
  }

  const descSchema: DescItem[] = [
    {
      label: t('tb.dashboard.detail.name'),
      field: 'title',
      span: 4,
    },
    {
      label: t('tb.dashboard.detail.assignedCustomers'),
      field: 'assignedCustomers',
      span: 4,
      slot: 'assignedCustomers',
      show: () => hasPermission(Authority.TENANT_ADMIN),
    },
    {
      label: t('tb.dashboard.detail.public'),
      field: 'assignedCustomers',
      span: 4,
      slot: 'customerIsPublic',
      show: () => hasPermission(Authority.TENANT_ADMIN) && isPublic.value,
    },
    {
      label: t('tb.dashboard.detail.description'),
      field: 'configuration.description',
      span: 4,
    },
    {
      label: t('tb.dashboard.detail.image'),
      field: 'imagePreview',
      slot: 'imagePreview',
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
      record.value = await getDashboardById(data.id.id);
      if (record.value.image) {
        record.value.imagePreview = await fetchPreviewImage(record.value);
      }
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
    record.value = {} as Dashboard;
    setDescProps({ data: {} });
  }

  function handleCopyAssetId() {
    copyToClipboard(record.value.id.id, t('tb.asset.action.copyIdSuccess'));
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

  function handleUnAssignToPublic() {
    emit('unAssignToPublic', record.value);
    closeDrawer();
  }
</script>

<style lang="less"></style>
