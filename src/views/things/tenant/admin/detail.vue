<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">租户管理员详情</span>
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
        <TabPane key="RELATION">
          <template #tab><span>
              <Icon :icon="'ant-design:radar-chart-outlined'" /> 关联
            </span> </template>
        </TabPane>
      
      </Tabs>
    </template>
    <div class="detail-info-card">
      <Relation :entityType="EntityType.USER" :entityId="record?.id?.id" v-if="tabActiveKey == 'RELATION'" />
    </div>
    <div class="telemetry-card">
      <Telemetry :entityType="EntityType.USER" :entityId="record?.id?.id" v-if="tabActiveKey == 'TELEMETRY'" />
    </div>
    <div class="-translate-x-6" v-show="tabActiveKey == 'DETAIL'">
      <Space size="middle" class="mb-3">
        <a-button type="primary" @click="handleAdminLogin">
          <Icon :icon="'ant-design:login-outlined'" />以管理员身份登录
        </a-button>
        <a-button type="primary" @click="handleShowActivationLink">
          <Icon :icon="'ant-design:login-outlined'" />显示激活链接
        </a-button>
        <a-button type="primary" @click="handleSendActivationEmail">
          <Icon :icon="'ant-design:login-outlined'" />重新发送激活邮件
        </a-button>
        <a-button type="primary success" @click="handleEditUser">
          <Icon :icon="'clarity:note-edit-line'" />编辑管理员
        </a-button>
        <a-button type="primary" danger @click="handleDeleteUser">
          <Icon :icon="'ant-design:delete-outlined'" />删除管理员
        </a-button>
      </Space>
      <br />
      <Space size="middle" class="mb-3">
        <a-button @click="handleCopyUserId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制用户ID
        </a-button>
      </Space>
      <Description @register="register" size="default">
        <template #defaultDashboardFullscreen="{ val }">
          <Checkbox :checked="val">默认全屏</Checkbox>
        </template>
        <template #homeDashboardHideToolbar="{ val }">
          <Checkbox :checked="val">隐藏工具栏</Checkbox>
        </template>
      </Description>

    </div>

  </BasicDrawer>
</template>
<script lang="ts" setup name="TenantAdminDetail">
import { ref, unref, computed, h } from 'vue';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { getDashboardInfoById } from '/@/api/things/dashboard';
import { getUserById, getActivationLink, sendActivationEmail } from '/@/api/things/user';
import { Tabs, TabPane, Space, Checkbox } from 'ant-design-vue';
import { DescItem, Description, useDescription } from '/@/components/Description';
import { UserInfo } from '/#/store';
import { isEmpty } from 'lodash';
import Telemetry from '/@/views/things/telemetry/index.vue';
import Relation from '/@/views/things/relation/list.vue';
import { EntityType } from '/@/enums/entityTypeEnum';


const emit = defineEmits(['edit', 'delete', 'login', 'register',]);

const { t } = useI18n('things');
const { createConfirm, showMessage } = useMessage();
const { meta } = unref(router.currentRoute);
const record = ref<UserInfo>({} as UserInfo);

const getTitle = computed(() => ({
  icon: meta.icon || 'ant-design:book-outlined',
  value: record.value.name,
}));

const tabActiveKey = ref('DETAIL');



const descSchema: DescItem[] = [
  {
    label: t('电子邮件'),
    field: 'email',
    span: 4,
  },
  {
    label: t('姓名'),
    field: 'firstName',
    span: 4,
  },
  {
    label: t('手机号码'),
    field: 'phone',
    span: 2,
  },
  {
    label: t('职务'),
    field: 'lastName',
    span: 2,
  },

  {
    label: t('描述信息'),
    field: 'additionalInfo.description',
    span: 4,
  },
  {
    label: t('默认仪表盘'),
    field: 'additionalInfo.defaultDashboardTitle',
    span: 2,
  },
  {
    label: '',
    field: 'additionalInfo.defaultDashboardFullscreen',
    slot: 'defaultDashboardFullscreen',
    span: 2,
  },
  {
    label: t('首页仪表盘'),
    field: 'additionalInfo.homeDashboardTitle',
    span: 2,
  },
  {
    label: '',
    field: 'additionalInfo.homeDashboardHideToolbar',
    slot: 'homeDashboardHideToolbar',
    span: 2,
  },
];
const [register, { setDescProps }] = useDescription({
  schema: descSchema,
})



const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
  try {
    setDrawerProps({ loading: true });
    await clear();
    record.value = await getUserById(data.id.id);
    if (!isEmpty(record.value.additionalInfo.defaultDashboardId)) {
      const defaultDashboard = await getDashboardInfoById(record.value.additionalInfo.defaultDashboardId);
      record.value.additionalInfo.defaultDashboardTitle = defaultDashboard.title || ''
    }
    if (!isEmpty(record.value.additionalInfo.homeDashboardId)) {
      const homeDashboard = await getDashboardInfoById(record.value.additionalInfo.homeDashboardId);
      record.value.additionalInfo.homeDashboardTitle = homeDashboard.title || ''
    }
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
  record.value = {} as UserInfo;
  setDescProps({ data: {} });
}


function handleCopyUserId() {
  copyToClipboard(record.value.id.id, '复制用户ID成功！')
}

function handleDeleteUser() {
  emit('delete', record.value);
  closeDrawer();
}

function handleEditUser() {
  emit('edit', record.value);
  closeDrawer();
}

async function handleShowActivationLink() {
  try {
    const activationLink = await getActivationLink(record.value.id.id);
    createConfirm(
      {
        iconType: 'success',
        icon: () => h(Icon, { icon: 'ant-design:info-circle-filled', style: { color: 'blue' } },),
        title: '用户激活链接',
        content: h('a', { href: activationLink, target: '_blank' }, `${activationLink}`),
        width: '50%',
        okText: '确认',
        cancelText: '复制',
        maskClosable: false,
        onCancel: () => copyToClipboard(activationLink, '复制用户激活链接成功！')
      });
  } catch (error) {
    console.log(error);
  }

}

async function handleSendActivationEmail() {
  try {
    await sendActivationEmail(record.value.email)
    showMessage('激活电子邮件已成功发送！', 'success');
  } catch (error) {
    console.log(error);
  }
}

function handleAdminLogin() {
  emit('login', record.value);
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
