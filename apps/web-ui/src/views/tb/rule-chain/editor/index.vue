<script lang="ts" setup name="ViewsTbRuleChainFLowIndex">
import type { Cell, CellView, Edge, EventArgs, Node } from '@antv/x6';

import type {
  RuleChain,
  RuleChainMetaData,
  RuleNode,
  RuleNodeConnection,
  RuleNodeDescriptor,
} from '#/api/tb/rule-chain';
import type { EntityDebugSettings as DebugSettings } from '#/types/tb';

import {
  computed,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router';

import {
  confirm,
  Page,
  useVbenDrawer,
  useVbenModal,
  VbenIconButton,
  VbenLoading,
} from '@vben/common-ui';
import { useBreadcrumb } from '@vben/hooks';
import { IconifyIcon as Icon } from '@vben/icons';
import { usePreferences } from '@vben/preferences';
import { cloneDeep, isEmpty } from '@vben/utils';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VbenContextMenu,
} from '@vben-core/shadcn-ui';

import {
  Clipboard,
  Dnd,
  Graph,
  History,
  Keyboard,
  Selection,
  Snapline,
} from '@antv/x6';
import { getTeleport } from '@antv/x6-vue-shape';
import { onKeyStroke } from '@vueuse/core';
import { message } from 'antdv-next';

import {
  getRuleChainById,
  getRuleChainMetaData,
  getRuleChains,
  getRuleNodeDescriptors,
  saveRuleChainMetaData,
} from '#/api/tb/rule-chain';
import { $t } from '#/locales';
import { loadAllPages } from '#/utils/page-data';

import ConnectTypeForm from './connectTypeForm.vue';
import NodeForm from './form.vue';
import { groupConnections } from './graph-data';
import { registerRuleChainShapes } from './graph-shapes';
import RuleChainNode, { nodeCategories } from './node.vue';
import NodeDetail from './nodeDetail.vue';
const router = useRouter();
const { isDark } = usePreferences();
const { setBreadcrumbTitle, resetBreadcrumbTitle } = useBreadcrumb();
const gridOptions = computed(() => ({
  type: 'doubleMesh',
  args: [
    { color: isDark.value ? '#25252b' : '#eee', thickness: 1 },
    { color: isDark.value ? '#35353d' : '#ddd', thickness: 1, factor: 4 },
  ],
}));

registerRuleChainShapes();

const TeleportContainer = getTeleport();
const inputNodeId = 'input-node-9808-11ee-8b83-9b8f64bdd866';
const record = ref<RuleChain>({} as RuleChain);
const metaData = ref<RuleChainMetaData>();
const nodeDescriptors = ref<Array<RuleNodeDescriptor>>([]);

