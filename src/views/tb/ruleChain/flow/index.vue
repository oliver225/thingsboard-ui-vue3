<template>
  <div class="rule-chain-edit">
    <div class="edit-stencil" id="stencil"></div>
    <div class="edit-container" id="container"></div>
    <div class="rule-chain-title">
      {{ record.name }}
      {{ record.root ? '（根链）' : '' }}
    </div>
    <TeleportContainer />
    <ConnectTypeForm @register="registerConnectModal" @success="handleConnectSuccess" @cancel="handleConnectCancel" />
    <NodeForm @register="registerNodeModal" @success="handleNodeSuccess" @cancel="handleNodeCancel" />
    <NodeDetail @register="registerNodeDetailDrawer" />
    <Space size="middle" class="fixed bottom-8 right-8 z-50">
      <Tooltip title="删除选中的节点和连接">
        <Button shape="circle" size="large" type="primary" danger style="width: 50px; height: 50px;"
          v-show="showDeleteButton" @click="handleDeleteSelection">
          <template #icon>
            <Icon icon="ant-design:delete-outlined" />
          </template>
        </Button>
      </Tooltip>
      <Tooltip title="重置所有节点的调试模式">
        <Button shape="circle" size="large" danger style="width: 50px; height: 50px;" :disabled="disableDebugButton"
          @click="handleResetDebug">
          <template #icon>
            <Icon icon="ant-design:bug-outlined" />
          </template>
        </Button>
      </Tooltip>
      <Tooltip title="取消更改">
        <Button shape="circle" size="large" style="width: 50px; height: 50px;" :disabled="disableSaveButton"
          @click="handleReduction">
          <template #icon>
            <Icon icon="ant-design:close-outlined" />
          </template>
        </Button>
      </Tooltip>
      <Tooltip title="保存更改">
        <Button shape="circle" size="large" type="primary" style="width: 50px; height: 50px;"
          :disabled="disableSaveButton" @click="handleSave">
          <template #icon>
            <Icon icon="ant-design:check-outlined" />
          </template>
        </Button>
      </Tooltip>
    </Space>
    <Loading :loading="loading" />
  </div>
</template>

<script  lang="ts" setup name="ViewsTbRuleChainFLowIndex">
import { ref, watch, onMounted } from 'vue';
import { Icon } from '/@/components/Icon';
import { Button, Space, Tooltip } from 'ant-design-vue';
import { Graph, Cell, CellView, Edge, Node } from '@antv/x6';
import { register, getTeleport } from '@antv/x6-vue-shape'
import { Stencil } from '@antv/x6-plugin-stencil'
// import { Scroller } from '@antv/x6-plugin-scroller'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Clipboard } from '@antv/x6-plugin-clipboard'
import { Selection } from '@antv/x6-plugin-selection'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { History } from '@antv/x6-plugin-history'
import { useModal } from '/@/components/Modal';
import { useDrawer } from '/@/components/Drawer';
import { onBeforeRouteLeave } from 'vue-router';
import { router } from '/@/router';
import { isEmpty } from 'lodash-es';
import { sleep } from '/@/utils';
import RuleChainNode from './node.vue';
import { useI18n } from '/@/hooks/web/useI18n';
import NodeForm from './nodeForm.vue';
import NodeDetail from './nodeDetail.vue';
import { Loading } from '/@/components/Loading';
import ConnectTypeForm from './connectTypeForm.vue';
import { useMessage } from '/@/hooks/web/useMessage';
import { createContextMenu } from '/@/components/ContextMenu';
import { primaryColor } from '../../../../../build/theme/themeConfig';
import { ComponentDescriptor, getComponentDescriptorList } from '/@/api/tb/componentDescriptor';
import { RuleChain, RuleChainMetaData, getRuleChainById, getRuleChainMetaData, saveRuleChainMetaData } from '/@/api/tb/ruleChain';
import { COMPONENTS_DESCRIPTOR_TYPE_OPTIONS, ComponentDescriptorType } from '/@/enums/componentEnum';

