<script lang="ts" setup>
import type { UserInfo } from '@vben/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { AUTHORITY_OPTIONS } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { copyToClipboard } from '@vben/utils';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import {
  Button,
  Descriptions,
  message,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { getUserByIdApi } from '#/api';

defineOptions({
  name: 'TenantAdminDetailDrawer',
});
const emits = defineEmits(['edit', 'delete', 'admin']);

const record = ref<null | UserInfo>(null);
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
    key: 'RELATION',
    label: $t('page.tabs.relation'),
    icon: 'ant-design:radar-chart-outlined',
  },
];

const [Drawer, drawerApi] = useVbenDrawer({
  title: `${$t('用户详情')}`,
  overlayBlur: 0,
  footer: false,
  width: '50%',

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();

    if (isOpen) {
      const { id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getUserByIdApi(id);
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
        <IconifyIcon class="size-10" icon="mdi:account-circle-outline" />
        <div>
          <p class="text-foreground text-lg font-semibold">
            {{ record?.email }}
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('用户详情') }}
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
        <!-- <Button type="primary" @click="handleAdmin">
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-circle-outline" />
          {{ $t('tenant.button.tenantAdmin') }}
        </Button> -->
        <Button type="primary" @click="handleEdit">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:edit-outlined" />
          {{ $t('编辑用户') }}
        </Button>
        <Button type="primary" danger @click="handleDelete">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:delete-outlined" />
          {{ $t('删除用户') }}
        </Button>
      </div>
      <div class="mb-2 flex space-x-4">
        <Button @click="handleCopyId">
          <IconifyIcon class="mb-1 size-4" icon="mdi:content-copy" />
          {{ $t('复制用户ID') }}
        </Button>
      </div>
      <Descriptions bordered :column="2" size="middle">
        <Descriptions.Item :label="$t('tenant.form.email')">
          {{ record?.email }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('用户角色')">
          <Tag color="success">
            {{
              AUTHORITY_OPTIONS.find((item) => item.value === record?.authority)
                ?.label || ''
            }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('用户名称')">
          {{ record?.firstName }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('用户昵称')">
          {{ record?.lastName }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.phone')" :span="2">
          {{ record?.phone }}
        </Descriptions.Item>

        <Descriptions.Item :label="$t('账户状态')" :span="2">
          <Tag
            color="error"
            v-if="record?.additionalInfo?.userActivated === false"
          >
            未激活
          </Tag>
          <Tag
            color="processing"
            v-if="record?.additionalInfo?.userActivated === true"
          >
            已激活
          </Tag>
          <Tag
            color="error"
            v-if="record?.additionalInfo?.userCredentialsEnabled === false"
          >
            账户已禁用
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.description')" :span="2">
          {{ record?.additionalInfo?.description }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Drawer>
</template>
