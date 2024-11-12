<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('切换') }}{{ cardList ? '表格' : '卡片' }}</span>
    </template>
    <Dropdown placement="bottom" :trigger="['click']" :getPopupContainer="getPopupContainer">
      <UnorderedListOutlined v-if="cardList" />
      <AppstoreOutlined v-else />
      <template #overlay>
        <Menu @click="handleTitleClick" selectable v-model:selectedKeys="selectedKeysRef">
          <!-- <MenuItem key="default">
            <span>{{ t('component.table.settingDensDefault') }}</span>
          </MenuItem> -->
          <MenuItem key="table">
            <span>表格</span>
          </MenuItem>
          <MenuItem key="card">
            <span>卡片</span>
          </MenuItem>
        </Menu>
      </template>
    </Dropdown>
  </Tooltip>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons-vue';
  import { useTableContext } from '../../hooks/useTableContext';
  import { Tooltip, Dropdown, Menu } from 'ant-design-vue';
  import { getPopupContainer } from '/@/utils';
  export default defineComponent({
    name: 'CardSetting',
    components: {
      UnorderedListOutlined,
      AppstoreOutlined,
      Dropdown,
      Menu,
      MenuItem: Menu.Item,
      Tooltip,
    },
    setup() {
      const table = useTableContext();
      const { t } = useI18n();

      const cardList = ref(false);

      const selectedKeysRef = ref<[string]>(['table']);

      function handleTitleClick({ key }: { key: string } | any) {
        selectedKeysRef.value = [key];
        cardList.value = key == 'card';
        table.setProps({
          cardList: key == 'card',
        });
      }

      return {
        selectedKeysRef,
        handleTitleClick,
        getPopupContainer,
        cardList,
        t,
      };
    },
  });
</script>
