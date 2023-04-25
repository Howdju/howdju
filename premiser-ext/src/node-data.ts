import { toNumber } from "lodash";

// the property on a node under which we store its index
export const howdjuNodeDataKeyKey = "data-howdju-key";

// The data for each node, stored by its index
const nodeDatas: Record<number, Record<string, any>> = {};
// The value we'll increment to give each node a unique index in `nodeDatas`
let currNodeDataIndex = 0;

export function getNodeData<T>(node: Node, key: string): T | undefined {
  if (!("getAttribute" in node)) {
    return undefined;
  }
  const nodeDataKey = (node as any)[howdjuNodeDataKeyKey];
  if (nodeDataKey) return nodeDatas[toNumber(nodeDataKey)][key];
  return undefined;
}

export function setNodeData(node: Element, key: string, value: any) {
  let nodeKey = (node as any)[howdjuNodeDataKeyKey];
  if (!nodeKey) {
    nodeKey = ++currNodeDataIndex;
    (node as any)[howdjuNodeDataKeyKey] = nodeKey;
  }
  let nodeData = nodeDatas[nodeKey];
  if (!nodeData) {
    nodeDatas[nodeKey] = nodeData = {};
  }
  nodeData[key] = value;
}
