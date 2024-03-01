<template>
  <div class="rule-chain-edit">
    <div class="edit-stencil" id="stencil"></div>
    <div class="edit-container" id="container"></div>
    <div class="rule-chain-title">
      {{ record.name }}
      {{ record.root ? '（根链）' : '' }}
    </div>
    <TeleportContainer></TeleportContainer>
    <ConnectTypeForm @register="registerConnectModal" @success="handleConnectSuccess" />
    <NodeForm @register="registerNodeModal" @success="handleNodeSuccess" />
  </div>
</template>

<script  lang="ts" setup name="RuleChainFLow">
import { ref, watch, onMounted, render, createVNode } from 'vue';
import { Dom } from '@antv/x6-common';
import { Graph, Markup, Cell, CellView, Edge, Node } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil'
import { register, getTeleport } from '@antv/x6-vue-shape'
import { useModal } from '/@/components/Modal';
import { RuleChain, RuleChainMetaData, getRuleChainById, getRuleChainMetaData } from '/@/api/things/ruleChain';
import { router } from '/@/router';
import { isEmpty } from 'lodash';
import RuleChainNode from './node.vue';
import ConnectLabel from './connectLabel.vue';
import ConnectTypeForm from './connectTypeForm.vue';
import NodeForm from './nodeComp/nodeForm.vue';
import { sleep } from '/@/utils';
import { ComponentDescriptor, getComponentDescriptorList } from '/@/api/things/componentDescriptor';
import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS, ComponentDescriptorType } from '/@/enums/componentEnum';

register({
  shape: 'rule-chain-node',
  width: 200,
  height: 50,
  ports: {
    groups: {
      out: {
        position: 'right',
        attrs: { circle: { magnet: true, stroke: '#8f8f8f', r: 5 } },
      },
      in: {
        position: 'left',
        attrs: { circle: { magnet: true, stroke: '#8f8f8f', r: 5 } },
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
      strokeWidth: 3,
      targetMarker: { name: 'classic', size: 12 }
    },
  },
  connector: {
    name: 'smooth',
    args: { raw: true, direction: 'V' },
  },
  defaultLabel: {
    markup: Markup.getForeignObjectMarkup(),
    attrs: {
      fo: { width: 700, height: 40, x: -350, y: -20 },
    },
    position: { distance: 0.5 },
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
    background: { color: '#F2F7FA' },
    autoResize: true,
    grid: {
      visible: true,
      type: 'doubleMesh',
      args: [
        { color: '#eee', thickness: 1 },
        { color: '#ddd', thickness: 1, factor: 4 },
      ],
    },
    onEdgeLabelRendered: (args) => {
      const { label, selectors } = args
      const content = selectors.foContent as HTMLDivElement;
      if (content) {
        render(createVNode(ConnectLabel, { text: label.attrs?.label.text }), content)
      }
      return undefined;
    },
    interacting: {
      nodeMovable: (view) => {
        if (view.cell.id == inputNodeId) return false;
        return true;
      }
    },
    connecting: {
      snap: true,
      highlight: true,
      allowPort: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: false,
      allowEdge: false,
      allowMulti: false,
      createEdge: createEdge,
      validateEdge: validateEdge,
      validateMagnet: validateMagnet,
    }
  })
  graphRef.value = graph;
  graph.addNode({
    id: inputNodeId,
    shape: 'rule-chain-node',
    x: 30,
    y: 150,
    width: 200,
    height: 50,
    label: 'Input',
    ports: { items: [{ id: 'out_port', group: 'out', }], },
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
    layoutOptions: { columns: 1, columnWidth: 210, rowHeight: 60 },
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
          portItems.push({ id: 'in_port', group: 'in', })
        }
        if (comp.configurationDescriptor?.nodeDefinition.outEnabled == true) {
          portItems.push({ id: 'out_port', group: 'out', })
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

  graph.on('node:added', onNodeAdded);
  graph.on('edge:connected', onEdgeConnected)

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
          portItems.push({ id: 'in_port', group: 'in' })
        }
        if (desc.configurationDescriptor?.nodeDefinition.outEnabled == true) {
          portItems.push({ id: 'out_port', group: 'out' })
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
      const currentConnect: Array<{ fromIndex: number, toIndex: number, type: [string] }> = [];
      metaData.value.connections.forEach(connect => {
        const target = currentConnect.find(item => item.fromIndex == connect.fromIndex && item.toIndex == connect.toIndex);
        if (target == undefined) {
          currentConnect.push({ fromIndex: connect.fromIndex, toIndex: connect.toIndex, type: [connect.type] })
        } else {
          target.type.push(connect.type);
        }
      })
      graphRef.value.addEdges(currentConnect.map(item => ({
        shape: 'rule-edge',
        source: { cell: metaData.value?.nodes[item.fromIndex].id.id || 'undefined', port: 'out_port' },
        target: { cell: metaData.value?.nodes[item.toIndex].id.id || 'undefined', port: 'in_port' },
        label: item.type.join(' / '),
      })));
    }
  }
}

// 校验连接柱是否能 接收连接线
function validateEdge(this: Graph, args: { edge: Edge; type: Edge.TerminalType; previous: Edge.TerminalData; }) {
  if (args.type == 'target' && args.edge.target.port == 'in_port') {
    return true;
  }
  return false;
}
// 校验连接柱是否能 拉出来连接线
function validateMagnet(this: Graph, args: { cell: Cell; view: CellView; magnet: Element; e: Dom.MouseDownEvent | Dom.MouseEnterEvent; }) {
  if (args.magnet.getAttribute('port-group') == 'out') {
    return true;
  }
  return false;
}

// 初始换连接线
function createEdge(this: Graph, args: { sourceCell: Cell; sourceView: CellView; sourceMagnet: Element }) {
  return this.createEdge({
    shape: 'rule-edge',
    data: {
      customRelations: args.sourceCell.data.descriptor.configurationDescriptor.nodeDefinition?.customRelations,
      relationTypes: args.sourceCell.data.descriptor.configurationDescriptor.nodeDefinition?.relationTypes,
    }
  })
}

// 节点添加成功
function onNodeAdded({ node, index, options }) {
  if (node.data.data) {
    return;
  }
  openNodeModal(true, { ...node.data })
}

// 节点连接 弹框 
function onEdgeConnected({ isNew, edge }) {
  if (isNew) {
    //新增
    openConnectModal(true, { ...edge.data, edgeId: edge.id })
  }
}

const [registerConnectModal, { openModal: openConnectModal }] = useModal();

// 连接类型编辑成功， 更新连接
function handleConnectSuccess({ edgeId, currentTypes }) {
  if (currentTypes && currentTypes.length > 0) {
    const edge = graphRef.value?.getCellById(edgeId) as Edge;
    edge.appendLabel(currentTypes.join(' / '))
  } else {
    graphRef.value?.removeEdge(edgeId);
  }
}

const [registerNodeModal, { openModal: openNodeModal }] = useModal();

// Node 节点数据编辑成功
function handleNodeSuccess({ nodeId, data }) {
  const node = graphRef.value?.getCellById(nodeId) as Node;


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