const graphRef = shallowRef<Graph>();
const containerRef = ref<HTMLElement>();
const isFullscreen = ref(false);
const fullscreenLabel = computed(() =>
  isFullscreen.value
    ? $t('tb.table.exitFullscreen')
    : $t('tb.table.fullscreen'),
);
onKeyStroke('Escape', (event) => {
  if (!event.defaultPrevented) isFullscreen.value = false;
});
let dnd: Dnd | undefined;
const ruleChains = ref<RuleChain[]>([]);
const searchText = ref('');
const expandedGroups = ref<string[]>([]);
const nodeGroups = computed(() => {
  const keyword = searchText.value.trim().toLocaleLowerCase();
  return nodeCategories
    .map((category) => ({
      ...category,
      nodes: nodeDescriptors.value
        .filter(
          (node) =>
            node.type === category.value &&
            node.name.toLocaleLowerCase().includes(keyword),
        )
        .toSorted((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => !keyword || group.nodes.length > 0);
});
watch(searchText, (value) => {
  if (value.trim()) {
    expandedGroups.value = nodeGroups.value.map((group) => group.value);
  }
});

async function handleSwitchRuleChain(value: unknown) {
  if (typeof value !== 'string' || value === record.value.id?.id) {
    return;
  }
  await router.push({
    name: 'RuleChainEditor',
    params: { ruleChainId: value },
  });
}

function handleDragNode(descriptor: RuleNodeDescriptor, event: MouseEvent) {
  const graph = graphRef.value;
  if (!graph || !dnd || loading.value || event.button !== 0) {
    return;
  }
  const definition = descriptor.configurationDescriptor.nodeDefinition;
  const ports = [];
  if (definition.inEnabled) ports.push({ id: 'in_port', group: 'in' });
  if (definition.outEnabled) ports.push({ id: 'out_port', group: 'out' });
  const node = graph.createNode({
    shape: 'rule-chain-node',
    label: descriptor.name,
    data: { descriptor },
    ports: { items: ports },
  });
  dnd.start(node, event);
}

const showDeleteButton = ref(false);
const isDirty = ref(false);
const isInvalid = ref(false);
const disableDebugButton = ref(true);
const loading = ref(false);
const disableSaveButton = computed(
  () => loading.value || !isDirty.value || isInvalid.value,
);

async function loadRuleChain() {
  const ruleChainId = router.currentRoute.value.params.ruleChainId as string;
  if (isEmpty(ruleChainId)) {
    console.error(new Error($t('rule-chain.form.ruleChainEmpty')));
    return;
  }
  const info = await getRuleChainById(ruleChainId);
  if (router.currentRoute.value.params.ruleChainId !== ruleChainId) {
    return;
  }
  record.value = info;
  setBreadcrumbTitle(
    info.root ? `${info.name}${$t('rule-chain.flow.root')}` : info.name,
  );
}

async function loadMetadata() {
  if (!record.value.id?.id) {
    console.error(new Error($t('rule-chain.form.ruleChainEmpty')));
    return;
  }
  metaData.value = await getRuleChainMetaData(record.value.id.id);
}

async function loadNodeDescriptors() {
  nodeDescriptors.value = await getRuleNodeDescriptors('CORE');
}

// 初始化编辑器
async function initGraph() {
  await loadNodeDescriptors();
  if (!containerRef.value) {
    return;
  }
  const graph = new Graph({
    container: containerRef.value,
    background: { color: 'hsl(var(--background))' },
    autoResize: true,
    preventDefaultContextMenu: false,
    grid: {
      visible: true,
      ...gridOptions.value,
    },
    interacting: { nodeMovable: (view) => view.cell.id !== inputNodeId },
    connecting: {
      snap: true,
      highlight: true,
      allowPort: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: false,
      allowEdge: false,
      allowMulti: false,
      createEdge,
      validateEdge,
      validateMagnet,
    },
  });
  graphRef.value = graph;

  dnd = new Dnd({ target: graph });

  graph.use(new History({ enabled: true, beforeAddCommand }));
  graph.use(new Clipboard({ enabled: true }));
  graph.use(new Keyboard({ enabled: true, global: true }));
  graph.use(
    new Snapline({ enabled: true, clean: false, className: 'snap-line' }),
  );
  graph.use(
    new Selection({
      enabled: true,
      rubberband: true,
      className: 'selection-box',
      showNodeSelectionBox: true,
      filter: (cell) => cell.id !== inputNodeId,
    }),
  );

  // 绑定ctrl+c 复制
  graph.bindKey('ctrl+c', () => {
    const cells = graph.getSelectedCells();
    if (cells.length > 0) {
      graph.copy(cells);
    }
    return false;
  });
  // 绑定ctrl+v 粘贴
  graph.bindKey('ctrl+v', () => handlePaste());
  // 绑定ctrl+z 撤销
  graph.bindKey('ctrl+z', () => {
    if (!loading.value && graph.canUndo()) {
      graph.undo();
    }
    return false;
  });

  graph.on('node:added', handleNodeAdded);
  graph.on('edge:connected', handleEdgeConnected);
  graph.on('node:selected', handleNodeSelected);
  graph.on('edge:selected', handleEdgeSelected);
  graph.on('cell:unselected', handleUnselect);
  graph.on('selection:changed', ({ selected }) => {
    showDeleteButton.value = selected.length > 0;
  });
  graph.on('edge:mouseenter', handleEdgeMouseEnter);
  graph.on('edge:mouseleave', handleEdgeMouseLeave);
  graph.on('history:change', updateEditorState);
  graph.on('node:contextmenu', handleNodeContextMenu);
  graph.on('edge:contextmenu', handleEdgeContextMenu);
  graph.on('blank:contextmenu', handleBlankContextMenu);
}

// 规则节点回显数据 绘制
function renderMetadata() {
  if (!graphRef.value) {
    return;
  }
  // 清空画布
  graphRef.value.clearCells();
  // 画根节点
  graphRef.value?.addNode({
    id: inputNodeId,
    shape: 'rule-chain-node',
    x: 30,
    y: 150,
    width: 200,
    height: 50,
    label: 'Input',
    ports: { items: [{ id: 'out_port', group: 'out' }] },
    data: {
      descriptor: {
        name: $t('rule-chain.flow.input'),
        configurationDescriptor: {
          nodeDefinition: {
            description: $t('rule-chain.flow.inputDescription'),
            icon: 'lucide:log-in',
          },
        },
      },
    },
  });

  if (metaData.value?.nodes && metaData.value?.nodes?.length > 0) {
    // 渲染节点
    metaData.value.nodes.forEach((node) => {
      const desc = nodeDescriptors.value.find(
        (comp) => comp.clazz === node.type,
      );
      if (desc && node.id) {
        const portItems: { id: string; group: string }[] = [];
        if (desc.configurationDescriptor?.nodeDefinition.inEnabled === true) {
          portItems.push({ id: 'in_port', group: 'in' });
        }
        if (desc.configurationDescriptor?.nodeDefinition.outEnabled === true) {
          portItems.push({ id: 'out_port', group: 'out' });
        }
        graphRef.value?.addNode({
          id: node.id.id,
          shape: 'rule-chain-node', // 可以直接使用上面注册过的 shape
          x: node.additionalInfo?.layoutX,
          y: node.additionalInfo?.layoutY,
          width: 200,
          height: 50,
          ports: { items: portItems },
          data: { descriptor: desc, data: cloneDeep(node) },
        });
      }
    });
    //  渲染链接的边
    const firstNode = metaData.value.nodes[metaData.value.firstNodeIndex ?? -1];
    if (firstNode?.id) {
      graphRef.value.addEdge({
        shape: 'rule-edge',
        source: { cell: inputNodeId, port: 'out_port' },
        target: {
          cell: firstNode.id.id,
          port: 'in_port',
        },
      });
    }
    if (metaData.value.connections && metaData.value.connections.length > 0) {
      graphRef.value.addEdges(
        groupConnections(metaData.value.connections).map((item) => ({
          shape: 'rule-edge',
          source: {
            cell: metaData.value?.nodes[item.fromIndex]?.id?.id ?? '',
            port: 'out_port',
          },
          target: {
            cell: metaData.value?.nodes[item.toIndex]?.id?.id ?? '',
            port: 'in_port',
          },
          label: item.type.join(' / '),
        })),
      );
    }
  }
  graphRef.value?.cleanSelection();
  graphRef.value?.cleanHistory();
  updateEditorState();
}

// 校验连接柱是否能 接收连接线
function validateEdge(
  this: Graph,
  args: { edge: Edge; type: string; previous: unknown },
) {
  return args.type === 'target' && args.edge.getTargetPortId() === 'in_port';
}
// 校验连接柱是否能 拉出来连接线
function validateMagnet(
  this: Graph,
  args: { cell: Cell; view: CellView; magnet: Element },
) {
  return args.magnet.getAttribute('port-group') === 'out';
}

// 初始换连接线 /边
function createEdge(
  this: Graph,
  args: { sourceCell: Cell; sourceView: CellView; sourceMagnet: Element },
) {
  return this.createEdge({
    shape: 'rule-edge',
    data: {
      customRelations:
        args.sourceCell.data.descriptor.configurationDescriptor.nodeDefinition
          ?.customRelations,
      relationTypes:
        args.sourceCell.data.descriptor.configurationDescriptor.nodeDefinition
          ?.relationTypes,
    },
  });
}

// 边连接成功后 弹框
function handleEdgeConnected({ isNew, edge }: EventArgs['edge:connected']) {
  if (isNew && edge.data.relationTypes?.length > 0) {
    // 新增
    connectionApi.setData({ ...edge.data, edgeId: edge.id }).open();
  }
}

const [ConnectionModal, connectionApi] = useVbenModal({
  connectedComponent: ConnectTypeForm,
  destroyOnClose: true,
});

// 连接线/边类型编辑成功， 更新边上的label
function handleConnectSuccess({
  edgeId,
  currentTypes,
}: {
  edgeId: string;
  currentTypes: string[];
}) {
  if (currentTypes && currentTypes.length > 0) {
    const edge = graphRef.value?.getCellById(edgeId) as Edge;
    edge.setLabels([{ attrs: { label: { text: currentTypes.join(' / ') } } }]);
  }
}

function handleConnectCancel({ edgeId }: { edgeId: string }) {
  graphRef.value?.removeEdge(edgeId);
}

// 节点添加成功
function handleNodeAdded({ node }: EventArgs['node:added']) {
  if (node.id === inputNodeId || node.data.data || !record.value.id) {
    return;
  }
  nodeApi
    .setData({
      ...node.data,
      ruleChainId: record.value.id,
      ruleChainType: record.value.type === 'EDGE' ? 'EDGE' : 'CORE',
      nodeId: node.id,
    })
    .open();
}

const [NodeModal, nodeApi] = useVbenModal({
  connectedComponent: NodeForm,
  destroyOnClose: true,
});

// Node 节点数据编辑成功  更新节点数据
function handleNodeSuccess({
  nodeId,
  data,
}: {
  nodeId: string;
  data: RuleNode;
}) {
  const node = graphRef.value?.getCellById(nodeId) as Node;
  if (node) {
    node.setData({ descriptor: node.data.descriptor, data });
  }
}

function handleNodeCancel({ nodeId }: { nodeId: string }) {
  if (graphRef.value?.canUndo()) {
    graphRef.value?.undo();
  } else {
    graphRef.value?.removeNode(nodeId);
  }
}

const [NodeDrawer, nodeDrawerApi] = useVbenDrawer({
  connectedComponent: NodeDetail,
  destroyOnClose: true,
});

function setEdgeHover(edge: Edge, hovered: boolean) {
  edge.setAttrs({ line: { strokeWidth: hovered ? 6 : 3 } });
  const labels = edge.getLabels();
  if (labels.length === 0) return;
  const radius = hovered ? 12 : 8;
  edge.setLabels({
    attrs: {
      label: { text: labels[0]?.attrs?.label?.text },
      text: { fontSize: hovered ? 18 : 14 },
      rect: { rx: radius, ry: radius },
    },
  });
}

function handleEdgeMouseEnter({ edge }: EventArgs['edge:mouseenter']) {
  setEdgeHover(edge, true);
}

function handleEdgeMouseLeave({ edge }: EventArgs['edge:mouseleave']) {
  setEdgeHover(edge, false);
}

// 节点选中后 添加删除编辑按钮
function handleNodeSelected({ node }: EventArgs['node:selected']) {
  if (graphRef.value?.getSelectedCellCount() === 1) {
    node.addTools([
      {
        name: 'button-remove',
        args: {
          markup: [
            {
              tagName: 'circle',
              selector: 'button',
              attrs: { r: 12, cursor: 'pointer' },
            },
          ],
          x: '100%',
          y: 0,
          offset: { x: 0, y: -10 },
        },
      },
    ]);
  }
}
// 边选中后 添加删除编辑按钮  同时边变成红色
function handleEdgeSelected({ edge }: EventArgs['edge:selected']) {
  if (graphRef.value?.getSelectedCellCount() === 1) {
    const labelRect = { width: 0, height: 0 };
    const rectElement = (
      graphRef.value.findView(edge) as any
    )?.labelContainer?.getElementsByTagName('rect');
    if (rectElement && rectElement.length > 0) {
      labelRect.height = rectElement[0].getAttribute('height');
      labelRect.width = rectElement[0].getAttribute('width');
    }
    edge.addTools([
      {
        name: 'button-remove',
        args: {
          markup: [
            {
              tagName: 'circle',
              selector: 'button',
              attrs: { r: 10, cursor: 'pointer' },
            },
          ],
          distance: labelRect.width === 0 && labelRect.height === 0 ? 0.2 : 0.5,
          offset: { x: labelRect.width / 2, y: -labelRect.height },
        },
      },
    ]);
    edge.setAttrs({ line: { stroke: 'red' } });
    const labels = edge.getLabels();
    if (labels.length > 0) {
      edge.setLabels({
        attrs: {
          label: { text: labels[0]?.attrs?.label?.text },
          text: { stroke: 'red' },
          rect: { stroke: 'red' },
        },
      });
    }
  }
}

// 取消选中
function handleUnselect({ cell }: EventArgs['cell:unselected']) {
  cell.removeTools();
  if (cell.isEdge()) {
    cell.setAttrs({ line: { stroke: '#808080' } });
    const labels = cell.getLabels();
    if (labels.length > 0) {
      cell.setLabels({
        attrs: {
          label: { text: labels[0]?.attrs?.label?.text },
          text: { stroke: 'hsl(var(--primary))' },
          rect: { stroke: 'hsl(var(--primary))' },
        },
      });
    }
  }
}

function beforeAddCommand(event: string, args: any) {
  if (event === 'cell:change:*' && args.key === 'attrs') {
    return false;
  } else if (event === 'cell:change:*' && args.key === 'tools') {
    return false;
  } else if (
    event === 'cell:change:*' &&
    args.key === 'labels' &&
    args.current?.length &&
    args.previous?.length &&
    args.current[0].attrs.label.text === args.previous[0].attrs.label.text
  ) {
    return false;
  }
}

function isDebugEnabled(settings?: DebugSettings | null) {
  return !!(
    settings?.allEnabled ||
    settings?.failuresEnabled ||
    (settings?.allEnabledUntil ?? 0) > Date.now()
  );
}

function updateEditorState() {
  const graph = graphRef.value;
  const nodes =
    graph?.getNodes().filter((node) => node.id !== inputNodeId) ?? [];
  isDirty.value = (graph?.getUndoStackSize() ?? 0) > 0;
  disableDebugButton.value = !nodes.some((node) =>
    isDebugEnabled(node.data?.data?.debugSettings),
  );
  // 节点配置由节点表单校验；画布保存前再检查节点和连线是否完整。
  isInvalid.value =
    nodes.some((node) => {
      const data = node.data?.data as RuleNode | undefined;
      return (
        !node.data?.descriptor ||
        !data?.name?.trim() ||
        !data.type ||
        !data.configuration
      );
    }) ||
    !!graph
      ?.getEdges()
      .some(
        (edge) =>
          !edge.getSourceCell() ||
          !edge.getTargetCell() ||
          (edge.getSourceCellId() !== inputNodeId &&
            !edge.getLabels()[0]?.attrs?.label?.text),
      );
}

function handleDeleteSelection() {
  if (loading.value) return;
  const selectionCells = graphRef.value?.getSelectedCells();
  if (selectionCells?.length) {
    graphRef.value?.removeCells(selectionCells);
  }
  graphRef.value?.cleanSelection();
}

function handleReset() {
  if (loading.value || !isDirty.value) return;
  renderMetadata();
}

function handleResetDebug() {
  const graph = graphRef.value;
  if (loading.value || !graph) return;
  graph.batchUpdate('reset-debug', () => {
    graph.getNodes().forEach((node) => {
      if (
        node.id !== inputNodeId &&
        isDebugEnabled(node.data?.data?.debugSettings)
      ) {
        node.setData({
          ...node.data,
          data: {
            ...node.data.data,
            debugSettings: {
              allEnabled: false,
              failuresEnabled: false,
              allEnabledUntil: 0,
            },
          },
        });
      }
    });
  });
}

// 指定位置粘贴
function handlePaste(x?: number, y?: number) {
  if (loading.value) return false;
  if (graphRef.value && !graphRef.value.isClipboardEmpty()) {
    const graph = graphRef.value;
    // 获取剪贴板中的所有单元
    const cells = graph.getCellsInClipboard();
    // 计算所有节点的边界框
    let minX = Infinity;
    let minY = Infinity;
    cells.forEach((cell) => {
      const position = cell.getProp('position');
      if (position) {
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
      }
    });

    // 计算偏移量，使得左上角节点移动到目标位置
    const dx = x ? x - minX : 35;
    const dy = y ? y - minY : 35;
    // 使用计算出的偏移量进行粘贴
    const pastedCells = graph.paste({ offset: { dx, dy } });
    graph.cleanSelection();
    graph.select(pastedCells);
  }
  return false;
}

const contextItems = ref<
  Array<{
    label: string;
    icon: string;
    divider?: boolean;
    disabled?: boolean;
    handler: () => unknown;
  }>
>([]);
function getContextMenus() {
  return contextItems.value.map((item, index) => ({
    key: item.label,
    text: item.label,
    icon: () => h(Icon, { icon: item.icon }),
    disabled: loading.value || item.disabled,
    separator: item.divider && index < contextItems.value.length - 1,
    handler: item.handler,
  }));
}

// 节点右键菜单
function handleNodeContextMenu({ node }: EventArgs['node:contextmenu']) {
  if (node.id === inputNodeId) {
    contextItems.value = [];
    return;
  }
  contextItems.value = [
    {
      label: $t('rule-chain.flow.details'),
      icon: 'lucide:eye',
      divider: true,
      handler: () =>
        nodeDrawerApi.setData({ ...node.data, nodeId: node.id }).open(),
    },
    {
      label: $t('rule-chain.flow.edit'),
      icon: 'lucide:square-pen',
      divider: true,
      handler: () =>
        nodeApi
          .setData({
            ...node.data,
            ruleChainId: record.value.id,
            ruleChainType: record.value.type === 'EDGE' ? 'EDGE' : 'CORE',
            nodeId: node.id,
          })
          .open(),
    },
    {
      label: `${$t('rule-chain.common.copyText')} (Ctrl+C)`,
      icon: 'lucide:copy',
      divider: true,
      handler: () => graphRef.value?.copy([node]),
    },
    {
      label: $t('rule-chain.common.delText'),
      icon: 'lucide:trash-2',
      divider: true,
      handler: () => graphRef.value?.removeNode(node.id),
    },
  ];
}

// 空白区域右键菜单
function handleBlankContextMenu({ x, y }: EventArgs['blank:contextmenu']) {
  contextItems.value = [
    {
      label: `${$t('rule-chain.common.pasteText')} (Ctrl+V)`,
      icon: 'lucide:clipboard-paste',
      divider: true,
      disabled: graphRef.value?.isClipboardEmpty(),
      handler: () => handlePaste(x, y),
    },
    {
      label: $t('rule-chain.common.selectAllText'),
      icon: 'lucide:square-dashed-mouse-pointer',
      divider: true,
      handler: () => graphRef.value?.select(graphRef.value?.getNodes()),
    },
    {
      label: $t('rule-chain.flow.saveChanges'),
      icon: 'lucide:check',
      divider: true,
      disabled: disableSaveButton.value,
      handler: handleSave,
    },
    {
      label: $t('rule-chain.flow.cancelChanges'),
      icon: 'lucide:undo-2',
      divider: true,
      disabled: loading.value || !isDirty.value,
      handler: handleReset,
    },
  ];
}

// 连接线右键菜单
function handleEdgeContextMenu({ edge }: EventArgs['edge:contextmenu']) {
  if (isEmpty(edge.getLabels())) {
    contextItems.value = [];
    return;
  }
  let data = edge.data;
  if (data === undefined) {
    const node = graphRef.value?.getCellById(edge.getSourceCellId()) as Node;
    data = {
      customRelations:
        node.data.descriptor.configurationDescriptor.nodeDefinition
          ?.customRelations,
      relationTypes:
        node.data.descriptor.configurationDescriptor.nodeDefinition
          ?.relationTypes,
    };
  }
  data.currentTypes = String(
    edge.getLabels()[0]?.attrs?.label?.text ?? '',
  ).split(' / ');
  contextItems.value = [
    {
      label: $t('rule-chain.flow.edit'),
      icon: 'lucide:square-pen',
      divider: true,
      handler: () => connectionApi.setData({ ...data, edgeId: edge.id }).open(),
    },
    {
      label: `${$t('rule-chain.common.copyText')} (Ctrl+C)`,
      icon: 'lucide:copy',
      divider: true,
      handler: () => graphRef.value?.copy([edge]),
    },
    {
      label: $t('rule-chain.common.delText'),
      icon: 'lucide:trash-2',
      divider: true,
      handler: () => graphRef.value?.removeEdge(edge.id),
    },
  ];
}

async function handleSave() {
  updateEditorState();
  const graph = graphRef.value;
  if (!record.value.id || !graph || disableSaveButton.value) {
    return;
  }
  loading.value = true;
  try {
    const graphNodes = graph
      .getNodes()
      .filter((node) => node.id !== inputNodeId);
    const nodeIndexes = new Map(
      graphNodes.map((node, index) => [node.id, index]),
    );
    const nodes = graphNodes.map((node) => {
      const data = node.data.data as RuleNode;
      const position = node.getPosition();
      return {
        ...data,
        additionalInfo: {
          ...data.additionalInfo,
          layoutX: position.x,
          layoutY: position.y,
        },
      };
    });
    const connections: RuleNodeConnection[] = [];
    let firstNodeIndex: null | number = null;
    for (const edge of graph.getEdges()) {
      const toIndex = nodeIndexes.get(edge.getTargetCellId());
      if (toIndex === undefined) continue;
      if (edge.getSourceCellId() === inputNodeId) {
        firstNodeIndex = toIndex;
        continue;
      }
      const fromIndex = nodeIndexes.get(edge.getSourceCellId());
      if (fromIndex === undefined) continue;
      const label = String(edge.getLabels()[0]?.attrs?.label?.text ?? '');
      for (const type of label.split(' / ')) {
        connections.push({ fromIndex, toIndex, type });
      }
    }
    metaData.value = await saveRuleChainMetaData({
      ...metaData.value,
      ruleChainId: record.value.id,
      firstNodeIndex,
      nodes,
      connections: connections.length > 0 ? connections : null,
      ruleChainConnections: null,
    });
    renderMetadata();
    message.success($t('rule-chain.flow.saveSuccess'));
  } finally {
    loading.value = false;
  }
}

async function confirmDiscardChanges() {
  if (!isDirty.value) {
    return true;
  }
  try {
    await confirm({
      title: $t('rule-chain.flow.unsavedChanges'),
      content: $t('rule-chain.flow.unsavedChangesContent'),
    });
    return true;
  } catch {
    return false;
  }
}
onBeforeRouteLeave(confirmDiscardChanges);
onBeforeRouteUpdate(confirmDiscardChanges);
async function handleRefresh() {
  if (loading.value || !(await confirmDiscardChanges())) return;
  await loadEditor();
}

async function loadEditor() {
  loading.value = true;
  resetBreadcrumbTitle();
  try {
    await loadRuleChain();
    if (ruleChains.value.length === 0) {
      ruleChains.value = await loadAllPages((pageLink) =>
        getRuleChains(
          { ...pageLink, sortProperty: 'name', sortOrder: 'ASC' },
          record.value.type === 'EDGE' ? 'EDGE' : 'CORE',
        ),
      );
    }
    if (!graphRef.value) await initGraph();
    await loadMetadata();
    renderMetadata();
  } finally {
    loading.value = false;
  }
}
onMounted(loadEditor);
watch(gridOptions, (options) => graphRef.value?.drawGrid(options));
watch(
  () => router.currentRoute.value.params.ruleChainId,
  (ruleChainId) => {
    if (ruleChainId && containerRef.value) void loadEditor();
  },
);
onBeforeUnmount(() => {
  dnd?.dispose();
  graphRef.value?.dispose();
});
</script>

<template>
  <Page auto-content-height>
    <Teleport to="body" :disabled="!isFullscreen">
      <div
        class="rule-chain-edit bg-card flex h-full min-h-0 overflow-hidden"
        :class="isFullscreen ? 'fixed inset-0 z-[1000]' : 'relative rounded-lg'"
      >
        <aside
          class="flex w-64 shrink-0 flex-col border-r"
          :aria-label="$t('rule-chain.editor.nodeLibrary')"
        >
          <div class="space-y-3 border-b p-2">
            <Select
              :model-value="record.id?.id ?? ''"
              :disabled="loading"
              @update:model-value="handleSwitchRuleChain"
            >
              <SelectTrigger
                class="w-full"
                :aria-label="$t('rule-chain.editor.switchRuleChain')"
              >
                <Icon icon="lucide:workflow" class="text-primary size-4" />
                <SelectValue
                  class="min-w-0 flex-1 text-left"
                  :placeholder="$t('rule-chain.editor.switchRuleChain')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="chain in ruleChains"
                  :key="chain.id?.id"
                  :value="chain.id?.id ?? ''"
                >
                  {{ chain.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <div class="relative">
              <Icon
                icon="lucide:search"
                class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              />
              <Input
                v-model="searchText"
                class="h-9 pl-9"
                :placeholder="$t('rule-chain.editor.searchNodes')"
                :aria-label="$t('rule-chain.editor.searchNodes')"
              />
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-2">
            <Accordion v-model="expandedGroups" type="multiple" class="mt-3">
              <AccordionItem
                v-for="group in nodeGroups"
                :key="group.value"
                :value="group.value"
                class="border-border border-b last:border-b-0"
              >
                <AccordionTrigger
                  class="bg-muted items-center rounded-none px-3 py-3 hover:no-underline"
                >
                  <span class="flex min-w-0 flex-1 items-center gap-2">
                    <Icon :icon="group.icon" class="size-4 shrink-0" />
                    <span>{{ group.label }}</span>
                    <span
                      class="text-muted-foreground ml-auto text-xs tabular-nums"
                      v-text="group.nodes.length"
                    ></span>
                  </span>
                </AccordionTrigger>
                <AccordionContent class="space-y-3 px-3 pb-3 pt-3">
                  <button
                    v-for="node in group.nodes"
                    :key="node.clazz"
                    type="button"
                    class="focus-visible:ring-ring block h-[50px] w-full cursor-grab rounded-lg text-left outline-none focus-visible:ring-2 active:cursor-grabbing disabled:opacity-50"
                    :disabled="loading"
                    :aria-label="node.name"
                    @mousedown="handleDragNode(node, $event)"
                  >
                    <RuleChainNode :descriptor="node" show-ports />
                  </button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p
              v-if="nodeGroups.length === 0"
              class="text-muted-foreground px-3 py-8 text-center text-sm"
            >
              {{ $t('rule-chain.editor.noNodes') }}
            </p>
          </div>
        </aside>
        <VbenContextMenu
          :modal="false"
          :menus="getContextMenus"
          :content-class="contextItems.length ? 'min-w-44' : 'hidden'"
        >
          <div
            class="relative min-w-0 flex-1 overflow-hidden"
            :aria-label="$t('rule-chain.editor.title')"
          >
            <div
              ref="containerRef"
              class="edit-container h-full w-full"
              tabindex="0"
            ></div>
            <div class="absolute right-4 top-4 flex items-center gap-3">
              <VbenIconButton
                class="size-12 rounded-full shadow-sm"
                variant="outline"
                :disabled="loading"
                :tooltip="$t('tb.common.refresh')"
                @click="handleRefresh"
              >
                <Icon icon="lucide:refresh-cw" class="size-4" />
                <span class="sr-only">{{ $t('tb.common.refresh') }}</span>
              </VbenIconButton>
              <VbenIconButton
                class="size-12 rounded-full shadow-sm"
                variant="outline"
                :tooltip="fullscreenLabel"
                @click="isFullscreen = !isFullscreen"
              >
                <Icon
                  :icon="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'"
                  class="size-4"
                />
                <span class="sr-only">{{ fullscreenLabel }}</span>
              </VbenIconButton>
            </div>
            <div class="absolute bottom-4 right-4 flex items-center gap-3">
              <VbenIconButton
                v-if="showDeleteButton"
                class="text-destructive size-12 rounded-full shadow-sm hover:text-destructive"
                variant="outline"
                :disabled="loading"
                :tooltip="$t('rule-chain.flow.deleteSelection')"
                @click="handleDeleteSelection"
              >
                <Icon icon="lucide:trash-2" class="size-4" />
                <span class="sr-only">{{
                  $t('rule-chain.flow.deleteSelection')
                }}</span>
              </VbenIconButton>
              <VbenIconButton
                class="size-12 rounded-full shadow-sm"
                variant="outline"
                :disabled="loading || disableDebugButton"
                :tooltip="$t('rule-chain.flow.resetDebug')"
                @click="handleResetDebug"
              >
                <Icon icon="lucide:bug-off" class="size-4" />
                <span class="sr-only">{{
                  $t('rule-chain.flow.resetDebug')
                }}</span>
              </VbenIconButton>
              <VbenIconButton
                class="size-12 rounded-full shadow-sm"
                variant="outline"
                :disabled="loading || !isDirty"
                :tooltip="$t('rule-chain.flow.cancelChanges')"
                @click="handleReset"
              >
                <Icon icon="lucide:undo-2" class="size-4" />
                <span class="sr-only">{{
                  $t('rule-chain.flow.cancelChanges')
                }}</span>
              </VbenIconButton>
              <VbenIconButton
                class="size-12 rounded-full shadow-sm"
                variant="default"
                :disabled="disableSaveButton"
                :tooltip="$t('rule-chain.flow.saveChanges')"
                @click="handleSave"
              >
                <Icon icon="lucide:check" class="size-4" />
                <span class="sr-only">{{
                  $t('rule-chain.flow.saveChanges')
                }}</span>
              </VbenIconButton>
            </div>
          </div>
        </VbenContextMenu>
        <VbenLoading :spinning="loading" />
      </div>
    </Teleport>
    <TeleportContainer />
    <ConnectionModal
      @success="handleConnectSuccess"
      @cancel="handleConnectCancel"
    />
    <NodeModal @success="handleNodeSuccess" @cancel="handleNodeCancel" />
    <NodeDrawer @success="handleNodeSuccess" />
  </Page>
</template>
<style lang="less">
.rule-chain-edit {
  foreignObject body {
    min-height: 0;
    height: 100%;
    background: transparent;
  }

  .snap-line {
    .x6-widget-snapline-vertical {
      stroke: hsl(var(--foreground) / 40%);
      stroke-dasharray: 5;
    }

    .x6-widget-snapline-horizontal {
      stroke: hsl(var(--foreground) / 40%);
      stroke-dasharray: 5;
    }
  }

  .selection-box {
    .x6-widget-selection-inner {
      border: 2px dashed hsl(var(--foreground) / 90%);
      box-shadow: none;
      background-color: hsl(var(--primary) / 10%);
    }

    .x6-widget-selection-box-node {
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: transparent;
      box-shadow: none;
    }
  }
}
</style>
