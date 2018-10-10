// the property on a node under which we store its index
export const howdjuNodeDataKeyKey = 'howdjuNodeDataKey'

// The data for each node, stored by its index
const nodeDatas = {}
// The value we'll increment to give each node a unique index in `nodeDatas`
let currNodeDataIndex = 0

export function getNodeData(node, key) {
  const nodeDataKey = node[howdjuNodeDataKeyKey]
  if (nodeDataKey) return nodeDatas[nodeDataKey][key]
}

export function setNodeData(node, key, value) {
  let nodeKey = node[howdjuNodeDataKeyKey]
  if (!nodeKey) {
    node[howdjuNodeDataKeyKey] = nodeKey = ++currNodeDataIndex
  }
  let nodeData = nodeDatas[nodeKey]
  if (!nodeData) {
    nodeDatas[nodeKey] = nodeData = {}
  }
  nodeData[key] = value
}