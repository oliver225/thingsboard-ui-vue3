import { Graph } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';

import RuleChainNode from './node.vue';

export function registerRuleChainShapes() {
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
  });
  Graph.registerEdge(
    'rule-edge',
    {
      inherit: 'edge',
      attrs: { line: { connection: true, stroke: '#808080', strokeWidth: 3 } },
      connector: { name: 'smooth', args: { direction: 'H' } },
      defaultLabel: {
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'text', selector: 'label' },
        ],
        attrs: {
          text: {
            fill: 'hsl(var(--primary))',
            fontSize: 14,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            stroke: 'hsl(var(--primary))',
          },
          rect: {
            ref: 'label',
            stroke: 'hsl(var(--primary))',
            strokeWidth: 2,
            fill: 'hsl(var(--background))',
            rx: 8,
            ry: 8,
            refWidth: 12,
            refHeight: 4,
            refX: -6,
            refY: -1,
          },
        },
        position: { distance: 0.5 },
      },
    },
    true,
  );
}
