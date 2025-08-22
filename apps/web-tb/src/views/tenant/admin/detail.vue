<script lang="ts" setup>
import type { DashboardInfo } from '#/api';
import type { UserInfo } from '#/types';

import { h, ref } from 'vue';

import { confirm, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import {
  Button,
  Checkbox,
  Descriptions,
  message,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getActivationLink,
  getDashboardInfoById,
  getUserByIdApi,
  setUserCredentialsEnabled,
} from '#/api';
import { AUTHORITY_OPTIONS } from '#/constants';
import { copyToClipboard } from '#/utils';

defineOptions({
  name: 'TenantAdminDetailDrawer',
});
const emits = defineEmits(['edit', 'delete', 'login']);
const defaultDashboard = ref<DashboardInfo | null>(null);
const homeDashboard = ref<DashboardInfo | null>(null);

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
  class: ['w-1/2'],

  async onOpenChange(isOpen: boolean) {
    drawerApi.setState({ loading: true });
    reset();
    if (isOpen) {
      const { id } = drawerApi.getData<Record<string, any>>();
      if (id) {
        record.value = await getUserByIdApi(id);
      }
      if (record.value?.additionalInfo?.homeDashboardId) {
        homeDashboard.value = await getDashboardInfoById(
          record.value.additionalInfo.homeDashboardId,
        );
      }
      if (record.value?.additionalInfo?.defaultDashboardId) {
        defaultDashboard.value = await getDashboardInfoById(
          record.value.additionalInfo.defaultDashboardId,
        );
      }
    }
    drawerApi.setState({ loading: false });
  },
});

function reset() {
  record.value = null;
  homeDashboard.value = null;
  defaultDashboard.value = null;
  tabActiveKey.value = 'DETAIL';
}

function handleLoginUser() {
  drawerApi.close();
  emits('login', { ...record.value });
}
function handleEdit() {
  drawerApi.close();
  emits('edit', { ...record.value });
}
function handleDelete() {
  drawerApi.close();
  emits('delete', { ...record.value });
}

function handleCopyId() {
  if (record?.value?.id) {
    copyToClipboard(record?.value?.id.id);
  }
}

async function handleDisableAccount() {
  if (record?.value?.id.id) {
    try {
      await setUserCredentialsEnabled(record?.value?.id.id, false);
      message.success({
        content: `${$t('停用用户成功！')}`,
        duration: 2,
        key: 'is-form-submitting',
      });
    } finally {
      record.value = await getUserByIdApi(record?.value?.id.id);
    }
  }
}

async function handleEnableAccount() {
  if (record?.value?.id.id) {
    try {
      await setUserCredentialsEnabled(record?.value?.id.id, true);
      message.success({
        content: `${$t('启用用户成功！')}`,
        duration: 2,
        key: 'is-form-submitting',
      });
    } finally {
      record.value = await getUserByIdApi(record?.value?.id.id);
    }
  }
}
async function handlShowActivationLink() {
  if (record?.value?.id.id) {
    const activationLink = await getActivationLink(record?.value?.id.id);

    confirm({
      content: h(
        'a',
        {
          href: activationLink,
          target: '_blank',
          class: 'text-blue-500',
        },
        `${activationLink}`,
      ),
      icon: 'success',
      title: '用户激活链接',
      cancelText: '确认',
      confirmText: '复制链接',
      beforeClose: ({ isConfirm }) => {
        if (isConfirm) {
          copyToClipboard(activationLink);
        }
        return true;
      },
    });
  }
}
</script>
<template>
  <Drawer header-class="drawer-header">
    <template #extra>
      <VbenIconButton class="mr-2">
        <IconifyIcon class="size-4" icon="mdi:help-circle" />
      </VbenIconButton>
    </template>
    <template #title>
      <div class="flex items-center gap-2">
        <IconifyIcon class="size-8" icon="mdi:account-circle-outline" />
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
        <Button type="primary" @click="handleLoginUser">
          <IconifyIcon class="mb-1 size-4" icon="ant-design:login-outlined" />
          {{ $t('以管理员身份登录') }}
        </Button>
        <Button
          type="primary"
          class="bg-orange-500 hover:!bg-orange-600"
          v-show="record?.additionalInfo?.userActivated === false"
          @click="handlShowActivationLink"
        >
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-key-outline" />
          {{ $t('显示激活连接') }}
        </Button>
        <Button
          type="primary"
          danger
          @click="handleDisableAccount"
          v-show="record?.additionalInfo?.userCredentialsEnabled === true"
        >
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-off-outline" />
          {{ $t('禁用用户账户') }}
        </Button>
        <Button
          type="primary"
          class="bg-green-500 hover:!bg-green-600"
          @click="handleEnableAccount"
          v-show="
            record?.additionalInfo?.userActivated !== false &&
            record?.additionalInfo?.userCredentialsEnabled === false
          "
        >
          <IconifyIcon class="mb-1 size-4" icon="mdi:account-check-outline" />
          {{ $t('启用用户账户') }}
        </Button>
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
        <Descriptions.Item :label="$t('默认面板')">
          {{ defaultDashboard?.title }}
        </Descriptions.Item>
        <Descriptions.Item>
          <Checkbox
            :checked="
              record?.additionalInfo?.defaultDashboardFullscreen ?? false
            "
          >
            始终全屏
          </Checkbox>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('首页仪表板')">
          {{ homeDashboard?.title }}
        </Descriptions.Item>
        <Descriptions.Item>
          <Checkbox
            :checked="record?.additionalInfo?.homeDashboardHideToolbar ?? true"
          >
            隐藏首页仪表板工具栏
          </Checkbox>
        </Descriptions.Item>
        <Descriptions.Item :label="$t('tenant.form.description')" :span="2">
          {{ record?.additionalInfo?.description }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Drawer>
</template>
