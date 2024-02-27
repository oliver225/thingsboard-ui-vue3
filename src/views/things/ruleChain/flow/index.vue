<template>
  <div class="rule-chain-edit">
    <div class="edit-stencil" id="stencil"></div>
    <div class="edit-container" id="container"></div>
    <div class="rule-chain-title">
      {{ record.name }}
      {{ record.root ? '（根链）' : '' }}
    </div>
    <TeleportContainer></TeleportContainer>
  </div>
</template>

<script  lang="ts" setup name="RuleChainFLow">
import { ref, watch, onMounted } from 'vue';
import { Graph } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil'
import { register, getTeleport } from '@antv/x6-vue-shape'
import { RuleChain, RuleChainMetaData, getRuleChainById, getRuleChainMetaData } from '/@/api/things/ruleChain';
import { router } from '/@/router';
import { isEmpty } from 'lodash';
import RuleChainNode from './node.vue';
import { sleep } from '/@/utils';
import { primaryColor } from '../../../../../build/config/themeConfig';
import { ComponentDescriptor, getComponentDescriptorList } from '/@/api/things/componentDescriptor';
import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS, ComponentDescriptorType } from '/@/enums/componentEnum';

register({
  shape: 'rule-chain-node',
  width: 200,
  height: 50,
  ports: {
    groups: {
      right: {
        position: 'right',
        attrs: {
          circle: {
            magnet: true,
            stroke: '#8f8f8f',
            r: 5,
          },
        },
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            magnet: true,
            stroke: '#8f8f8f',
            r: 5,
          },
        },
      },
    },
  },
  component: RuleChainNode,
})
Graph.registerEdge('rule-edge', {
  inherit: 'edge',
  attrs: {
    line: {
      connection: true,
      stroke: '#808080',
      strokeWidth: 5,
      targetMarker: {
        name: 'classic',
        size: 12,
      }
    },
  },
  connector: {
    name: 'smooth',
    args: {
      raw: true,
      direction: 'V',
    },
  },
  defaultLabel: {
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
    ],
    attrs: {
      text: {
        fill: primaryColor,
        fontSize: 14,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        stroke: primaryColor,
      },
      rect: {
        ref: 'label',
        stroke: primaryColor,
        strokeWidth: 2,
        fill: '#fff',
        rx: 6,
        ry: 6,
        refWidth: 1,
        refHeight: 1,
        refX: 1,
        refY: 1,
      },
    },
    position: {
      distance: 0.5,
    },

  },

})

const TeleportContainer = getTeleport()
const inputNodeId = 'input-node-9808-11ee-8b83-9b8f64bdd866';
const record = ref<RuleChain>({} as RuleChain);
const metaData = ref<RuleChainMetaData>();
const components = ref<Array<ComponentDescriptor>>([]);

const graphRef = ref<Graph>();

async function fetchData() {
  const ruleChainId = router.currentRoute.value.params.ruleChainId as string
  if (isEmpty(ruleChainId)) {
    return Promise.reject(new Error('规则链为空！'));
  }
  record.value = await getRuleChainById(ruleChainId)
}

async function fetchMetaData() {
  if (isEmpty(record.value.id.id)) {
    return Promise.reject(new Error('规则链为空！'));
  }
  metaData.value = await getRuleChainMetaData(record.value.id.id);
}

async function fetchComponent() {
  components.value = await getComponentDescriptorList(
    [ComponentDescriptorType.ENRICHMENT,
    ComponentDescriptorType.FILTER,
    ComponentDescriptorType.TRANSFORMATION,
    ComponentDescriptorType.ACTION,
    ComponentDescriptorType.EXTERNAL,
    ComponentDescriptorType.FLOW],
    'CORE');
}