register({
  shape: 'rule-chain-node',
  width: 200,
  height: 50,
  ports: {
    groups: {
      out: { position: 'right', attrs: { circle: { magnet: true, stroke: '#8f8f8f', r: 5 } } },
      in: { position: 'left', attrs: { circle: { magnet: true, stroke: '#8f8f8f', r: 5 } } },
    }
  },
  component: RuleChainNode,
})
Graph.registerEdge('rule-edge', {
  inherit: 'edge',
  attrs: { line: { connection: true, stroke: '#808080', strokeWidth: 3 } },
  connector: { name: 'smooth', args: { raw: true, direction: 'V' } },
  defaultLabel: {
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
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
        rx: 8,
        ry: 8,
        refWidth: 12,
        refHeight: 4,
        refX: -6,
        refY: -1,
      },
    },
    position: { distance: 0.5 },
  }

}, true)
const { t } = useI18n('tb');
const { showMessage, createConfirm } = useMessage();

const TeleportContainer = getTeleport()
const inputNodeId = 'input-node-9808-11ee-8b83-9b8f64bdd866';
const record = ref<RuleChain>({} as RuleChain);
const metaData = ref<RuleChainMetaData>();
const components = ref<Array<ComponentDescriptor>>([]);

const graphRef = ref<Graph>();

const showDeleteButton = ref(false);
const disableSaveButton = ref(true);
const disableDebugButton = ref(true);
const loading = ref(false);

async function fetchData() {
  const ruleChainId = router.currentRoute.value.params.ruleChainId as string
  if (isEmpty(ruleChainId)) {
    console.log(new Error('规则链为空！'));
    return;
  }
  record.value = await getRuleChainById(ruleChainId)
}

async function fetchMetaData() {
  if (isEmpty(record.value.id.id)) {
    console.log(new Error('规则链为空！'));
    return;
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

// 初始化编辑器
async function renderGraph() {
  loading.value = true;
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
        { color: '#ddd', thickness: 1, factor: 4 }
      ]
    },
    interacting: { nodeMovable: (view) => view.cell.id != inputNodeId },
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

  const stencil = new Stencil({
    target: graph,
    search: (cell, keyword) => cell.data.descriptor.name.indexOf(keyword) !== -1,
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
  document.getElementById('stencil')!.appendChild(stencil.container);

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
          ports: { items: portItems },
        }
      })
    stencil.load(nodeList, item.value)
  })

  graph.use(new History({ enabled: true, beforeAddCommand: beforeAddCommand }));
  // graph.use(new Scroller({ enabled: true }));
  graph.use(new Clipboard({ enabled: true }));
  graph.use(new Keyboard({ enabled: true, global: true }));
  graph.use(new Snapline({ enabled: true, clean: false, className: 'snap-line' }));
  graph.use(new Selection({ enabled: true, rubberband: true, className: 'selection-box', showNodeSelectionBox: true, filter: (cell) => cell.id != inputNodeId }))

  // 绑定ctrl+c 复制
  graph.bindKey('ctrl+c', () => {
    const cells = graph.getSelectedCells();
    if (cells.length) {
      graph.copy(cells)
    }
    return false
  });
  // 绑定ctrl+v 粘贴
  graph.bindKey('ctrl+v', () => {
    if (!graph.isClipboardEmpty()) {
      const cells = graph.paste({ offset: 32 })
      graph.cleanSelection()
      graph.select(cells)
    }
    return false
  });
  // 绑定ctrl+z 撤销
  graph.bindKey('ctrl+z', () => {
    if (graph.canUndo()) {
      graph.undo()
    }
    return false
  });

  graph.on('node:added', onNodeAdded);
  graph.on('edge:connected', onEdgeConnected);
  graph.on('node:selected', onNodeSelected);
  graph.on('edge:selected', onEdgeSelected);
  graph.on('cell:unselected', onCellUnSelected);
  graph.on('edge:mouseenter', onEdgeMouseEnter);
  graph.on('edge:mouseleave', onEdgeMouseLeave);
  graph.on('history:change', onHistoryChange);
  graph.on('node:contextmenu', onNodeContextMenu);
  graph.on('edge:contextmenu', onEdgeContextMenu);
  graph.on('node:change:data', onNodeChangeData);

  loading.value = false;

}

