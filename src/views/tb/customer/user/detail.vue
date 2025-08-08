<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">客户用户详情</span>
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
        <a-button type="primary" @click="handleAdminLogin">
          <Icon :icon="'ant-design:login-outlined'" />以用户身份登录
        </a-button>
        <a-button
          v-show="record.additionalInfo?.userActivated == false"
          type="primary"
          @click="handleShowActivationLink"
        >
          <Icon :icon="'mdi:account-key-outline'" />显示激活链接
        </a-button>
        <a-button
          v-show="record.additionalInfo?.userActivated == false"
          type="primary"
          @click="handleSendActivationEmail"
        >
          <Icon :icon="'mdi:account-file-text'" />重新发送激活邮件
        </a-button>
        <a-button type="primary success" @click="handleEditUser">
          <Icon :icon="'i-clarity:note-edit-line'" />编辑用户
        </a-button>
        <a-button
          type="primary"
          danger
          v-show="record?.additionalInfo?.userCredentialsEnabled === true"
          @click="handleDisableAccount"
        >
          <Icon :icon="'mdi:account-off-outline'" />
          停用账户
        </a-button>
        <a-button
          type="primary"
          class="bg-green-500 hover:!bg-green-600"
          v-show="
            record?.additionalInfo?.userActivated !== false && record?.additionalInfo?.userCredentialsEnabled === false
          "
          @click="handleEnableAccount"
        >
          <Icon :icon="'mdi:account-check-outline'" />启用账户
        </a-button>
        <a-button type="primary" danger @click="handleDeleteUser">
          <Icon :icon="'ant-design:delete-outlined'" />删除用户
        </a-button>
      </div>
      <div class="space-x-4 my-4">
        <a-button @click="handleCopyUserId">
          <Icon :icon="'ant-design:copy-filled'" />
          复制用户ID
        </a-button>
      </div>
      <Description @register="register" size="default">
        <template #defaultDashboardFullscreen="{ val }">
          <Checkbox :checked="val">默认全屏</Checkbox>
        </template>
        <template #homeDashboardHideToolbar="{ val }">
          <Checkbox :checked="val">隐藏工具栏</Checkbox>
        </template>
      </Description>
    </div>

    <Telemetry
      v-if="tabActiveKey == DetailTabItemEnum.TELEMETRY.key"
      :entityType="EntityType.USER"
      :entityId="record?.id?.id"
    />

    <Relation
      v-if="tabActiveKey == DetailTabItemEnum.RELATION.key"
      :entityType="EntityType.USER"
      :entityId="record?.id?.id"
    />

    <AuditLog
      v-if="tabActiveKey == DetailTabItemEnum.AUDIT_LOG.key"
      :entityType="EntityType.USER"
      :entityId="record?.id?.id"
    />
  </BasicDrawer>
</template>
<script lang="ts" setup name="CustomerUserDetail">
  import { ref, unref, computed, h } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { copyToClipboard } from '/@/utils';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { getUserById, sendActivationEmail, setUserCredentialsEnabled, getProxyActivationLink } from '/@/api/tb/user';
  import { Tabs, TabPane, Checkbox } from 'ant-design-vue';
  import { DescItem, Description, useDescription } from '/@/components/Description';
  import Telemetry from '/@/views/tb/telemetry/index.vue';
  import Relation from '/@/views/tb/relation/list.vue';
  import AuditLog from '/@/views/tb/auditLog/list.vue';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { UserInfo } from '/#/store';
  import { isEmpty } from 'lodash-es';
  import { getDashboardInfoById } from '/@/api/tb/dashboard';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';

  const emit = defineEmits(['edit', 'delete', 'login', 'register']);

  const { t } = useI18n('tb');
  const { createConfirm, showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<UserInfo>({} as UserInfo);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));
  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = [
    DetailTabItemEnum.DETAIL,
    DetailTabItemEnum.TELEMETRY,
    DetailTabItemEnum.RELATION,
    DetailTabItemEnum.AUDIT_LOG,
  ];

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
  });

  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      await clear();
      record.value = await getUserById(data.id.id);
      if (!isEmpty(record.value.additionalInfo.defaultDashboardId)) {
        const defaultDashboard = await getDashboardInfoById(record.value.additionalInfo.defaultDashboardId);
        record.value.additionalInfo.defaultDashboardTitle = defaultDashboard.title || '';
      }
      if (!isEmpty(record.value.additionalInfo.homeDashboardId)) {
        const homeDashboard = await getDashboardInfoById(record.value.additionalInfo.homeDashboardId);
        record.value.additionalInfo.homeDashboardTitle = homeDashboard.title || '';
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
    record.value = {} as UserInfo;
    setDescProps({ data: {} });
  }

  function handleCopyUserId() {
    copyToClipboard(record.value.id.id, '复制用户ID成功！');
  }

  function handleDeleteUser() {
    emit('delete', record.value);
    closeDrawer();
  }

  function handleEditUser() {
    emit('edit', record.value);
    closeDrawer();
  }

  async function handleDisableAccount() {
    const modalFunc = createConfirm({
      iconType: 'error',
      title: `确定停用用户[${record.value.firstName || record.value.email}]吗？`,
      content: '停用后，用户账户将不可用。',
      centered: false,
      okText: '停用',
      okButtonProps: {
        type: 'primary',
        danger: true,
      },
      onCancel: () => modalFunc.destroy(),
      onOk: async () => {
        try {
          await setUserCredentialsEnabled(record?.value?.id.id, false);
          showMessage('停用用户账户成功！');
        } catch (error: any) {
          console.log(error);
        } finally {
          record.value = await getUserById(record?.value?.id.id);
        }
      },
    });
  }

  async function handleEnableAccount() {
    if (record?.value?.id.id) {
      try {
        await setUserCredentialsEnabled(record?.value?.id.id, true);
        showMessage('启用用户账户成功！');
      } finally {
        record.value = await getUserById(record?.value?.id.id);
      }
    }
  }

  async function handleShowActivationLink() {
    try {
      const activationLink = await getProxyActivationLink(record.value.id.id);

      createConfirm({
        iconType: 'success',
        icon: () => h(Icon, { icon: 'ant-design:info-circle-filled', style: { color: 'blue' } }),
        title: '用户激活链接',
        content: h('a', { href: activationLink, target: '_blank' }, `${activationLink}`),
        width: '50%',
        okText: '确认',
        cancelText: '复制',
        maskClosable: false,
        onCancel: () => copyToClipboard(activationLink, '复制用户激活链接成功！'),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSendActivationEmail() {
    try {
      await sendActivationEmail(record.value.email);
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
<style lang="less"></style>