async function renderGraph() {
  await fetchComponent();
  const graph = new Graph({
    container: document.getElementById('container')!,
    background: {
      color: '#F2F7FA',
    },
    autoResize: true,
    grid: {
      visible: true,
      type: 'doubleMesh',
      args: [
        {
          color: '#eee', // 主网格线颜色
          thickness: 1, // 主网格线宽度
        },
        {
          color: '#ddd', // 次网格线颜色
          thickness: 1, // 次网格线宽度
          factor: 4, // 主次网格线间隔
        },
      ],
    },
  })
  graphRef.value = graph;
  graph.addNode({
    id: inputNodeId,
    shape: 'rule-chain-node',
    x: 40,
    y: 150,
    width: 200,
    height: 50,
    label: 'Input',
    ports: {
      items: [{
        id: 'out_port',
        group: 'right',
      }],
    },
    data: {
      descriptor: {
        name: '输入',
        configurationDescriptor: {
          nodeDefinition: {
            description: '规则链的逻辑输入，将传入消息转发到下一个相关规则节点。',
            icon: 'ant-design:login-outlined'
          }
        }
      },
    }
  })
  const stencil = new Stencil({
    target: graph,
    search(cell, keyword) {
      return cell.shape.indexOf(keyword) !== -1
    },
    placeholder: '查找规则链节点',
    notFoundText: '没有找到',
    layoutOptions: {
      columns: 1,
      columnWidth: 210,
      rowHeight: 60
    },
    groups: COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.map(item => ({
      name: item.value,
      title: item.label,
      graphWidth: 220,
      graphHeight: (components.value.filter(comp => comp.type == item.value).length) * 60 + 20
    }))
  })
  document.getElementById('stencil')!.appendChild(stencil.container)

  COMPONENTS_DESCRIPTOR_TYPE_OPTIONS.forEach(item => {
    const nodeList = components.value
      .filter(comp => comp.type == item.value)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(comp => {
        let portItems: any[] = [];
        if (comp.configurationDescriptor?.nodeDefinition.inEnabled == true) {
          portItems.push({
            id: 'in_port',
            group: 'left',
          })
        }
        if (comp.configurationDescriptor?.nodeDefinition.outEnabled == true) {
          portItems.push({
            id: 'out_port',
            group: 'right',
          })
        }
        return {
          shape: 'rule-chain-node',
          label: comp.name,
          data: { descriptor: comp },
          ports: {
            items: portItems,
          },
        }
      })
    stencil.load(nodeList, item.value)
  })

  graph.on('node:added', onCreateNode);

}

async function renderMetaData() {
  await fetchMetaData();
  while (isEmpty(graphRef.value)) {
    await sleep(500);
  }

  if (metaData.value?.nodes && metaData.value?.nodes?.length > 0) {
    // 渲染节点
    metaData.value.nodes.forEach(node => {
      const desc = components.value.find(comp => comp.clazz == node.type);
      if (!isEmpty(desc)) {
        let portItems: any[] = [];
        if (desc.configurationDescriptor?.nodeDefinition.inEnabled == true) {
          portItems.push({ id: 'in_port', group: 'left' })
        }
        if (desc.configurationDescriptor?.nodeDefinition.outEnabled == true) {
          portItems.push({ id: 'out_port', group: 'right' })
        }
        graphRef.value?.addNode(
          {
            id: node.id.id,
            shape: 'rule-chain-node', // 可以直接使用上面注册过的 shape
            x: node.additionalInfo?.layoutX,
            y: node.additionalInfo?.layoutY,
            width: 200,
            height: 50,
            ports: { items: portItems },
            data: { descriptor: desc, data: node }
          }
        )
      }
    })
    //  渲染链接的边
    if (metaData.value?.firstNodeIndex) {
      graphRef.value.addEdge({
        shape: 'rule-edge',
        source: { cell: inputNodeId, port: 'out_port' },
        target: { cell: metaData.value.nodes[metaData.value.firstNodeIndex].id.id, port: 'in_port' },
      })
    }
    if (metaData.value.connections && metaData.value.connections.length > 0) {
      metaData.value.connections.forEach(connect => {
        graphRef.value?.addEdge({
          shape: 'rule-edge',
          source: { cell: metaData.value?.nodes[connect.fromIndex].id.id || 'undefined', port: 'out_port' },
          target: { cell: metaData.value?.nodes[connect.toIndex].id.id || 'undefined', port: 'in_port' },
          label: connect.type,
        })
      })
    }

  }
}

function onCreateNode({ node, index, options }) {
  graphRef.value?.getNodes()
  console.log(node)
  console.log(index, node.data.data.name);
}

onMounted(async () => {
  await renderGraph();
})


watch(
  () => router.currentRoute.value.params.ruleChainId,
  async () => {
    await fetchData();
    await renderMetaData();
  },
  { immediate: true, },
);

</script>
<style lang="less">
.rule-chain-edit {
  width: 100%;
  height: 100%;
  display: flex;
  border-radius: @border-radius-base !important;


  .edit-stencil {
    position: relative;
    width: 240px;

    .x6-widget-stencil {
      background-color: @component-background;
    }

    .x6-widget-stencil-title {
      display: none;
    }

    .x6-widget-stencil-content {
      top: 42px;
    }
  }

  .edit-container {
    flex: 1;
    box-shadow: 0 0 10px 1px #e9e9e9;
  }

  .rule-chain-title {
    position: fixed;
    z-index: 99;
    margin-left: 250px;
    margin-top: 10px;
    font-size: 1rem;
    line-height: 1.2rem;
    font-weight: 600;
  }
}
</style>