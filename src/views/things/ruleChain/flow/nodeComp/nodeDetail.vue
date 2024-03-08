<template>
  <BasicDrawer v-bind="$attrs" :showFooter="false" @register="registerDrawer" width="60%">
    <template #title>
      <div class="flex flex-row items-center">
        <Icon :icon="getTitle.icon" class="pr-3 m-1 drawer-title-icon" />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ getTitle.value || '· · · ·' }}</span>
          <span class="text-sm">{{ COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.find(item => item.value ==
            descriptor?.type)?.label }}
            - {{ descriptor.name || '规则节点' }}</span>
        </div>
      </div>
      <Tabs v-model:activeKey="tabActiveKey" class="drawer-title-tabs">
        <TabPane key="DETAIL">
          <template #tab><span>
              <Icon :icon="'ant-design:appstore-outlined'" /> 详情
            </span> </template>
        </TabPane>
        <TabPane key="EVENT">
          <template #tab><span>
              <Icon :icon="'ant-design:info-circle-outlined'" /> 事件
            </span> </template>
        </TabPane>
        <TabPane key="HELP">
          <template #tab><span>
              <Icon :icon="'ant-design:info-circle-outlined'" /> 帮助
            </span> </template>
        </TabPane>
      </Tabs>
    </template>
    <div class="-translate-x-6 pointer-events-none" v-show="tabActiveKey == 'DETAIL'">
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="20">
          <Form.Item label="节点名称" name="name">
            <Input :value="record.name" placeholder="请输入节点名称" />
          </Form.Item>
          </Col>
          <Col :span="4">
          <Form.Item label="&nbsp;" name="debugMode">
            <Switch :checked="record.debugMode" size="small" /><span class="ml-2">调试模式</span>
          </Form.Item>
          </Col>
        </Row>
        <Form.Item label="描述信息" :name="['additionalInfo', 'description']">
          <Textarea :value="record.additionalInfo?.description" placeholder="输入节点描述信息" :rows="3" />
        </Form.Item>
      </Form>

    </div>
    <div class="-translate-x-6" v-show="tabActiveKey == 'HELP'">
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
import { copyToClipboard } from '/@/utils';
import { Icon } from '/@/components/Icon';
import { BasicDrawer, useDrawerInner } from '/@/components/Drawer';
import { Tabs, TabPane, Space, Typography, Form, Input, Row, Col, Switch, Textarea } from 'ant-design-vue';
import { RuleNode } from '/@/api/things/ruleChain';
import { ComponentDescriptor } from '/@/api/things/componentDescriptor';
import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS } from '/@/enums/componentEnum';


const emit = defineEmits(['edit', 'register',]);

const { t } = useI18n('things');
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
      showMessage(error.message, 'error')
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
