<template>
  <PageWrapper class="notification-index">
    <Tabs v-model:activeKey="tabActiveKey">
      <TabPane v-for="pane in tabPanes" :key="pane.key">
        <template #tab
          ><span>
            <component :is="pane.icon" />
            {{ pane.label }}
          </span>
        </template>
        <ScrollContainer>
          <component :is="createAsyncComponent(pane.componentFn)" />
        </ScrollContainer>
      </TabPane>
      <template #rightExtra>
        <a-button v-if="!hasPermission(Authority.CUSTOMER_USER)" type="primary" @click="handleSendRequest()">
          <Icon icon="ant-design:send-outlined" /> 发送通知
        </a-button>
      </template>
    </Tabs>
    <RequestForm @register="registerFormModal" @success="handleSuccess" />
  </PageWrapper>
</template>
<script lang="ts">
  export default defineComponent({
    name: 'ViewsTbNotificationIndex',
  });
</script>
<script lang="ts" setup>
  import { Tabs, TabPane } from 'ant-design-vue';
  import { defineComponent, h, onMounted, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { Icon } from '/@/components/Icon';
  import { Authority } from '/@/enums/authorityEnum';
  import { router } from '/@/router';
  import { PageWrapper } from '/@/components/Page';
  import { ScrollContainer } from '/@/components/Container/index';
  import { createAsyncComponent } from '/@/utils/factory/createAsyncComponent';
  import RequestForm from './request/form.vue';
  import { useModal } from '/@/components/Modal';
  import { usePermission } from '/@/hooks/web/usePermission';

  const { t } = useI18n('tb');
  const { hasPermission } = usePermission();

  const tabPanes = ref<any[]>();
  const tabActiveKey = ref<string>();

  function initNotificationMenu() {
    const routerList = router
      .getRoutes()
      .filter(
        (routerItem) => routerItem.path.startsWith('/notification/') && routerItem.path !== '/notification/index',
      );
    tabPanes.value = routerList.map((routerItem) => {
      return {
        key: routerItem.name,
        icon: () => h(Icon, { icon: routerItem.meta.icon, size: 18 }),
        label: t(routerItem.meta.title),
        title: t(routerItem.meta.title),
        path: routerItem.path,
        componentFn: routerItem.components.default,
      };
    });
    tabActiveKey.value = tabPanes.value[0].key;
  }
  const [registerFormModal, { openModal: openFormModal }] = useModal();

  function handleSendRequest() {
    openFormModal(true, {});
  }

  function handleSuccess() {}

  onMounted(() => {
    initNotificationMenu();
  });
</script>
<style lang="less">
  .notification-index {
    .jeesite-basic-table-header-container {
      // display: none;
      .text-lg {
        display: none;
      }
    }

    .jeesite-basic-table {
      padding: 0;
    }
  }
</style>
