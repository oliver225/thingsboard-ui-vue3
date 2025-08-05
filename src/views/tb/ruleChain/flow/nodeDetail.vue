<template>
  <BasicDrawer
    v-bind="$attrs"
    :showFooter="false"
    @register="registerDrawer"
    width="60%"
    :rootClassName="'tb-detail-wrapper'"
  >
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 tb-detail-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm"
            >{{ COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.find((item) => item.value == descriptor?.type)?.label }} -
            {{ descriptor.name || '规则节点' }}</span
          >
        </div>
      </div>
    </template>
    <Tabs v-model:activeKey="tabActiveKey" class="tb-detail-menu">
      <TabPane key="DETAIL">
        <template #tab
          ><span> <Icon :icon="'ant-design:appstore-outlined'" /> 详情 </span>
        </template>
        <Descriptions layout="vertical" bordered :column="1">
          <Descriptions.Item label="节点名称">
            {{ record.name }}
            <span :style="{ float: 'right' }">
              <Switch :checked="record.debugMode" size="small" /><span class="ml-2">调试模式</span>
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="描述信息">{{ record.additionalInfo?.description }}</Descriptions.Item>
        </Descriptions>
      </TabPane>
      <TabPane key="EVENT">
        <template #tab
          ><span> <Icon :icon="'ant-design:info-circle-outlined'" /> 事件 </span>
        </template>
        <Event :entityType="EntityType.RULE_NODE" :entityId="record?.id?.id" />
      </TabPane>
      <TabPane key="HELP">
        <template #tab
          ><span> <Icon :icon="'ant-design:info-circle-outlined'" /> 帮助 </span>
        </template>
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
      </TabPane>
    </Tabs>
  </BasicDrawer>
</template>
<script lang="ts" setup name="RuleNodeDetail">
  import { ref, unref, computed } from 'vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { router } from '/@/router';
  import { Icon } from '/@/components/Icon';
  import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
  import { Tabs, TabPane, Typography, Switch, Descriptions } from 'ant-design-vue';
  import { RuleNode } from '/@/api/tb/ruleChain';
  import { ComponentDescriptor } from '/@/api/tb/componentDescriptor';
  import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS } from '/@/enums/componentEnum';
  import Event from '/@/views/tb/event/index.vue';

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

  const tabActiveKey = ref('DETAIL');

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
<style lang="less">
  .detail-info-card {
    .jeesite-basic-table {
      padding: 0;

      .jeesite-basic-table-header__header-top {
        display: none;
      }
    }
  }
</style>
