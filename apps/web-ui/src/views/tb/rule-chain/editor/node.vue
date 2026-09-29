<script lang="ts">
import type { RuleNodeDescriptor } from '#/api/tb/rule-chain';

import { $t } from '#/locales';

import nodeTypes from './configurations/rule-chain-types.json';

export const nodeCategories = [
  {
    value: 'FILTER',
    icon: 'lucide:list-filter',
    get label() {
      return $t('rule-chain.editor.categories.FILTER');
    },
    color: '#EDEA64',
  },
  {
    value: 'ENRICHMENT',
    icon: 'lucide:list-plus',
    get label() {
      return $t('rule-chain.editor.categories.ENRICHMENT');
    },
    color: '#AED045',
  },
  {
    value: 'TRANSFORMATION',
    icon: 'lucide:replace',
    get label() {
      return $t('rule-chain.editor.categories.TRANSFORMATION');
    },
    color: '#639AB4',
  },
  {
    value: 'ACTION',
    icon: 'lucide:zap',
    get label() {
      return $t('rule-chain.editor.categories.ACTION');
    },
    color: '#EC9390',
  },
  {
    value: 'EXTERNAL',
    icon: 'lucide:cloud-upload',
    get label() {
      return $t('rule-chain.editor.categories.EXTERNAL');
    },
    color: '#F6C968',
  },
  {
    value: 'FLOW',
    icon: 'lucide:workflow',
    get label() {
      return $t('rule-chain.editor.categories.FLOW');
    },
    color: '#D7C3F1',
  },
];

const nodeIcons: Record<string, string> = {
  'check-alarm-status': 'lucide:bell-dot',
  'asset-profile-switch': 'lucide:boxes',
  'check-fields-presence': 'lucide:list-checks',
  'check-relation-presence': 'lucide:link',
  'device-profile-switch': 'lucide:cpu',
  'entity-type-filter': 'lucide:funnel',
  'entity-type-switch': 'lucide:split',
  'message-type-filter': 'lucide:list-filter',
  'message-type-switch': 'lucide:git-branch',
  'gps-geofencing-filter': 'lucide:map-pin-check',
  'filter-script': 'lucide:code',
  switch: 'lucide:git-fork',
  'calculate-delta': 'lucide:diff',
  'customer-attributes': 'lucide:contact',
  'customer-details': 'lucide:contact-round',
  'fetch-device-credentials': 'lucide:key-round',
  'originator-attributes': 'lucide:list-plus',
  'originator-fields': 'lucide:list-tree',
  'originator-telemetry': 'lucide:chart-no-axes-combined',
  'related-device-attributes': 'lucide:network',
  'related-entity-data': 'lucide:database',
  'tenant-attributes': 'lucide:building',
  'tenant-details': 'lucide:building-2',
  'change-originator': 'lucide:replace',
  'copy-key-value-pairs': 'lucide:copy',
  'delete-key-value-pairs': 'lucide:list-minus',
  'json-path': 'lucide:braces',
  'transform-script': 'lucide:file-code',
  'rename-keys': 'lucide:text-cursor-input',
  deduplication: 'lucide:copy-minus',
  'split-array-msg': 'lucide:split',
  'to-email': 'lucide:mail',
  'assign-to-customer': 'lucide:user-plus',
  'clear-alarm': 'lucide:bell-off',
  'copy-to-view': 'lucide:panels-top-left',
  'create-alarm': 'lucide:bell-ring',
  'create-relation': 'lucide:link',
  'delay-deprecated': 'lucide:timer',
  'delete-attribute': 'lucide:list-x',
  'delete-relation': 'lucide:unlink',
  'device-profile': 'lucide:cpu',
  'device-state': 'lucide:activity',
  generator: 'lucide:repeat',
  'gps-geofencing-events': 'lucide:map-pinned',
  log: 'lucide:logs',
  'math-function': 'lucide:calculator',
  'message-count': 'lucide:tally-5',
  'push-to-edge': 'lucide:network',
  'rest-call-reply': 'lucide:corner-up-left',
  'rpc-call-reply': 'lucide:reply',
  'rpc-call-request': 'lucide:send',
  'save-attributes': 'lucide:save',
  'save-timeseries': 'lucide:database-backup',
  'save-to-custom-table': 'lucide:table',
  'synchronization-end': 'lucide:git-merge',
  'synchronization-start': 'lucide:git-fork',
  'unassign-from-customer': 'lucide:user-minus',
  'ai-node': 'lucide:brain-circuit',
  'send-sms': 'lucide:message-square',
  'send-notification': 'lucide:bell',
  'send-email': 'lucide:mail-plus',
  'rest-api-call': 'lucide:globe',
  rabbitmq: 'lucide:rabbit',
  mqtt: 'lucide:radio-tower',
  kafka: 'lucide:workflow',
  'gcp-pubsub': 'lucide:cloud-upload',
  acknowledge: 'lucide:check-check',
  checkpoint: 'lucide:flag',
  output: 'lucide:log-out',
  'rule-chain': 'lucide:workflow',
  'push-to-cloud': 'lucide:cloud-upload',
  'send-to-slack': 'lucide:messages-square',
  'calculated-fields': 'lucide:sigma',
  'aws-lambda': 'lucide:square-function',
  'aws-sns': 'lucide:megaphone',
  'aws-sqs': 'lucide:list-ordered',
  'azure-iot-hub': 'lucide:cloud-cog',
};