// 规则节点回显数据 绘制
async function renderMetaData() {
  loading.value = true;
  await fetchMetaData();
  while (isEmpty(graphRef.value)) {
    await sleep(500);
  }
  //清空画布
  graphRef.value.clearCells();
  // 画根节点
  graphRef.value?.addNode({
    id: inputNodeId, shape: 'rule-chain-node',
    x: 30, y: 150, width: 200, height: 50, label: 'Input',
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
            width: 200, height: 50,
            ports: { items: portItems },
            data: { descriptor: desc, data: node }
          }
        )
      }
    })
    //  渲染链接的边
    if (metaData.value?.firstNodeIndex != undefined && metaData.value?.firstNodeIndex >= 0) {
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
  onNodeChangeData();
  graphRef.value?.cleanSelection();
  graphRef.value?.cleanHistory();
  loading.value = false;
}

// 校验连接柱是否能 接收连接线
function validateEdge(this: Graph, args: { edge: Edge; type: Edge.TerminalType; previous: Edge.TerminalData; }) {
  if (args.type == 'target' && args.edge.target.port == 'in_port') {
    return true;
  }
  return false;
}
// 校验连接柱是否能 拉出来连接线
function validateMagnet(this: Graph, args: { cell: Cell; view: CellView; magnet: Element }) {
  if (args.magnet.getAttribute('port-group') == 'out') {
    return true;
  }
  return false;
}

// 初始换连接线 /边
function createEdge(this: Graph, args: { sourceCell: Cell; sourceView: CellView; sourceMagnet: Element }) {
  return this.createEdge({
    shape: 'rule-edge',
    data: {
      customRelations: args.sourceCell.data.descriptor.configurationDescriptor.nodeDefinition?.customRelations,
      relationTypes: args.sourceCell.data.descriptor.configurationDescriptor.nodeDefinition?.relationTypes,
    }
  })
}

// 边连接成功后 弹框 
function onEdgeConnected({ isNew, edge }) {
  if (isNew && edge.data.relationTypes && edge.data.relationTypes.length) {
    //新增
    openConnectModal(true, { ...edge.data, edgeId: edge.id })
  }
}

const [registerConnectModal, { openModal: openConnectModal }] = useModal();

// 连接线/边类型编辑成功， 更新边上的label
function handleConnectSuccess({ edgeId, currentTypes }) {
  if (currentTypes && currentTypes.length > 0) {
    const edge = graphRef.value?.getCellById(edgeId) as Edge;
    edge.setLabels([{ attrs: { label: { text: currentTypes.join(' / ') } } }]);
  }
}

function handleConnectCancel({ edgeId }) {
  graphRef.value?.removeEdge(edgeId);
}

// 节点添加成功
function onNodeAdded({ node, index, options }) {
  if (node.id == inputNodeId || node.data.data) {
    return;
  }
  openNodeModal(true, { ...node.data, ruleChainId: record.value.id, nodeId: node.id })
}

const [registerNodeModal, { openModal: openNodeModal }] = useModal();

// Node 节点数据编辑成功  更新节点数据
function handleNodeSuccess({ nodeId, data }) {
  const node = graphRef.value?.getCellById(nodeId) as Node;
  //TODO： 每个节点的弹框编辑数据 不一样，更新节点数据
  if (node) {
    node.setData({ descriptor: node.data.descriptor, data: data })
  }

}

function handleNodeCancel({ nodeId }) {
  if (graphRef.value?.canUndo()) {
    graphRef.value?.undo()
  } else {
    graphRef.value?.removeNode(nodeId);
  }

}

const [registerNodeDetailDrawer, { openDrawer: openNodeDetailDrawer }] = useDrawer();


// 鼠标移入连接线/边 后  边变宽，label 变大
function onEdgeMouseEnter({ edge }) {
  edge.setAttrs({ line: { strokeWidth: 6 } });
  const labels = edge.getLabels();
  if (labels.length > 0) {
    edge.setLabels({
      attrs: {
        label: { text: labels[0]?.attrs?.label.text },
        text: { fontSize: 18 },
        rect: { rx: 12, ry: 12 },
      }
    })
  }
}
// 鼠标移入连接线/边 后  恢复原始大小
function onEdgeMouseLeave({ edge }) {
  edge.setAttrs({ line: { strokeWidth: 3 } });
  const labels = edge.getLabels();
  if (labels.length > 0) {
    edge.setLabels({
      attrs: {
        label: { text: labels[0]?.attrs?.label.text },
        text: { fontSize: 14 },
        rect: { rx: 8, ry: 8 },
      }
    })
  }
}

