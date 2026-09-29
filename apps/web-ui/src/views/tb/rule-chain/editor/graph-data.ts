import type { RuleNodeConnection } from '#/api/tb/rule-chain';

interface ConnectionGroup {
  fromIndex: number;
  toIndex: number;
  type: string[];
}

/** 同一对节点的关联共用一条边，保留关联的原始顺序。 */
export function groupConnections(
  connections: RuleNodeConnection[],
): ConnectionGroup[] {
  const groups = new Map<string, ConnectionGroup>();
  for (const { fromIndex, toIndex, type } of connections) {
    const key = `${fromIndex}:${toIndex}`;
    const group = groups.get(key);
    if (group) {
      group.type.push(type);
    } else {
      groups.set(key, { fromIndex, toIndex, type: [type] });
    }
  }
  return [...groups.values()];
}