export function getNodeIcon(descriptor?: RuleNodeDescriptor): string {
  const type = nodeTypes[descriptor?.clazz as keyof typeof nodeTypes];
  const icon = descriptor?.configurationDescriptor?.nodeDefinition.icon;
  return (
    nodeIcons[type] ??
    (icon?.startsWith('lucide:') ? icon : undefined) ??
    nodeCategories.find((item) => item.value === descriptor?.type)?.icon ??
    'lucide:workflow'
  );
}
</script>

<script lang="ts" setup name="ViewsTbRuleChainFlowNode">
import type { Node } from '@antv/x6';

import type {
  RuleNodeDescriptor as ComponentDescriptor,
  RuleNode,
} from '#/api/tb/rule-chain';

import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Popover } from 'antdv-next';

const props = defineProps<{
  descriptor?: ComponentDescriptor;
  showPorts?: boolean;
}>();
const graphDescriptor = ref<ComponentDescriptor>();
const descriptor = computed(() => props.descriptor ?? graphDescriptor.value);
const definition = computed(
  () => descriptor.value?.configurationDescriptor.nodeDefinition,
);
const record = ref<RuleNode>();

const getNode = inject<(() => Node) | undefined>('getNode', undefined);
let node: Node | undefined;
const updateData = () => {
  if (node) setValue(node.getData());
};

const backgroundColor = computed(
  () =>
    nodeCategories.find((item) => item.value === descriptor.value?.type)
      ?.color || '#00b96b ',
);

onMounted(() => {
  node = getNode?.();
  updateData();
  node?.on('change:data', updateData);
});
onBeforeUnmount(() => node?.off('change:data', updateData));

function setValue(data: { descriptor: ComponentDescriptor; data: RuleNode }) {
  graphDescriptor.value = data.descriptor;
  record.value = data.data;
}
</script>
<template>
  <div class="rule-chain-node" :style="{ backgroundColor }">
    <span
      v-if="showPorts && definition?.inEnabled"
      class="rule-chain-node-port rule-chain-node-port-in"
      aria-hidden="true"
    ></span>
    <span
      v-if="showPorts && definition?.outEnabled"
      class="rule-chain-node-port rule-chain-node-port-out"
      aria-hidden="true"
    ></span>
    <Popover
      placement="right"
      :mouse-enter-delay="0.5"
      :title="record?.name ? record.name : descriptor?.name"
      :classes="{
        root: 'rule-chain-node-popover-card',
        container: 'rule-chain-node-popover-container',
        title: 'rule-chain-node-popover-title',
        content: 'rule-chain-node-popover-content',
      }"
    >
      <template #content>
        <div class="popover-card-content">
          <div v-if="record?.name" class="type">
            {{
              nodeCategories.find((item) => item.value === descriptor?.type)
                ?.label
            }}
            - {{ descriptor?.name }}
          </div>
          <div
            class="description"
            v-html="
              descriptor?.configurationDescriptor?.nodeDefinition?.description
            "
          ></div>
          <div
            v-if="!record?.name"
            class="details"
            v-html="
              descriptor?.configurationDescriptor?.nodeDefinition?.details
            "
          ></div>
        </div>
      </template>
      <div class="content">
        <IconifyIcon :icon="getNodeIcon(descriptor)" />
        <div class="rule-chain-node-title">
          <div class="type">{{ descriptor?.name }}</div>
          <div class="name">{{ record?.name }}</div>
        </div>
      </div>
    </Popover>
  </div>
</template>
<style lang="less">
.x6-widget-dnd foreignObject body {
  min-height: 0;
  height: 100%;
  background: transparent;
}
.rule-chain-node {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  color: #27272a;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  transition: box-shadow 180ms ease-out;

  &::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgb(0 0 0 / 12%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease-out;
    content: '';
  }

  .rule-chain-node-port {
    position: absolute;
    top: 50%;
    z-index: 1;
    width: 10px;
    height: 10px;
    border: 1px solid #8f8f8f;
    border-radius: 50%;
    background: #fff;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .rule-chain-node-port-in {
    left: -5px;
  }

  .rule-chain-node-port-out {
    right: -5px;
  }

  .content {
    height: 100%;
    display: flex;
    align-items: center;

    .rule-chain-node-title {
      margin-left: 8px;
      font-size: 14px;
      overflow: hidden;
      pointer-events: none;
      white-space: nowrap;
      text-overflow: ellipsis;

      .name {
        font-weight: 500;
      }
    }

    .iconify {
      flex-shrink: 0;
      font-size: 20px;
    }
  }
}

.rule-chain-node:hover,
.x6-node-selected .rule-chain-node {
  box-shadow: 0 3px 10px rgb(0 0 0 / 14%);

  &::after {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rule-chain-node,
  .rule-chain-node::after {
    transition: none;
  }
}

.rule-chain-node-popover-card {
  width: min(420px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  overflow-wrap: anywhere;

  .rule-chain-node-popover-container {
    display: flex;
    flex-direction: column;
    max-height: min(420px, calc(100dvh - 32px));
    overflow: hidden;
  }

  .rule-chain-node-popover-title {
    flex-shrink: 0;
    max-height: 4.5em;
    overflow: auto;
    font-size: 14px;
  }

  .rule-chain-node-popover-content {
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }

  .popover-card-content {
    font-size: 12px;
    line-height: 1.6;

    pre {
      white-space: pre-wrap;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    .description {
      margin-bottom: 8px;
    }
  }
}
</style>
