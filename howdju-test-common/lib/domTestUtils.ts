export function getElementById(id: string, doc: Document = document) {
  const element = doc.getElementById(id);
  if (!element) {
    throw new Error(`Could not find element with id ${id}`);
  }
  return element;
}

export function getFirstChild(node: Node) {
  if (!node.firstChild) {
    throw new Error(`No first child`);
  }
  return node.firstChild;
}

export function getLastChild(node: Node) {
  if (!node.lastChild) {
    throw new Error(`No last child`);
  }
  return node.lastChild;
}