// 节点选中后 添加删除编辑按钮
function onNodeSelected({ node }) {
  showDeleteButton.value = true;
  if (graphRef.value?.getSelectedCellCount() == 1) {
    node.addTools([{
      name: 'button-remove',
      args: {
        markup: [{ tagName: 'circle', selector: 'button', attrs: { r: 12, cursor: 'pointer' } }],
        x: '100%', y: 0, offset: { x: 0, y: -10 },
      },
    }]);
  }
}
// 边选中后 添加删除编辑按钮  同时边变成红色
function onEdgeSelected({ edge }) {
  showDeleteButton.value = true;
  if (graphRef.value?.getSelectedCellCount() == 1) {
    const labelRect = { width: 0, height: 0 };
    const rectElement = (graphRef.value.findView(edge) as any)?.labelContainer?.getElementsByTagName('rect');
    if (rectElement && rectElement.length > 0) {
      labelRect.height = rectElement[0].getAttribute('height');
      labelRect.width = rectElement[0].getAttribute('width');
    }
    edge.addTools([{
      name: 'button-remove',
      args: {
        markup: [{ tagName: 'circle', selector: 'button', attrs: { r: 10, cursor: 'pointer' } }],
        distance: (labelRect.width == 0 && labelRect.height == 0) ? 0.2 : 0.5,
        offset: { x: (labelRect.width / 2), y: -(labelRect.height) },
      },
    }]);
    edge.setAttrs({ line: { stroke: 'red' } });
    const labels = edge.getLabels();
    if (labels.length > 0) {
      edge.setLabels({
        attrs: {
          label: { text: labels[0]?.attrs?.label.text },
          text: { stroke: 'red' },
          rect: { stroke: 'red' },
        }
      })
    }
  }
}

// 取消选中
function onCellUnSelected({ cell }) {
  cell.removeTools();
  showDeleteButton.value = false;
  if (cell instanceof Edge) {
    cell.setAttrs({ line: { stroke: '#808080' } });
    const labels = cell.getLabels();
    if (labels.length > 0) {
      cell.setLabels({
        attrs: {
          label: { text: labels[0]?.attrs?.label.text },
          text: { stroke: primaryColor },
          rect: { stroke: primaryColor },
        }
      })
    }
  }
}


function beforeAddCommand(event, args) {
  if (event == 'cell:change:*' && args.key == 'attrs') {
    return false;
  } else if (event == 'cell:change:*' && args.key == 'tools') {
    return false;
  } else if (event == 'cell:change:*'
    && args.key == 'labels'
    && args.current?.length
    && args.previous?.length
    && args.current[0].attrs.label.text == args.previous[0].attrs.label.text) {
    return false;
  }
}

function onNodeChangeData() {
  disableDebugButton.value = (graphRef.value?.getNodes().filter(node => node.data?.data?.debugMode == true).length || 0) < 1;
}

function onHistoryChange({ cmds }) {
  disableSaveButton.value = (graphRef.value?.getUndoStackSize() || 0) < 1;
}

function handleDeleteSelection() {
  const selectionCells = graphRef.value?.getSelectedCells();
  if (selectionCells?.length) {
    graphRef.value?.removeCells(selectionCells);
  }
  graphRef.value?.cleanSelection();
}

async function handleReduction() {
  await renderMetaData();

  graphRef.value?.cleanHistory();
  graphRef.value?.cleanSelection();
}

function handleResetDebug() {
  const nodeList = graphRef.value?.getNodes();
  if (nodeList?.length) {
    nodeList.forEach(node => {
      if (node.data?.data?.debugMode == true) {
        node.setData({
          ...node.data,
          data: { ...node.data.data, debugMode: false }
        })
      }
    })
  }
}


function onNodeContextMenu({ e, node }) {
  if (node.id == inputNodeId) {
    return;
  }
  createContextMenu({
    event: e,
    items: [
      { label: '详情', icon: 'ant-design:align-right-outlined', divider: true, handler: () => openNodeDetailDrawer(true, { ...node.data }) },
      { label: '编辑', icon: 'i-clarity:note-edit-line', divider: true, handler: () => openNodeModal(true, { ...node.data, ruleChainId: record.value.id, nodeId: node.id }) },
      { label: '复制', icon: 'ant-design:copy-outlined', divider: true, handler: () => graphRef.value?.copy([node]) },
      { label: '删除', icon: 'ant-design:delete-outlined', divider: true, handler: () => graphRef.value?.removeNode(node.id) }
    ]
  });

}

