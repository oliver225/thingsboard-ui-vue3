<template>
  <div class="rule-chain-node" :style="{ backgroundColor: backgroundColor }">
    <Popover placement="right" :mouseEnterDelay="0.5" :title="record?.name ? record.name : descriptor?.name"
      overlayClassName="rule-chain-node-popover-card">
      <template #content>
        <div class="popover-card-content">
          <div v-if="record?.name" class="type">
            {{ COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.find(item => item.value == descriptor?.type)?.label }}
            - {{ descriptor?.name }}
          </div>
          <div class="description" v-html="descriptor?.configurationDescriptor?.nodeDefinition?.description"></div>
          <div v-if="!record?.name" class="details" v-html="descriptor?.configurationDescriptor?.nodeDefinition?.details">
          </div>
        </div>
      </template>
      <div class="content">
        <Icon v-if="descriptor?.configurationDescriptor?.nodeDefinition.icon"
          :icon="transportIcon(descriptor.configurationDescriptor.nodeDefinition.icon)" />
        <img v-else-if="descriptor?.configurationDescriptor?.nodeDefinition.iconUrl"
          :src="descriptor.configurationDescriptor.nodeDefinition.iconUrl">
        <Icon v-else :icon="defaultIcon" />
        <div class="title">
          <div class="type">{{ descriptor?.name }}</div>
          <div class="name">{{ record?.name }}</div>
        </div>
      </div>
    </Popover>
  </div>
</template>
<script lang="ts" setup name="ViewsTbRuleChainFlowNode">
import { onMounted, ref, inject, computed } from 'vue';
import { Icon } from '/@/components/Icon';
import { Popover } from 'ant-design-vue';
import { ComponentDescriptor } from '/@/api/tb/componentDescriptor';
import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS, ComponentDescriptorType } from '/@/enums/componentEnum';
import { RuleNode } from '/@/api/tb/ruleChain';

const descriptor = ref<ComponentDescriptor>();
const record = ref<RuleNode>();

const getNode = inject('getNode', () => { })

const backgroundColor = computed(() => COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.find(item => item.value == descriptor.value?.type)?.color || '#00b96b ')

onMounted(() => {
  const node = getNode() as any;
  setValue(node.data);
  node.on('change:data', ({ current }) => setValue(current));
})

function setValue(data: any) {
  descriptor.value = data.descriptor;
  record.value = data.data;
}

const defaultIcon = computed(() => {
  if (ComponentDescriptorType.FILTER == descriptor.value?.type) {
    return 'ant-design:filter-outlined'
  } else if (ComponentDescriptorType.ACTION == descriptor.value?.type) {
    return 'ant-design:thunderbolt-filled'
  } else if (ComponentDescriptorType.EXTERNAL == descriptor.value?.type) {
    return 'ant-design:cloud-upload-outlined'
  } else if (ComponentDescriptorType.FLOW == descriptor.value?.type) {
    return 'ant-design:sisternode-outlined'
  } else if (ComponentDescriptorType.ENRICHMENT == descriptor.value?.type) {
    return 'ant-design:profile-outlined'
  } else if (ComponentDescriptorType.TRANSFORMATION == descriptor.value?.type) {
    return 'ant-design:interaction-outlined'
  }
}
)

function transportIcon(icon: string) {
  if ('find_replace' == icon) {
    return 'ant-design:interaction-outlined'
  } else if ('content_copy' == icon) {
    return 'ant-design:copy-outlined'
  } else if ('remove_circle' == icon) {
    return 'ant-design:minus-circle-outlined'
  } else if ('add_circle' == icon) {
    return 'ant-design:plus-circle-outlined'
  } else if ('functions' == icon) {
    return 'ant-design:function-outlined'
  } else if ('email' == icon) {
    return 'ant-design:mail-outlined'
  } else if ('notifications_off' == icon) {
    return 'ant-design:bell-outlined';
  } else if ('notifications_active' == icon) {
    return 'ant-design:alert-outlined';
  } else if ('pause' == icon) {
    return 'ant-design:pause-outlined';
  } else if ('repeat' == icon) {
    return 'ant-design:partition-outlined';
  } else if ('menu' == icon) {
    return 'ant-design:align-left-outlined';
  } else if ('calculate' == icon) {
    return 'ant-design:calculator-outlined';
  } else if ('cloud_download' == icon) {
    return 'ant-design:cloud-download-outlined';
  } else if ('file_upload' == icon) {
    return 'ant-design:to-top-outlined';
  } else if ('call_merge' == icon) {
    return 'ant-design:to-top-outlined';
  } else if ('call_made' == icon) {
    return 'ant-design:rise-outlined';
  } else if ('send' == icon) {
    return 'ant-design:send-outlined';
  } else if ('notifications' == icon) {
    return 'ant-design:bell-outlined';
  } else if ('sms' == icon) {
    return 'ant-design:message-outlined';
  } else if ('call_split' == icon) {
    return 'ant-design:cloud-server-outlined';
  } else {
    return 'ant-design:deployment-unit-outlined'
  }
}
</script>
<style lang="less">
.rule-chain-node {
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  background-color: '#00b96b';
  border: 1px solid @border-color-base;
  border-radius: 8px;

  :hover {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .content {
    height: 100%;
    display: flex;
    align-items: center;

    .title {
      margin-left: 8px;
      font-size: 14px;
      overflow: hidden;
      pointer-events: none;

      .type {}

      .name {
        font-weight: 500;
      }

    }

    .app-iconify {
      font-size: 20px;
    }

    img {
      width: 20px;
      height: 20px;
    }

  }

}

.rule-chain-node-popover-card {
  max-width: 500px;

  .ant-popover-title {
    font-size: 16px;
  }

  .popover-card-content {
    font-size: 12px;
    font-style: oblique;

    .description {
      margin-bottom: 8px;
    }
  }
}
</style>