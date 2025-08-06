<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex items-center space-x-4">
        <Icon :icon="getTitle.icon" :size="24" />
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">
            {{ COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.find((item) => item.value == descriptor?.type)?.label }} -
            {{ descriptor.name || '规则节点' }}</span
          >
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
      <Descriptions layout="vertical" bordered :column="1">
        <Descriptions.Item label="节点名称">
          {{ record.name }}
          <span :style="{ float: 'right' }">
            <Switch :checked="record.debugMode" size="small" /><span class="ml-2">调试模式</span>
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="描述信息">{{ record.additionalInfo?.description }}</Descriptions.Item>
      </Descriptions>
    </div>
    <Event
      v-if="tabActiveKey == DetailTabItemEnum.EVENT.key"
      :entityType="EntityType.RULE_NODE"
      :entityId="record?.id?.id"
    />
    <div v-show="tabActiveKey == 'HELP'">
      <Typography>
        <Typography.Title :level="3">
          {{ descriptor.name }}
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          {{ descriptor.configurationDescriptor?.nodeDefinition?.description }}
        </Typography.Paragraph>
        <Typography.Paragraph>
          {{ descriptor.configurationDescriptor?.nodeDefinition?.details }}
        </Typography.Paragraph>
      </Typography>
    </div>
  </BasicDrawer>
</template>
<script lang="ts" setup name="RuleNodeDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { EntityType } from '/@/enums/entityTypeEnum';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Tabs, TabPane, Typography, Switch, Descriptions } from 'ant-design-vue';
  import { RuleNode } from '/@/api/tb/ruleChain';
  import { ComponentDescriptor } from '/@/api/tb/componentDescriptor';
  import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS } from '/@/enums/componentEnum';
  import Event from '/@/views/tb/event/index.vue';
  import { DetailTabItemEnum } from '/@/enums/detailTabEnum';

  const emit = defineEmits(['edit', 'register']);

  const { t } = useI18n('tb');
  const { showMessage } = useMessage();
  const { meta } = unref(router.currentRoute);
  const record = ref<RuleNode>({} as RuleNode);
  const descriptor = ref<ComponentDescriptor>({} as ComponentDescriptor);

  const getTitle = computed(() => ({
    icon: meta.icon || 'ant-design:book-outlined',
    value: record.value.name,
  }));

  const tabActiveKey = ref<string>(DetailTabItemEnum.DETAIL.key);

  const tabList = [
    DetailTabItemEnum.DETAIL,
    DetailTabItemEnum.EVENT,
    {
      key: 'HELP',
      label: '帮助',
      icon: 'ant-design:question-circle-outlined',
    },
  ];
  const [registerDrawer, { setDrawerProps, closeDrawer }] = useDrawerInner(async (data) => {
    try {
      setDrawerProps({ loading: true });
      descriptor.value = data.descriptor;
      record.value = data.data;
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
    record.value = {} as RuleNode;
  }
</script>
