<script lang="ts" setup>
import type { TenantApi } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { copyToClipboard } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { areaList } from '@vant/area-data';
import { Button, Descriptions, message, TabPane, Tabs } from 'ant-design-vue';

import { getTenantInfoByIdApi } from '#/api';

defineOptions({
  name: 'TenantDetailDrawer',
});
const emits = defineEmits(['edit', 'delete', 'admin']);

const record = ref<null | TenantApi.TenantInfo>(null);
const tabActiveKey = ref('DETAIL');
const tabList = [
  {
    key: 'DETAIL',
    label: $t('page.tabs.detail'),
    icon: 'ant-design:appstore-outlined',
  },
  {
    key: 'TELEMETRY',
    label: $t('page.tabs.telemetry'),
    icon: 'ant-design:line-chart-outlined',
  },
  {
    key: 'ALARM',
    label: $t('page.tabs.alarm'),
    icon: 'ant-design:alert-outlined',
  },
  {
    key: 'EVENT',
    label: $t('page.tabs.event'),
    icon: 'ant-design:info-circle-outlined',
  },
  {
    key: 'RELATION',
    label: $t('page.tabs.relation'),
    icon: 'ant-design:radar-chart-outlined',
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('tenant.detail')}`,
  overlayBlur: 0,
  footer: false,
  width: '50%',

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { data, id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getTenantInfoByIdApi(id);
      } else if (data) {
        record.value = data;
      }
    }
    drawerApi.setState({ loading: false });
  },
});

function reset() {
  record.value = null;
  tabActiveKey.value = 'DETAIL';
}

function handleEdit() {
  drawerApi.close();
  emits('edit', { row: record.value });
}
function handleDelete() {
  drawerApi.close();
  emits('delete', { row: record.value });
}

function handleAdmin() {
  drawerApi.close();
  emits('admin', { row: record.value });
}

function handleCopyId() {
  if (record?.value?.id) {
    copyToClipboard(record?.value?.id.id);
    message.success({
      content: `${$t('复制成功！')}`,
      duration: 2,
      key: 'is-form-submitting',
    });
  }
}
</script>
<template>
  <Drawer>
    <template #extra>
      <VbenIconButton class="mr-2">
        <IconifyIcon class="size-4" icon="mdi:help-circle" />
      </VbenIconButton>
    </template>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon class="size-10" icon="mdi:account-supervisor" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.title }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('tenant.detail') }}
          </p>
        </div>
      </div>
    </template>
    <template #prepend-content>
      <Tabs v-model:active-key="tabActiveKey" class="detail-tabs">
        <TabPane v-for="tab in tabList" :key="tab.key">
          <template #tab>
            <IconifyIcon :icon="tab.icon" />
            {{ tab.label }}
          </template>
        </TabPane>
      </Tabs>
    </template>

    <div v-if="tabActiveKey === 'DETAIL'">
      <div class="mb-2 flex space-x-4">
        <Button type="primary" @click="handleAdmin">
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-circle-outline" />
          {{ $t('tenant.button.tenantAdmin') }}
        </Button>
        <Button type="primary" @click="handleEdit">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
          {{ $t('tenant.button.editTenant') }}
        </Button>
        <Button type="primary" danger @click="handleDelete">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
          {{ $t('tenant.button.removeTenant') }}
        </Button>
      </div>
      <div class="mb-2 flex space-x-4">
        <Button @click="handleCopyId">
          <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
          {{ $t('tenant.button.copyTenantId') }}
        </Button>
      </div>
      <Descriptions bordered :column="2" size="middle">
        <Descriptions.Item :label="$t('tenant.form.title')" :span="2">
          {{ record?.title }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.tenantProfileName')">
          {{ record?.tenantProfileName }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.zip')">
          {{ record?.zip }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.phone')">
          {{ record?.phone }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.email')">
          {{ record?.email }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.area')" :span="2">
          <span v-if="record?.state">
            {{ areaList.province_list[record.state] }}
          </span>
          /
          <span v-if="record?.city">
            {{ areaList.city_list[record.city] }}
          </span>
          /
          <span v-if="record?.country">
            {{ areaList.county_list[record.country] }}
          </span>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.address')" :span="2">
          {{ record?.address }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.address2')" :span="2">
          {{ record?.address2 }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.description')" :span="2">
          {{ record?.additionalInfo?.description }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Drawer>
</template>