function onEdgeContextMenu({ e, edge }) {
  if (isEmpty(edge.labels)) {
    return;
  }
  let data = edge.data;
  if (data == undefined) {
    const node = graphRef.value?.getCellById(edge.source.cell) as Node;
    data = {
      customRelations: node.data.descriptor.configurationDescriptor.nodeDefinition?.customRelations,
      relationTypes: node.data.descriptor.configurationDescriptor.nodeDefinition?.relationTypes,
    };
  }
  data.currentTypes = edge.labels[0].attrs?.label?.text.split(" / ");
  createContextMenu({
    event: e,
    items: [
      { label: '编辑', icon: 'i-clarity:note-edit-line', divider: true, handler: () => openConnectModal(true, { ...data, edgeId: edge.id }) },
      { label: '复制', icon: 'ant-design:copy-outlined', divider: true, handler: () => graphRef.value?.copy([edge]) },
      { label: '删除', icon: 'ant-design:delete-outlined', divider: true, handler: () => graphRef.value?.removeEdge(edge.id) }
    ]
  });

}

async function handleSave() {
  loading.value = true;
  const jsonData = graphRef.value?.toJSON();
  if (jsonData) {
    const cells = jsonData.cells;
    const nodes = cells
      .filter(cell => cell.shape == 'rule-chain-node' && cell.data.data)
      .map(cell => {
        const additionalInfo = { ...cell.data.data.additionalInfo, layoutX: cell.position.x, layoutY: cell.position.y };
        return { ...cell.data.data, additionalInfo: additionalInfo, nodeId: cell.id }
      });

    const connections: Array<any> = [];
    let firstNodeIndex = -1;

    cells.forEach(cell => {
      if (cell.shape == 'rule-edge' && cell.target && cell.source) {
        if (cell.source.cell == inputNodeId) {
          firstNodeIndex = nodes.findIndex(node => node.nodeId == cell.target.cell);
        }
        if (cell.labels && cell.labels && cell.labels[0].attrs?.label?.text) {
          const labels = cell.labels[0].attrs?.label?.text.split(" / ");
          labels.forEach(label => {
            const fromIndex = nodes.findIndex(node => node.nodeId == cell.source.cell);
            const toIndex = nodes.findIndex(node => node.nodeId == cell.target.cell)
            connections.push({ fromIndex: fromIndex, toIndex: toIndex, type: label })
          })
        }
      }
    });
    try {
      const metaData = {
        ruleChainId: record.value.id,
        firstNodeIndex: firstNodeIndex >= 0 ? firstNodeIndex : null,
        nodes: nodes.length > 0 ? nodes : null,
        connections: connections.length > 0 ? connections : null,
        ruleChainConnections: null,
      }
      const res = await saveRuleChainMetaData(metaData);
      showMessage('保存规则链成功！');
    } catch (error: any) {
      if (error && error.errorFields) {
        showMessage(t('common.validateError'));
      }
      console.log('error', error);
    } finally {
      loading.value = false;
      renderMetaData();
    }

  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (disableSaveButton.value == true) {
    return next();
  }
  createConfirm({
    iconType: 'warning',
    title: `未保存的更改`,
    content: '有未保存的更改。确定要离开此页面吗？',
    okText: '确定',
    okButtonProps: { type: 'primary' },
    onOk: () => next(),
  })
})


// 初始化编辑器
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

  .snap-line {
    .x6-widget-snapline-vertical {
      stroke: rgba(0, 0, 0, 0.4);
      stroke-dasharray: 5
    }

    .x6-widget-snapline-horizontal {
      stroke: rgba(0, 0, 0, 0.4);
      stroke-dasharray: 5
    }

  }

  .selection-box {
    .x6-widget-selection-inner {
      border: 2px dashed rgba(0, 0, 0, 0.9);
      box-shadow: none;
      background-color: rgba(59, 130, 246, 0.1);
    }

    .x6-widget-selection-box-node {
      border: 4px solid red;
      border-radius: 8px;
      width: 194px !important;
      height: 45px !important;
      background-color: rgba(0, 0, 0, 0.3);
    }
  }
}
</style>